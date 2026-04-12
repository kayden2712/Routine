package com.example.be.dto.response;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Simplified Product Response DTO
 * Used for nested product information in warehouse responses
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ProductSimpleResponse {
    
    /**
     * Product ID
     */
    private Long id;
    
    /**
     * Product code
     */
    private String code;
    
    /**
     * Product name
     */
    private String name;
    
    /**
     * Current stock quantity
     */
    private Integer stock;
}
