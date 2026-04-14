package com.example.be.service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.be.dto.request.InventoryCheckConfirmRequest;
import com.example.be.dto.request.InventoryCheckApproveRequest;
import com.example.be.dto.request.InventoryCheckSubmitRequest;
import com.example.be.dto.response.InventoryCheckItemResponse;
import com.example.be.dto.response.InventoryCheckListResponse;
import com.example.be.dto.response.InventoryCheckSessionResponse;
import com.example.be.dto.response.InventoryDiscrepancyReportResponse;
import com.example.be.dto.response.UserSimpleResponse;
import com.example.be.entity.InventoryCheckAudit;
import com.example.be.entity.Product;
import com.example.be.entity.Stocktake;
import com.example.be.entity.StocktakeDetail;
import com.example.be.entity.User;
import com.example.be.entity.enums.InventoryCheckStatus;
import com.example.be.entity.enums.StocktakeStatus;
import com.example.be.exception.BadRequestException;
import com.example.be.exception.ResourceNotFoundException;
import com.example.be.repository.InventoryCheckAuditRepository;
import com.example.be.repository.ProductRepository;
import com.example.be.repository.StocktakeDetailRepository;
import com.example.be.repository.StocktakeRepository;
import com.example.be.repository.UserRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
@Transactional
@SuppressWarnings("null")
public class InventoryCheckService {

    @Value("${inventory.check.warning-threshold:0.1}")
    private double warningThreshold;

    private final StocktakeRepository stocktakeRepository;
    private final StocktakeDetailRepository stocktakeDetailRepository;
    private final ProductRepository productRepository;
    private final UserRepository userRepository;
    private final InventoryCheckAuditRepository inventoryCheckAuditRepository;

    public InventoryCheckListResponse getInventoryItems(String userEmail, LocalDate checkDate) {
        User user = findUserByEmail(userEmail);
        LocalDate targetDate = checkDate == null ? LocalDate.now() : checkDate;
        Stocktake stocktake = getOrCreateStocktakeByDate(user, targetDate);

        List<InventoryCheckItemResponse> items = stocktakeDetailRepository.findByStocktakeId(stocktake.getId()).stream()
                .map(detail -> toItemResponse(stocktake.getId(), detail))
                .toList();

        return new InventoryCheckListResponse(
                stocktake.getId(),
                stocktake.getMaKiemKe(),
                stocktake.getNgayKiemKe(),
                stocktake.getTrangThai(),
                warningThreshold,
                items);
    }

    public List<InventoryCheckSessionResponse> getInventorySessions(String userEmail) {
        User user = findUserByEmail(userEmail);

        // Ensure day-to-day workflow always has a stocktake sheet for today.
        getOrCreateStocktakeByDate(user, LocalDate.now());

        List<Stocktake> stocktakes = stocktakeRepository.findAllByOrderByNgayKiemKeDescCreatedAtDesc();
        if (stocktakes.isEmpty()) {
            return List.of();
        }

        List<Long> stocktakeIds = stocktakes.stream().map(Stocktake::getId).toList();
        Map<Long, ProgressAggregate> progressByStocktakeId = summarizeProgress(stocktakeIds);

        return stocktakes.stream()
                .map(stocktake -> {
                    ProgressAggregate progress = progressByStocktakeId.getOrDefault(stocktake.getId(), ProgressAggregate.ZERO);
                    return new InventoryCheckSessionResponse(
                            stocktake.getId(),
                            stocktake.getMaKiemKe(),
                            stocktake.getNgayKiemKe(),
                            stocktake.getTrangThai(),
                            progress.totalItems(),
                            progress.checkedItems(),
                            resolveEvaluation(progress.checkedItems(), progress.totalDiscrepancy()));
                })
                .toList();
    }

    @Transactional
    public InventoryCheckItemResponse submitCheck(String userEmail, InventoryCheckSubmitRequest request) {
        User user = findUserByEmail(userEmail);
        Stocktake stocktake = findStocktake(request.getStocktakeId());
        ensureStocktakeActive(stocktake);

        StocktakeDetail detail = stocktakeDetailRepository
                .findByStocktakeIdAndProductId(stocktake.getId(), request.getItemId())
                .orElseThrow(() -> new ResourceNotFoundException("Inventory item not found in this stocktake"));

        detail.setSoLuongThucTe(request.getActualQty());
        detail.updateChenhLech();
        if (request.getNote() != null) {
            detail.setGhiChu(request.getNote());
        }
        stocktakeDetailRepository.save(detail);

        InventoryCheckStatus status = InventoryDiscrepancyCalculator.resolveStatus(
                detail.getSoLuongHeThong(),
                detail.getSoLuongThucTe(),
                warningThreshold);

        createAudit(stocktake, detail.getProduct(), detail.getSoLuongHeThong(), detail.getSoLuongThucTe(),
                detail.getChenhLech(), status, user, detail.getGhiChu());

        return toItemResponse(stocktake.getId(), detail);
    }

