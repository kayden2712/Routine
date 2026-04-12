package com.example.be.dto.response;

import java.time.LocalDateTime;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Response DTO for Inventory Report (Báo cáo tồn kho)
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class InventoryReportResponse {
    
    /**
     * Product ID
     */
    private Long productId;
    
    /**
     * Product code
     */
    private String productCode;
    
    /**
     * Product name
     */
    private String productName;
    
    /**
     * Current stock quantity
     */
    private Integer currentStock;
    
    /**
     * Minimum stock threshold
     */
    private Integer minStock;
    
    /**
     * Whether the product is low on stock
     */
    private Boolean isLowStock;
    
    /**
     * Last stock update timestamp
     */
    private LocalDateTime lastUpdate;
    
    /**
     * Total quantity imported
     */
    private Integer totalNhap;
    
    /**
     * Total quantity exported
     */
    private Integer totalXuat;
}
