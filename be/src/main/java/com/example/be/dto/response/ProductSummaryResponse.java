package com.example.be.dto.response;

import java.math.BigDecimal;

import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProductSummaryResponse {
    private Long id;
    private String code;
    private String name;
    private BigDecimal price;
    private String imageUrl;
}
