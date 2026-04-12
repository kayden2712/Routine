package com.example.be.dto.response;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import com.example.be.entity.enums.PromotionStatus;
import com.example.be.entity.enums.PromotionType;

import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PromotionResponse {
    private Long id;
    private String code;
    private String name;
    private String description;
    private PromotionType type;
    private String typeDisplayName;
    private BigDecimal discountValue;
    private BigDecimal maxDiscountAmount;
    private LocalDateTime startDate;
    private LocalDateTime endDate;
    private BigDecimal minOrderAmount;
    private Boolean applyToAllProducts;
    private Integer usageLimit;
    private Integer usageCount;
    private PromotionStatus status;
    private String statusDisplayName;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private Long createdBy;
    private Integer productCount;
    private Boolean isActive;
}
