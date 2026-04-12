package com.example.be.service;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.be.dto.request.ApplyPromotionRequest;
import com.example.be.dto.request.CheckPromotionRequest;
import com.example.be.dto.request.CreatePromotionRequest;
import com.example.be.dto.request.UpdatePromotionRequest;
import com.example.be.dto.response.ApplyPromotionResponse;
import com.example.be.dto.response.CheckPromotionResponse;
import com.example.be.dto.response.ProductSummaryResponse;
import com.example.be.dto.response.PromotionDetailResponse;
import com.example.be.dto.response.PromotionResponse;
import com.example.be.entity.Product;
import com.example.be.entity.Promotion;
import com.example.be.entity.PromotionProduct;
import com.example.be.entity.PromotionUsageLog;
import com.example.be.entity.enums.PromotionStatus;
import com.example.be.exception.BadRequestException;
import com.example.be.exception.ResourceNotFoundException;
import com.example.be.repository.ProductRepository;
import com.example.be.repository.PromotionProductRepository;
import com.example.be.repository.PromotionRepository;
import com.example.be.repository.PromotionUsageLogRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
@SuppressWarnings("null")
public class PromotionService {

    private static final Logger logger = LoggerFactory.getLogger(PromotionService.class);

    private final PromotionRepository promotionRepository;
    private final PromotionProductRepository promotionProductRepository;
    private final PromotionUsageLogRepository promotionUsageLogRepository;
    private final ProductRepository productRepository;

