package com.example.be.dto.response;

import lombok.*;

import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CartItemResponse {
    private Long id;
    private ProductSummary product;
    private Integer quantity;
    private String size;
    private String color;
    private BigDecimal subtotal;
    
    @Data
    @Builder
    public static class ProductSummary {
        private Long id;
        private String code;
        private String name;
        private BigDecimal price;
        private String imageUrl;
        private Integer stock;
    }
}
