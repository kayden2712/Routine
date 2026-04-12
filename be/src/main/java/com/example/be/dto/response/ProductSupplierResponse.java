package com.example.be.dto.response;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Response DTO for Supplier of a Product
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProductSupplierResponse {
    
    private Long supplierId;
    private String supplierCode;
    private String supplierName;
    private String phone;
    private String email;
    private String status;
    
    // Purchase statistics for this product
    private Long totalPurchaseOrders;
    private Long totalQuantityPurchased;
    private BigDecimal lastPurchasePrice;
    private LocalDateTime lastPurchaseDate;
    private BigDecimal avgPurchasePrice;
    private BigDecimal totalPurchaseValue;
}
