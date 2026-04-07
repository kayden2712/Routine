package com.example.be.dto.response;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Response DTO for Product supplied by a Supplier
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SupplierProductResponse {
    
    private Long productId;
    private String productCode;
    private String productName;
    private String categoryName;
    private BigDecimal currentPrice;
    private Integer currentStock;
    
    // Purchase statistics
    private Long totalPurchaseOrders;
    private Long totalQuantityPurchased;
    private BigDecimal lastPurchasePrice;
    private LocalDateTime lastPurchaseDate;
    private BigDecimal avgPurchasePrice;
    private BigDecimal totalPurchaseValue;
}