    public List<PromotionResponse> getAllPromotions() {
        return promotionRepository.findAll().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public List<PromotionResponse> getPromotionsByStatus(PromotionStatus status) {
        return promotionRepository.findByStatus(status).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public List<PromotionResponse> getActivePromotions() {
        return promotionRepository.findActivePromotions(PromotionStatus.ACTIVE, LocalDateTime.now()).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public PromotionDetailResponse getPromotionById(Long id) {
        Promotion promotion = findPromotionById(id);
        return mapToDetailResponse(promotion);
    }

    public PromotionResponse getPromotionByCode(String code) {
        Promotion promotion = promotionRepository.findByCode(code)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy khuyến mãi với mã: " + code));
        return mapToResponse(promotion);
    }

    @Transactional
    public PromotionResponse createPromotion(CreatePromotionRequest request, Long createdBy) {
        logger.info("Creating promotion with code: {}", request.getCode());

        if (promotionRepository.existsByCode(request.getCode())) {
            throw new BadRequestException("Mã khuyến mãi đã tồn tại: " + request.getCode());
        }

        validatePromotionRequest(request.getStartDate(), request.getEndDate(), request.getDiscountValue(),
                request.getType());

        Promotion promotion = new Promotion();
        promotion.setCode(request.getCode());
        promotion.setName(request.getName());
        promotion.setDescription(request.getDescription());
        promotion.setType(request.getType());
        promotion.setDiscountValue(request.getDiscountValue());
        promotion.setMaxDiscountAmount(request.getMaxDiscountAmount());
        promotion.setStartDate(request.getStartDate());
        promotion.setEndDate(request.getEndDate());
        promotion
                .setMinOrderAmount(request.getMinOrderAmount() != null ? request.getMinOrderAmount() : BigDecimal.ZERO);
        Boolean applyToAllProducts = request.getApplyToAllProducts();
        promotion.setApplyToAllProducts(applyToAllProducts != null ? applyToAllProducts : Boolean.TRUE);
        promotion.setUsageLimit(request.getUsageLimit());
        promotion.setUsageCount(0);
        promotion.setStatus(PromotionStatus.DRAFT);
        promotion.setCreatedBy(createdBy);

        Promotion savedPromotion = promotionRepository.save(promotion);

        if (Boolean.FALSE.equals(request.getApplyToAllProducts()) && request.getProductIds() != null
                && !request.getProductIds().isEmpty()) {
            addProductsToPromotion(savedPromotion, request.getProductIds());
        }

        logger.info("Promotion created successfully with id: {}", savedPromotion.getId());
        return mapToResponse(savedPromotion);
    }

    @Transactional
    public PromotionResponse updatePromotion(Long id, UpdatePromotionRequest request) {
        logger.info("Updating promotion with id: {}", id);

        Promotion promotion = findPromotionById(id);

        if (promotion.getStatus() == PromotionStatus.EXPIRED) {
            throw new BadRequestException("Không thể cập nhật khuyến mãi đã hết hạn");
        }

        if (promotion.getStatus() == PromotionStatus.CANCELLED) {
            throw new BadRequestException("Không thể cập nhật khuyến mãi đã hủy");
        }

        validatePromotionRequest(request.getStartDate(), request.getEndDate(), request.getDiscountValue(),
                request.getType());

        promotion.setName(request.getName());
        promotion.setDescription(request.getDescription());
        promotion.setType(request.getType());
        promotion.setDiscountValue(request.getDiscountValue());
        promotion.setMaxDiscountAmount(request.getMaxDiscountAmount());
        promotion.setStartDate(request.getStartDate());
        promotion.setEndDate(request.getEndDate());
        promotion
                .setMinOrderAmount(request.getMinOrderAmount() != null ? request.getMinOrderAmount() : BigDecimal.ZERO);
        Boolean applyToAllProducts = request.getApplyToAllProducts();
        promotion.setApplyToAllProducts(applyToAllProducts != null ? applyToAllProducts : Boolean.TRUE);
        promotion.setUsageLimit(request.getUsageLimit());

        Promotion updatedPromotion = promotionRepository.save(promotion);

        promotionProductRepository.deleteByPromotionId(promotion.getId());
        if (Boolean.FALSE.equals(request.getApplyToAllProducts()) && request.getProductIds() != null
                && !request.getProductIds().isEmpty()) {
            addProductsToPromotion(updatedPromotion, request.getProductIds());
        }

        logger.info("Promotion updated successfully with id: {}", updatedPromotion.getId());
        return mapToResponse(updatedPromotion);
    }

    @Transactional
    public void deletePromotion(Long id) {
        logger.info("Deleting promotion with id: {}", id);

        Promotion promotion = findPromotionById(id);

        if (promotion.getStatus() == PromotionStatus.ACTIVE) {
            throw new BadRequestException("Không thể xóa khuyến mãi đang hoạt động. Vui lòng hủy trước khi xóa.");
        }

        promotionRepository.delete(promotion);
        logger.info("Promotion deleted successfully with id: {}", id);
    }

    @Transactional
    public PromotionResponse activatePromotion(Long id) {
        logger.info("Activating promotion with id: {}", id);

        Promotion promotion = findPromotionById(id);

        if (promotion.getStatus() != PromotionStatus.DRAFT) {
            throw new BadRequestException("Chỉ có thể kích hoạt khuyến mãi ở trạng thái DRAFT");
        }

        if (!promotion.getStatus().canTransitionTo(PromotionStatus.ACTIVE)) {
            throw new BadRequestException("Không thể chuyển trạng thái từ " + promotion.getStatus() + " sang ACTIVE");
        }

        promotion.setStatus(PromotionStatus.ACTIVE);
        Promotion updatedPromotion = promotionRepository.save(promotion);

        logger.info("Promotion activated successfully with id: {}", updatedPromotion.getId());
        return mapToResponse(updatedPromotion);
    }

    @Transactional
    public PromotionResponse cancelPromotion(Long id) {
        logger.info("Cancelling promotion with id: {}", id);

        Promotion promotion = findPromotionById(id);

        if (promotion.getStatus() == PromotionStatus.EXPIRED) {
            throw new BadRequestException("Không thể hủy khuyến mãi đã hết hạn");
        }

        if (promotion.getStatus() == PromotionStatus.CANCELLED) {
            throw new BadRequestException("Khuyến mãi đã được hủy trước đó");
        }

        if (!promotion.getStatus().canTransitionTo(PromotionStatus.CANCELLED)) {
            throw new BadRequestException(
                    "Không thể chuyển trạng thái từ " + promotion.getStatus() + " sang CANCELLED");
        }

        promotion.setStatus(PromotionStatus.CANCELLED);
        Promotion updatedPromotion = promotionRepository.save(promotion);

        logger.info("Promotion cancelled successfully with id: {}", updatedPromotion.getId());
        return mapToResponse(updatedPromotion);
    }

    @Transactional
    public ApplyPromotionResponse applyPromotion(ApplyPromotionRequest request, Long orderId, Long appliedBy) {
        logger.info("Applying promotion {} to order {}", request.getPromotionCode(), orderId);

        Promotion promotion = promotionRepository.findByCode(request.getPromotionCode())
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Không tìm thấy khuyến mãi với mã: " + request.getPromotionCode()));

        if (!promotion.canApply(request.getOrderAmount())) {
            String message = buildApplyErrorMessage(promotion, request.getOrderAmount());
            return ApplyPromotionResponse.builder()
                    .applicable(false)
                    .message(message)
                    .build();
        }

        if (!Boolean.TRUE.equals(promotion.getApplyToAllProducts()) && request.getProductIds() != null) {
            boolean hasApplicableProduct = false;
            List<PromotionProduct> promotionProducts = promotionProductRepository.findByPromotionId(promotion.getId());
            for (Long productId : request.getProductIds()) {
                if (promotionProducts.stream().anyMatch(pp -> pp.getProduct().getId().equals(productId))) {
                    hasApplicableProduct = true;
                    break;
                }
            }
            if (!hasApplicableProduct) {
                return ApplyPromotionResponse.builder()
                        .applicable(false)
                        .message("Không có sản phẩm nào trong đơn hàng được áp dụng khuyến mãi này")
                        .build();
            }
        }

        BigDecimal discountAmount = promotion.calculateDiscount(request.getOrderAmount());
        BigDecimal finalAmount = request.getOrderAmount().subtract(discountAmount);

        promotion.incrementUsageCount();
        promotionRepository.save(promotion);

        if (orderId != null) {
            PromotionUsageLog log = new PromotionUsageLog();
            log.setPromotion(promotion);
            log.setOrderId(orderId);
            log.setCustomerId(request.getCustomerId());
            log.setDiscountAmount(discountAmount);
            log.setAppliedBy(appliedBy);
            promotionUsageLogRepository.save(log);
        }

        logger.info("Promotion applied successfully. Discount amount: {}", discountAmount);

        return ApplyPromotionResponse.builder()
                .applicable(true)
                .message("Áp dụng khuyến mãi thành công")
                .promotionId(promotion.getId())
                .promotionCode(promotion.getCode())
                .promotionName(promotion.getName())
                .discountAmount(discountAmount)
                .originalAmount(request.getOrderAmount())
                .finalAmount(finalAmount)
                .build();
    }

    public CheckPromotionResponse checkApplicablePromotions(CheckPromotionRequest request) {
        logger.info("Checking applicable promotions for order amount: {}", request.getOrderAmount());

        List<Promotion> allActivePromotions = promotionRepository.findActivePromotions(PromotionStatus.ACTIVE,
                LocalDateTime.now());
        List<Promotion> applicablePromotions = new ArrayList<>();

        for (Promotion promotion : allActivePromotions) {
            if (promotion.canApply(request.getOrderAmount())) {
                if (Boolean.TRUE.equals(promotion.getApplyToAllProducts())) {
                    applicablePromotions.add(promotion);
                } else if (request.getProductIds() != null) {
                    List<PromotionProduct> promotionProducts = promotionProductRepository
                            .findByPromotionId(promotion.getId());
                    boolean hasApplicableProduct = request.getProductIds().stream()
                            .anyMatch(productId -> promotionProducts.stream()
                                    .anyMatch(pp -> pp.getProduct().getId().equals(productId)));
                    if (hasApplicableProduct) {
                        applicablePromotions.add(promotion);
                    }
                }
            }
        }

        boolean hasPromotions = !applicablePromotions.isEmpty();
        String message = hasPromotions
                ? "Tìm thấy " + applicablePromotions.size() + " khuyến mãi có thể áp dụng"
                : "Không có chương trình khuyến mãi phù hợp";

        return CheckPromotionResponse.builder()
                .hasApplicablePromotions(hasPromotions)
                .applicablePromotions(
                        applicablePromotions.stream().map(this::mapToResponse).collect(Collectors.toList()))
                .message(message)
                .build();
    }

    @Transactional
    public void expirePromotions() {
        logger.info("Running scheduled job to expire promotions");

        List<Promotion> expiredPromotions = promotionRepository.findExpiredPromotions(LocalDateTime.now());

        for (Promotion promotion : expiredPromotions) {
            promotion.setStatus(PromotionStatus.EXPIRED);
            promotionRepository.save(promotion);
        }

        if (!expiredPromotions.isEmpty()) {
            logger.info("Expired {} promotions", expiredPromotions.size());
        }
    }

    @Transactional
    public void activateScheduledPromotions() {
        logger.info("Running scheduled job to activate promotions");

        List<Promotion> promotionsToActivate = promotionRepository.findPromotionsToActivate(LocalDateTime.now());

        for (Promotion promotion : promotionsToActivate) {
            if (promotion.getStatus().canTransitionTo(PromotionStatus.ACTIVE)) {
                promotion.setStatus(PromotionStatus.ACTIVE);
                promotionRepository.save(promotion);
            }
        }

        if (!promotionsToActivate.isEmpty()) {
            logger.info("Activated {} promotions", promotionsToActivate.size());
        }
    }

    private Promotion findPromotionById(Long id) {
        return promotionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy khuyến mãi với id: " + id));
    }

    private void validatePromotionRequest(LocalDateTime startDate, LocalDateTime endDate,
            BigDecimal discountValue, com.example.be.entity.enums.PromotionType type) {
        if (endDate.isBefore(startDate)) {
            throw new BadRequestException("Thời gian kết thúc phải sau thời gian bắt đầu");
        }

        if (discountValue.compareTo(BigDecimal.ZERO) <= 0) {
            throw new BadRequestException("Giá trị ưu đãi phải lớn hơn 0");
        }

        if (type == com.example.be.entity.enums.PromotionType.GIAM_PHAN_TRAM
                && discountValue.compareTo(BigDecimal.valueOf(100)) > 0) {
            throw new BadRequestException("Giá trị giảm phần trăm không được vượt quá 100%");
        }
    }

    private String buildApplyErrorMessage(Promotion promotion, BigDecimal orderAmount) {
        if (!promotion.isActive()) {
            return "Khuyến mãi không còn hoạt động";
        }
        if (promotion.hasReachedUsageLimit()) {
            return "Khuyến mãi đã đạt giới hạn số lần sử dụng";
        }
        if (promotion.getMinOrderAmount() != null && orderAmount.compareTo(promotion.getMinOrderAmount()) < 0) {
            return "Đơn hàng chưa đạt giá trị tối thiểu " + promotion.getMinOrderAmount() + "đ";
        }
        return "Không thể áp dụng khuyến mãi";
    }

    private void addProductsToPromotion(Promotion promotion, List<Long> productIds) {
        for (Long productId : productIds) {
            Product product = productRepository.findById(productId)
                    .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy sản phẩm với id: " + productId));

            PromotionProduct pp = new PromotionProduct();
            pp.setPromotion(promotion);
            pp.setProduct(product);
            promotionProductRepository.save(pp);
        }
    }

    private PromotionResponse mapToResponse(Promotion promotion) {
        int productCount = Boolean.TRUE.equals(promotion.getApplyToAllProducts())
                ? -1
                : promotionProductRepository.findByPromotionId(promotion.getId()).size();

        return PromotionResponse.builder()
                .id(promotion.getId())
                .code(promotion.getCode())
                .name(promotion.getName())
                .description(promotion.getDescription())
                .type(promotion.getType())
                .typeDisplayName(promotion.getType().getDisplayName())
                .discountValue(promotion.getDiscountValue())
                .maxDiscountAmount(promotion.getMaxDiscountAmount())
                .startDate(promotion.getStartDate())
                .endDate(promotion.getEndDate())
                .minOrderAmount(promotion.getMinOrderAmount())
                .applyToAllProducts(promotion.getApplyToAllProducts())
                .usageLimit(promotion.getUsageLimit())
                .usageCount(promotion.getUsageCount())
                .status(promotion.getStatus())
                .statusDisplayName(promotion.getStatus().getDisplayName())
                .createdAt(promotion.getCreatedAt())
                .updatedAt(promotion.getUpdatedAt())
                .createdBy(promotion.getCreatedBy())
                .productCount(productCount)
                .isActive(promotion.isActive())
                .build();
    }

    private PromotionDetailResponse mapToDetailResponse(Promotion promotion) {
        List<ProductSummaryResponse> applicableProducts = new ArrayList<>();

        if (Boolean.FALSE.equals(promotion.getApplyToAllProducts())) {
            applicableProducts = promotionProductRepository.findByPromotionId(promotion.getId()).stream()
                    .map(pp -> {
                        Product product = pp.getProduct();
                        return ProductSummaryResponse.builder()
                                .id(product.getId())
                                .code(product.getCode())
                                .name(product.getName())
                                .price(product.getPrice())
                                .imageUrl(product.getImages() != null && !product.getImages().isEmpty()
                                        ? product.getImages().get(0).getImageUrl()
                                        : null)
                                .build();
                    })
                    .collect(Collectors.toList());
        }

        return PromotionDetailResponse.builder()
                .id(promotion.getId())
                .code(promotion.getCode())
                .name(promotion.getName())
                .description(promotion.getDescription())
                .type(promotion.getType())
                .typeDisplayName(promotion.getType().getDisplayName())
                .discountValue(promotion.getDiscountValue())
                .maxDiscountAmount(promotion.getMaxDiscountAmount())
                .startDate(promotion.getStartDate())
                .endDate(promotion.getEndDate())
                .minOrderAmount(promotion.getMinOrderAmount())
                .applyToAllProducts(promotion.getApplyToAllProducts())
                .usageLimit(promotion.getUsageLimit())
                .usageCount(promotion.getUsageCount())
                .status(promotion.getStatus())
                .statusDisplayName(promotion.getStatus().getDisplayName())
                .createdAt(promotion.getCreatedAt())
                .updatedAt(promotion.getUpdatedAt())
                .createdBy(promotion.getCreatedBy())
                .applicableProducts(applicableProducts)
                .isActive(promotion.isActive())
                .hasReachedLimit(promotion.hasReachedUsageLimit())
                .build();
    }
}
