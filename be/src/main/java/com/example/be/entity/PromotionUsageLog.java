package com.example.be.entity;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import org.springframework.data.annotation.CreatedDate;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "promotion_usage_log", indexes = {
    @Index(name = "idx_promotion_usage_promotion", columnList = "promotion_id"),
    @Index(name = "idx_promotion_usage_order", columnList = "order_id"),
    @Index(name = "idx_promotion_usage_customer", columnList = "customer_id"),
    @Index(name = "idx_promotion_usage_date", columnList = "applied_at")
})
@Data
@NoArgsConstructor
@AllArgsConstructor
public class PromotionUsageLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "promotion_id", nullable = false)
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private Promotion promotion;

    @Column(name = "order_id", nullable = false)
    private Long orderId;

    @Column(name = "customer_id")
    private Long customerId;

    @Column(name = "discount_amount", nullable = false, precision = 15, scale = 2)
    private BigDecimal discountAmount;

    @CreatedDate
    @Column(name = "applied_at", nullable = false, updatable = false)
    private LocalDateTime appliedAt;

    @Column(name = "applied_by")
    private Long appliedBy;

    @PrePersist
    protected void onCreate() {
        if (appliedAt == null) {
            appliedAt = LocalDateTime.now();
        }
    }
}
