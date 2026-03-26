package com.example.be.dto.response;

import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProductResponse {
    private Long id;
    private String code;
    private String name;
    private String categoryName;
    private String description;
    private BigDecimal price;
    private BigDecimal costPrice;
    private BigDecimal oldPrice;
    private Integer stock;
    private Integer minStock;
    private String status;
    private String imageUrl;
    private String sku;
    private String material;
    private String fit;
    private String season;
    private String careInstructions;
    private BigDecimal rating;
    private Integer reviewCount;
    private String badge;
    private List<String> colors;
    private List<String> sizes;
    private LocalDateTime createdAt;
}
