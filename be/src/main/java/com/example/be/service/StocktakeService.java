package com.example.be.service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.be.dto.request.StocktakeRequest;
import com.example.be.dto.request.UpdateStocktakeItemsRequest;
import com.example.be.dto.response.StocktakeDetailResponse;
import com.example.be.dto.response.StocktakeResponse;
import com.example.be.entity.Product;
import com.example.be.entity.Stocktake;
import com.example.be.entity.StocktakeDetail;
import com.example.be.entity.User;
import com.example.be.entity.enums.StocktakeStatus;
import com.example.be.exception.BadRequestException;
import com.example.be.exception.ResourceNotFoundException;
import com.example.be.repository.ProductRepository;
import com.example.be.repository.StocktakeDetailRepository;
import com.example.be.repository.StocktakeRepository;

import lombok.RequiredArgsConstructor;

/**
 * Service quan ly kiem ke kho
 */
@Service
@RequiredArgsConstructor
@SuppressWarnings("null")
public class StocktakeService {

    private static final Logger logger = LoggerFactory.getLogger(StocktakeService.class);
    private static final double LARGE_DISCREPANCY_THRESHOLD = 0.1;

    private final StocktakeRepository stocktakeRepository;
    private final StocktakeDetailRepository stocktakeDetailRepository;
    private final ProductRepository productRepository;
    private final InventoryService inventoryService;

    @Transactional
    public StocktakeResponse createStocktake(StocktakeRequest request, User user) {
        logger.info("Creating stocktake by user: {}", user.getEmail());

        if (stocktakeRepository.hasActiveStocktake()) {
            throw new BadRequestException("An active stocktake already exists. Complete it before creating a new one.");
        }

        Stocktake stocktake = new Stocktake();
        stocktake.setMaKiemKe(request.getMaKiemKe() != null ? request.getMaKiemKe() : generateStocktakeCode());
        stocktake.setNgayKiemKe(request.getNgayKiemKe());
        stocktake.setTrangThai(StocktakeStatus.DANG_KIEM);
        stocktake.setNguoiKiem(user);
        stocktake.setGhiChu(request.getGhiChu());
        stocktake = stocktakeRepository.save(stocktake);

        List<Product> allProducts = productRepository.findAll();
        for (Product product : allProducts) {
            StocktakeDetail detail = new StocktakeDetail();
            detail.setKiemKe(stocktake);
            detail.setProduct(product);
            detail.setSoLuongHeThong(product.getStock());
            detail.setSoLuongThucTe(null);
            detail.setChenhLech(null);
            stocktakeDetailRepository.save(detail);
        }

        logger.info("Created stocktake {} with {} products", stocktake.getMaKiemKe(), allProducts.size());
        return mapToResponse(stocktake);
    }

    @Transactional
    public void updateStocktakeItems(Long stocktakeId, UpdateStocktakeItemsRequest request) {
        logger.info("Updating stocktake details for {}", stocktakeId);

        Stocktake stocktake = stocktakeRepository.findById(stocktakeId)
                .orElseThrow(() -> new ResourceNotFoundException("Stocktake not found"));

        if (stocktake.getTrangThai() != StocktakeStatus.DANG_KIEM) {
            throw new BadRequestException("Only active stocktake can be updated");
        }

        for (UpdateStocktakeItemsRequest.StocktakeItemUpdate item : request.getItems()) {
            StocktakeDetail detail = stocktakeDetailRepository
                    .findByStocktakeIdAndProductId(stocktakeId, item.getProductId())
                    .orElseThrow(() -> new ResourceNotFoundException(
                            "Product ID " + item.getProductId() + " is not in this stocktake"));

            detail.setSoLuongThucTe(item.getActualQuantity());
            detail.updateChenhLech();
            if (item.getNote() != null) {
                detail.setGhiChu(item.getNote());
            }
            stocktakeDetailRepository.save(detail);
        }

        logger.info("Updated {} products in stocktake {}", request.getItems().size(), stocktake.getMaKiemKe());
    }

