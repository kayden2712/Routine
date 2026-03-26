package com.example.be.dto.request;

import jakarta.validation.constraints.*;
import lombok.*;

import java.math.BigDecimal;

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
    private String sku;
    private String material;
    private String fit;
    private String season;
    private String careInstructions;
}
