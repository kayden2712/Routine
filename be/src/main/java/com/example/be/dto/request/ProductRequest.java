package com.example.be.dto.request;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ProductRequest {

    @NotBlank(message = "Product code is required")
    private String code;

    @NotBlank(message = "Product name is required")
    private String name;

    @NotNull(message = "Category ID is required")
    private Long categoryId;

    private String description;

    @NotNull(message = "Price is required")
    @DecimalMin(value = "0.0", inclusive = false, message = "Price must be greater than 0")
    private BigDecimal price;

    private BigDecimal costPrice;
    private BigDecimal oldPrice;

    @Min(value = 0, message = "Stock cannot be negative")
    private Integer stock;

    private Integer minStock;
    private String imageUrl;
    private List<String> imageUrls;
    private String sku;
    private String material;
    private String fit;
    private String season;
    private String careInstructions;
    private String gender;
    private List<String> sizes;
    private List<String> colors;
    private Map<String, Integer> sizeStocks;
    private List<ProductVariantRequest> variants;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ProductVariantRequest {
        private String size;
        private String color;
        private Integer stock;
    }
}