    @Transactional
    public InventoryCheckListResponse approveStocktake(String userEmail, InventoryCheckApproveRequest request) {
        findUserByEmail(userEmail);
        Stocktake stocktake = findStocktake(request.getStocktakeId());
        ensureStocktakeActive(stocktake);

        List<StocktakeDetail> details = stocktakeDetailRepository.findByStocktakeId(stocktake.getId());
        long pendingCount = details.stream().filter(detail -> detail.getSoLuongThucTe() == null).count();
        if (pendingCount > 0) {
            throw new BadRequestException(String.format("Con %d san pham chua luu so luong thuc te", pendingCount));
        }

        stocktake.setTrangThai(StocktakeStatus.HOAN_THANH);
        stocktake.setNgayHoanThanh(LocalDateTime.now());
        stocktakeRepository.save(stocktake);

        List<InventoryCheckItemResponse> items = details.stream()
                .map(detail -> toItemResponse(stocktake.getId(), detail))
                .toList();

        return new InventoryCheckListResponse(
                stocktake.getId(),
                stocktake.getMaKiemKe(),
                stocktake.getNgayKiemKe(),
                stocktake.getTrangThai(),
                warningThreshold,
                items);
    }

    public InventoryDiscrepancyReportResponse getDiscrepancyReport(Long stocktakeId) {
        Stocktake stocktake = stocktakeId == null
                ? stocktakeRepository.findActiveStocktake().orElseThrow(() -> new ResourceNotFoundException("No active stocktake found"))
                : findStocktake(stocktakeId);

        List<InventoryCheckItemResponse> items = stocktakeDetailRepository.findByStocktakeId(stocktake.getId()).stream()
                .map(detail -> toItemResponse(stocktake.getId(), detail))
                .toList();

        int checkedItems = (int) items.stream().filter(item -> item.getActualQty() != null).count();
        int discrepancyItems = (int) items.stream().filter(item -> item.getDiscrepancy() != null && item.getDiscrepancy() != 0)
                .count();
        int warningItems = (int) items.stream().filter(InventoryCheckItemResponse::isWarning).count();

        return new InventoryDiscrepancyReportResponse(
                stocktake.getId(),
                stocktake.getMaKiemKe(),
                stocktake.getNgayKiemKe(),
                items.size(),
                checkedItems,
                discrepancyItems,
                warningItems,
                items);
    }

    @Transactional
    public InventoryCheckItemResponse confirmCheck(String userEmail, InventoryCheckConfirmRequest request) {
        User user = findUserByEmail(userEmail);
        Stocktake stocktake = findStocktake(request.getStocktakeId());
        ensureStocktakeActive(stocktake);

        StocktakeDetail detail = stocktakeDetailRepository
                .findByStocktakeIdAndProductId(stocktake.getId(), request.getItemId())
                .orElseThrow(() -> new ResourceNotFoundException("Inventory item not found in this stocktake"));

        if (request.getAction() == InventoryCheckConfirmRequest.Action.RECHECK) {
            detail.setSoLuongThucTe(null);
            detail.updateChenhLech();
            if (request.getNote() != null) {
                detail.setGhiChu(request.getNote());
            }
            stocktakeDetailRepository.save(detail);

            createAudit(stocktake, detail.getProduct(), detail.getSoLuongHeThong(), null, null,
                    InventoryCheckStatus.RECHECK_REQUIRED, user, request.getNote());

            return toItemResponse(stocktake.getId(), detail);
        }

        if (detail.getSoLuongThucTe() == null) {
            throw new BadRequestException("Cannot confirm item without actual quantity");
        }

        createAudit(stocktake, detail.getProduct(), detail.getSoLuongHeThong(), detail.getSoLuongThucTe(),
                detail.getChenhLech(), InventoryCheckStatus.CONFIRMED, user, request.getNote());

        if (request.getNote() != null && !request.getNote().isBlank()) {
            detail.setGhiChu(request.getNote());
            stocktakeDetailRepository.save(detail);
        }

        maybeAutoCompleteStocktake(stocktake);

        return toItemResponse(stocktake.getId(), detail);
    }

    private void maybeAutoCompleteStocktake(Stocktake stocktake) {
        List<StocktakeDetail> details = stocktakeDetailRepository.findByStocktakeId(stocktake.getId());
        boolean hasPending = details.stream().anyMatch(detail -> detail.getSoLuongThucTe() == null);

        if (!hasPending) {
            stocktake.setTrangThai(StocktakeStatus.HOAN_THANH);
            stocktake.setNgayHoanThanh(LocalDateTime.now());
            stocktakeRepository.save(stocktake);
        }
    }

    private Stocktake getOrCreateStocktakeByDate(User user, LocalDate checkDate) {
        return stocktakeRepository.findTopByNgayKiemKeOrderByCreatedAtDesc(checkDate)
                .orElseGet(() -> createStocktake(user, checkDate));
    }

