package com.example.be.dto.response;

import java.math.BigDecimal;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Response DTO for Supplier-Product Statistics
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SupplierProductStatsResponse {
    
    // Supplier info
    private Long supplierId;
    private String supplierName;
    
    // Overall statistics
    private Long totalProducts;
    private Long totalPurchaseOrders;
    private Long totalQuantityPurchased;
    private BigDecimal totalPurchaseValue;
    private BigDecimal avgOrderValue;
    
    // Product breakdown (if needed)
    private Integer activeProducts;
    private Integer inactiveProducts;
}
