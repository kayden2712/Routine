package com.example.be.service;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Locale;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.be.dto.request.InventoryAdjustRequest;
import com.example.be.dto.request.InventoryAdjustRequest.AdjustMode;
import com.example.be.dto.response.InventoryReportResponse;
import com.example.be.dto.response.InventoryHistoryResponse;
import com.example.be.dto.response.ProductSimpleResponse;
import com.example.be.dto.response.UserSimpleResponse;
import com.example.be.entity.InventoryHistory;
import com.example.be.entity.Product;
import com.example.be.entity.User;
import com.example.be.entity.enums.InventoryChangeType;
import com.example.be.exception.BadRequestException;
import com.example.be.exception.ResourceNotFoundException;
import com.example.be.repository.InventoryHistoryRepository;
import com.example.be.repository.ProductRepository;
import com.example.be.repository.UserRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class InventoryManagementServiceImpl implements InventoryManagementService {

    private static final DateTimeFormatter ADJUST_DOC_FORMAT = DateTimeFormatter.ofPattern("yyyyMMddHHmmss");

    private final ProductRepository productRepository;
    private final InventoryHistoryRepository lichSuTonKhoRepository;
    private final UserRepository userRepository;
    private final InventoryService inventoryService;

    @Override
    public List<InventoryReportResponse> getInventoryReport(String keyword, boolean lowStockOnly) {
        String normalizedKeyword = keyword == null ? "" : keyword.trim().toLowerCase(Locale.ROOT);

        return productRepository.findAll().stream()
                .filter(product -> normalizedKeyword.isEmpty()
                        || product.getCode().toLowerCase(Locale.ROOT).contains(normalizedKeyword)
                        || product.getName().toLowerCase(Locale.ROOT).contains(normalizedKeyword))
                .map(this::toReportResponse)
                .filter(report -> !lowStockOnly || Boolean.TRUE.equals(report.getIsLowStock()))
                .toList();
    }

    @Override
    public Page<InventoryHistoryResponse> getInventoryHistory(Long productId, int page, int size) {
        Pageable pageable = PageRequest.of(Math.max(page, 0), Math.max(size, 1));
        Page<InventoryHistory> historyPage = productId == null
                ? lichSuTonKhoRepository.findAllByOrderByThoiGianDesc(pageable)
                : lichSuTonKhoRepository.findByProductId(productId, pageable);

        return historyPage.map(this::toHistoryResponse);
    }

    @Override
    @Transactional
    public InventoryReportResponse adjustStock(InventoryAdjustRequest request, String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + userEmail));

        Long productId = request.getProductId();
        if (productId == null) {
            throw new BadRequestException("Product ID is required");
        }

        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found"));

        Integer currentStockValue = product.getStock();
        Integer quantityValue = request.getQuantity();
        int currentStock = currentStockValue != null ? currentStockValue : 0;
        int quantity = quantityValue != null ? quantityValue : 0;
        AdjustMode mode = request.getMode();

        if ((mode == AdjustMode.IN || mode == AdjustMode.OUT) && quantity <= 0) {
            throw new BadRequestException("Quantity must be > 0 for IN/OUT mode");
        }

        int targetStock = switch (mode) {
            case IN -> currentStock + quantity;
            case OUT -> {
                int stockAfterExport = currentStock - quantity;
                if (stockAfterExport < 0) {
                    throw new BadRequestException("Not enough stock to export");
                }
                yield stockAfterExport;
            }
            case SET -> quantity;
        };

        String adjustCode = "ADJ-" + LocalDateTime.now().format(ADJUST_DOC_FORMAT);
        String note = buildAdjustNote(mode, request.getNote());

        inventoryService.adjustInventoryAfterStocktake(
                product.getId(),
                targetStock,
                adjustCode,
                user,
                note);

        Long refreshedProductId = product.getId();
        if (refreshedProductId == null) {
            throw new ResourceNotFoundException("Product not found");
        }

        Product refreshed = productRepository.findById(refreshedProductId)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found"));
        return toReportResponse(refreshed);
    }

    private InventoryReportResponse toReportResponse(Product product) {
        Integer currentStockValue = product.getStock();
        Integer minStockValue = product.getMinStock();
        int currentStock = currentStockValue != null ? currentStockValue : 0;
        int minStock = minStockValue != null ? minStockValue : 0;

        Long totalNhapRaw = lichSuTonKhoRepository.sumPositiveChangesByProductId(product.getId());
        Long totalXuatRaw = lichSuTonKhoRepository.sumNegativeChangesByProductId(product.getId());

        return new InventoryReportResponse(
                product.getId(),
                product.getCode(),
                product.getName(),
                currentStock,
                minStock,
                currentStock <= minStock,
                lichSuTonKhoRepository.findLatestThoiGianByProductId(product.getId()),
                totalNhapRaw == null ? 0 : totalNhapRaw.intValue(),
                totalXuatRaw == null ? 0 : totalXuatRaw.intValue());
    }

    private InventoryHistoryResponse toHistoryResponse(InventoryHistory history) {
        Product product = history.getProduct();
        InventoryChangeType changeType = (InventoryChangeType) history.getLoaiThayDoi();

        return new InventoryHistoryResponse(
                history.getId(),
                new ProductSimpleResponse(
                        product.getId(),
                        product.getCode(),
                        product.getName(),
                        product.getStock()),
                changeType,
                history.getSoLuongTruoc(),
                history.getSoLuongThayDoi(),
                history.getSoLuongSau(),
                history.getMaChungTu(),
                history.getChungTuType(),
                new UserSimpleResponse(
                        history.getNguoiThucHien().getId(),
                        history.getNguoiThucHien().getEmail(),
                        history.getNguoiThucHien().getFullName()),
                history.getGhiChu(),
                history.getThoiGian());
    }

    private String buildAdjustNote(AdjustMode mode, String note) {
        String prefix = switch (mode) {
            case IN -> "Manual stock in";
            case OUT -> "Manual stock out";
            case SET -> "Manual stock set";
        };

        if (note == null || note.isBlank()) {
            return prefix;
        }

        return prefix + ": " + note.trim();
    }
}
