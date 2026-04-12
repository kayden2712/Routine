package com.example.be.entity;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;

import com.example.be.entity.enums.PromotionStatus;
import com.example.be.entity.enums.PromotionType;

import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import lombok.*;

@Entity
@Table(name = "promotions", indexes = {
        @Index(name = "idx_code", columnList = "code"),
        @Index(name = "idx_status", columnList = "status"),
        @Index(name = "idx_dates", columnList = "start_date, end_date"),
        @Index(name = "idx_type", columnList = "type")
})
@Data
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(callSuper = true)
@SuppressWarnings("null")
public class Promotion extends BaseEntity {

    @Column(nullable = false, unique = true, length = 50)
    @NotBlank(message = "Mã khuyến mãi không được để trống")
    @Size(max = 50, message = "Mã khuyến mãi không quá 50 ký tự")
    private String code;

    @Column(nullable = false)
    @NotBlank(message = "Tên chương trình không được để trống")
    @Size(max = 255, message = "Tên chương trình không quá 255 ký tự")
    private String name;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 50)
    @NotNull(message = "Loại khuyến mãi không được để trống")
    private PromotionType type;

    @Column(name = "discount_value", nullable = false, precision = 15, scale = 2)
    @NotNull(message = "Giá trị ưu đãi không được để trống")
    @DecimalMin(value = "0.0", message = "Giá trị ưu đãi phải >= 0")
    private BigDecimal discountValue;

    @Column(name = "max_discount_amount", precision = 15, scale = 2)
    @DecimalMin(value = "0.0", message = "Số tiền giảm tối đa phải >= 0")
    private BigDecimal maxDiscountAmount;

    @Column(name = "start_date", nullable = false)
    @NotNull(message = "Thời gian bắt đầu không được để trống")
    private LocalDateTime startDate;

    @Column(name = "end_date", nullable = false)
    @NotNull(message = "Thời gian kết thúc không được để trống")
    private LocalDateTime endDate;

    @Column(name = "min_order_amount", precision = 15, scale = 2)
    @DecimalMin(value = "0.0", message = "Giá trị đơn hàng tối thiểu phải >= 0")
    private BigDecimal minOrderAmount = BigDecimal.ZERO;

    @Column(name = "apply_to_all_products")
    private Boolean applyToAllProducts = true;

    @Column(name = "usage_limit")
    @Min(value = 1, message = "Số lần sử dụng tối đa phải >= 1")
    private Integer usageLimit;

    @Column(name = "usage_count")
    private Integer usageCount = 0;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 50)
    private PromotionStatus status = PromotionStatus.DRAFT;

    @Column(name = "created_by")
    private Long createdBy;

    @OneToMany(mappedBy = "promotion", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private Set<PromotionProduct> promotionProducts = new HashSet<>();

    @Transient
    public boolean isActive() {
        LocalDateTime now = LocalDateTime.now();
        return status == PromotionStatus.ACTIVE
                && !startDate.isAfter(now)
                && !endDate.isBefore(now);
    }

    @Transient
    public boolean hasReachedUsageLimit() {
        return usageLimit != null && usageCount >= usageLimit;
    }

    @Transient
    public boolean canApply(BigDecimal orderAmount) {
        if (!isActive() || hasReachedUsageLimit()) {
            return false;
        }
        return minOrderAmount == null || orderAmount.compareTo(minOrderAmount) >= 0;
    }

    public void incrementUsageCount() {
        Integer currentUsageCount = this.usageCount;
        int safeUsageCount = currentUsageCount != null ? currentUsageCount : 0;
        this.usageCount = safeUsageCount + 1;
    }

    public BigDecimal calculateDiscount(BigDecimal orderAmount) {
        if (!canApply(orderAmount)) {
            return BigDecimal.ZERO;
        }

        BigDecimal discount = switch (type) {
            case GIAM_PHAN_TRAM -> {
                BigDecimal percentDiscount = orderAmount.multiply(discountValue).divide(BigDecimal.valueOf(100));
                if (maxDiscountAmount != null && percentDiscount.compareTo(maxDiscountAmount) > 0) {
                    yield maxDiscountAmount;
                }
                yield percentDiscount;
            }
            case GIAM_TIEN -> discountValue;
            case TANG_QUA -> BigDecimal.ZERO;
        };

        return discount.max(BigDecimal.ZERO);
    }

    @SuppressWarnings("unused")
    @PrePersist
    @PreUpdate
    private void validateDates() {
        if (endDate != null && startDate != null && endDate.isBefore(startDate)) {
            throw new IllegalArgumentException("Thời gian kết thúc phải sau thời gian bắt đầu");
        }
    }

    public void addProduct(Product product) {
        PromotionProduct pp = new PromotionProduct();
        pp.setPromotion(this);
        pp.setProduct(product);
        promotionProducts.add(pp);
    }

    public void removeProduct(Product product) {
        promotionProducts.removeIf(pp -> pp.getProduct().equals(product));
    }
}
