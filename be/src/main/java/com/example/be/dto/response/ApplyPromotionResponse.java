package com.example.be.dto.response;

import java.math.BigDecimal;

import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ApplyPromotionResponse {
    private Boolean applicable;
    private String message;
    private Long promotionId;
    private String promotionCode;
    private String promotionName;
    private BigDecimal discountAmount;
    private BigDecimal originalAmount;
    private BigDecimal finalAmount;
}