    @Transactional
    public StocktakeResponse completeStocktake(Long stocktakeId, User user) {
        logger.info("Completing stocktake {} by {}", stocktakeId, user.getEmail());

        Stocktake stocktake = stocktakeRepository.findById(stocktakeId)
                .orElseThrow(() -> new ResourceNotFoundException("Stocktake not found"));

        if (stocktake.getTrangThai() != StocktakeStatus.DANG_KIEM) {
            throw new BadRequestException("Stocktake is already completed or canceled");
        }

        List<StocktakeDetail> details = stocktakeDetailRepository.findByStocktakeId(stocktakeId);

        long pendingCount = details.stream()
                .filter(d -> d.getSoLuongThucTe() == null)
                .count();
        if (pendingCount > 0) {
            throw new BadRequestException(String.format("Still %d products without actual quantity", pendingCount));
        }

        List<StocktakeDetail> largeDiscrepancies = details.stream()
                .filter(this::hasLargeDiscrepancy)
                .toList();

        if (!largeDiscrepancies.isEmpty()) {
            logger.warn("Detected {} products with discrepancy >10%", largeDiscrepancies.size());
        }

        for (StocktakeDetail detail : details) {
            if (detail.getChenhLech() != null && detail.getChenhLech() != 0) {
                inventoryService.adjustInventoryAfterStocktake(
                        detail.getProduct().getId(),
                        detail.getSoLuongThucTe(),
                        stocktake.getMaKiemKe(),
                        user,
                        detail.getGhiChu());
            }
        }

        stocktake.setTrangThai(StocktakeStatus.HOAN_THANH);
        stocktake.setNgayHoanThanh(LocalDateTime.now());
        stocktake = stocktakeRepository.save(stocktake);

        logger.info("Completed stocktake {} with {} discrepant products",
                stocktake.getMaKiemKe(),
                details.stream().filter(d -> d.getChenhLech() != 0).count());

        return mapToResponse(stocktake);
    }

    @Transactional
    public void cancelStocktake(Long stocktakeId, User user) {
        logger.info("Canceling stocktake {} by {}", stocktakeId, user.getEmail());

        Stocktake stocktake = stocktakeRepository.findById(stocktakeId)
                .orElseThrow(() -> new ResourceNotFoundException("Stocktake not found"));

        if (stocktake.getTrangThai() != StocktakeStatus.DANG_KIEM) {
            throw new BadRequestException("Only active stocktake can be canceled");
        }

        stocktake.setTrangThai(StocktakeStatus.HUY);
        stocktakeRepository.save(stocktake);

        logger.info("Canceled stocktake {}", stocktake.getMaKiemKe());
    }

    @Transactional(readOnly = true)
    public StocktakeResponse getStocktakeById(Long stocktakeId) {
        Stocktake stocktake = stocktakeRepository.findById(stocktakeId)
                .orElseThrow(() -> new ResourceNotFoundException("Stocktake not found"));
        return mapToResponse(stocktake);
    }

    private boolean hasLargeDiscrepancy(StocktakeDetail detail) {
        if (detail.getChenhLech() == null || detail.getSoLuongHeThong() == 0) {
            return false;
        }
        double absDiscrepancy = Math.abs(detail.getChenhLech());
        return absDiscrepancy > (detail.getSoLuongHeThong() * LARGE_DISCREPANCY_THRESHOLD);
    }

    private String generateStocktakeCode() {
        String prefix = "KK";
        String dateStamp = LocalDate.now().toString().replace("-", "");
        long count = stocktakeRepository.count() + 1;
        return String.format("%s%s%03d", prefix, dateStamp, count);
    }

    private StocktakeResponse mapToResponse(Stocktake stocktake) {
        List<StocktakeDetailResponse> detailResponses = (stocktake.getChiTietList() == null ? List.<StocktakeDetail>of()
                : stocktake.getChiTietList()).stream()
                .map(detail -> new StocktakeDetailResponse(
                        detail.getId(),
                        new com.example.be.dto.response.ProductSimpleResponse(
                                detail.getProduct().getId(),
                                detail.getProduct().getCode(),
                                detail.getProduct().getName(),
                                detail.getProduct().getStock()),
                        detail.getSoLuongHeThong(),
                        detail.getSoLuongThucTe(),
                        detail.getChenhLech(),
                        detail.getGhiChu()))
                .toList();

        int totalDiscrepancy = detailResponses.stream()
                .map(StocktakeDetailResponse::getChenhLech)
                .filter(value -> value != null)
                .mapToInt(value -> Math.abs(value))
                .sum();

        return new StocktakeResponse(
                stocktake.getId(),
                stocktake.getMaKiemKe(),
                stocktake.getNgayKiemKe(),
                stocktake.getTrangThai(),
                new com.example.be.dto.response.UserSimpleResponse(
                        stocktake.getNguoiKiem().getId(),
                        stocktake.getNguoiKiem().getEmail(),
                        stocktake.getNguoiKiem().getFullName()),
                stocktake.getGhiChu(),
                stocktake.getNgayHoanThanh(),
                detailResponses,
                detailResponses.size(),
                totalDiscrepancy,
                stocktake.getCreatedAt(),
                stocktake.getUpdatedAt());
    }
}
