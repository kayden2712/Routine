package com.example.be.dto.response;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Response DTO for Inventory Check Detail (Chi tiết kiểm kê)
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class StocktakeDetailResponse {
    
    /**
     * Detail ID
     */
    private Long id;
    
    /**
     * Product information
     */
    private ProductSimpleResponse product;
    
    /**
     * System stock quantity (snapshot from Product.stock)
     */
    private Integer soLuongHeThong;
    
    /**
     * Actual stock quantity (counted by staff)
     */
    private Integer soLuongThucTe;
    
    /**
     * Difference (actual - system)
     */
    private Integer chenhLech;
    
    /**
     * Notes
     */
    private String ghiChu;
}