    @Transactional
    protected Stocktake createStocktake(User user, LocalDate checkDate) {
        Stocktake stocktake = new Stocktake();
        stocktake.setMaKiemKe(generateStocktakeCode(checkDate));
        stocktake.setNgayKiemKe(checkDate);
        stocktake.setTrangThai(StocktakeStatus.DANG_KIEM);
        stocktake.setNguoiKiem(user);
        stocktake.setGhiChu("Auto-created from inventory check workflow");
        stocktake = stocktakeRepository.save(stocktake);

        List<Product> products = productRepository.findAll();
        for (Product product : products) {
            StocktakeDetail detail = new StocktakeDetail();
            detail.setKiemKe(stocktake);
            detail.setProduct(product);
            detail.setSoLuongHeThong(product.getStock());
            detail.setSoLuongThucTe(null);
            stocktakeDetailRepository.save(detail);
        }

        return stocktake;
    }

    private Stocktake findStocktake(Long stocktakeId) {
        return stocktakeRepository.findById(stocktakeId)
                .orElseThrow(() -> new ResourceNotFoundException("Stocktake not found"));
    }

    private void ensureStocktakeActive(Stocktake stocktake) {
        if (stocktake.getTrangThai() != StocktakeStatus.DANG_KIEM) {
            throw new BadRequestException("Stocktake is not active");
        }
    }

    private User findUserByEmail(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + email));
    }

    private void createAudit(
            Stocktake stocktake,
            Product product,
            Integer systemQty,
            Integer actualQty,
            Integer discrepancy,
            InventoryCheckStatus status,
            User checkedBy,
            String note) {
        InventoryCheckAudit audit = new InventoryCheckAudit();
        audit.setStocktake(stocktake);
        audit.setItem(product);
        audit.setSystemQty(systemQty);
        audit.setActualQty(actualQty);
        audit.setDiscrepancy(discrepancy);
        audit.setStatus(status);
        audit.setCheckedBy(checkedBy);
        audit.setCheckedAt(LocalDateTime.now());
        audit.setNote(note);
        inventoryCheckAuditRepository.save(audit);
    }

    private Map<Long, ProgressAggregate> summarizeProgress(List<Long> stocktakeIds) {
        Map<Long, ProgressAggregate> progressByStocktakeId = new HashMap<>();
        for (Object[] row : stocktakeDetailRepository.summarizeProgressByStocktakeIds(stocktakeIds)) {
            Long stocktakeId = (Long) row[0];
            long totalItems = (Long) row[1];
            long checkedItems = row[2] == null ? 0L : (Long) row[2];
            long totalDiscrepancy = row[3] == null ? 0L : (Long) row[3];
            progressByStocktakeId.put(stocktakeId, new ProgressAggregate((int) totalItems, (int) checkedItems, (int) totalDiscrepancy));
        }
        return progressByStocktakeId;
    }

    private String resolveEvaluation(int checkedItems, int totalDiscrepancy) {
        if (checkedItems == 0) {
            return "CHUA_KIEM";
        }
        if (totalDiscrepancy == 0) {
            return "DU";
        }
        return totalDiscrepancy > 0 ? "THUA" : "THIEU";
    }

    private InventoryCheckItemResponse toItemResponse(Long stocktakeId, StocktakeDetail detail) {
        Optional<InventoryCheckAudit> latestAudit = inventoryCheckAuditRepository
                .findTopByStocktakeIdAndItemIdOrderByCheckedAtDesc(stocktakeId, detail.getProduct().getId());

        InventoryCheckStatus computedStatus = InventoryDiscrepancyCalculator.resolveStatus(
                detail.getSoLuongHeThong(),
                detail.getSoLuongThucTe(),
                warningThreshold);

        InventoryCheckStatus status = latestAudit.map(InventoryCheckAudit::getStatus).orElse(computedStatus);
        Integer discrepancy = detail.getSoLuongThucTe() == null ? null : detail.getSoLuongThucTe() - detail.getSoLuongHeThong();
        boolean warning = discrepancy != null
                && InventoryDiscrepancyCalculator.isWarning(detail.getSoLuongHeThong(), discrepancy, warningThreshold);

        UserSimpleResponse checkedBy = latestAudit.map(audit -> new UserSimpleResponse(
                audit.getCheckedBy().getId(),
                audit.getCheckedBy().getEmail(),
                audit.getCheckedBy().getFullName())).orElse(null);

        return new InventoryCheckItemResponse(
                detail.getProduct().getId(),
                detail.getProduct().getName(),
                detail.getProduct().getSku() != null && !detail.getProduct().getSku().isBlank()
                        ? detail.getProduct().getSku()
                        : detail.getProduct().getCode(),
                "pcs",
                detail.getSoLuongHeThong(),
                detail.getSoLuongThucTe(),
                discrepancy,
                status,
                warning,
                checkedBy,
                latestAudit.map(InventoryCheckAudit::getCheckedAt).orElse(null),
                detail.getGhiChu());
    }

    private String generateStocktakeCode(LocalDate checkDate) {
        String prefix = "KK";
        String dateStamp = checkDate.toString().replace("-", "");
        long count = stocktakeRepository.count() + 1;
        return String.format("%s%s%03d", prefix, dateStamp, count);
    }

    private record ProgressAggregate(int totalItems, int checkedItems, int totalDiscrepancy) {
        private static final ProgressAggregate ZERO = new ProgressAggregate(0, 0, 0);
    }
}
