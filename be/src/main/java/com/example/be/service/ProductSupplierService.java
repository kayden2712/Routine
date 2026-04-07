package com.example.be.service;

import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import com.example.be.dto.response.ProductSupplierResponse;
import com.example.be.dto.response.SupplierProductResponse;
import com.example.be.dto.response.SupplierProductStatsResponse;
import com.example.be.entity.ImportReceipt;

/**
 * Service interface for Product-Supplier relationship queries
 */
public interface ProductSupplierService {

    /**
     * Get all products supplied by a specific supplier
     */
    List<SupplierProductResponse> getProductsBySupplierId(Long supplierId);

    /**
     * Get all suppliers that have supplied a specific product
     */
    List<ProductSupplierResponse> getSuppliersByProductId(Long productId);

    /**
     * Get purchase history for a specific supplier
     */
    Page<ImportReceipt> getPurchaseHistoryBySupplierId(Long supplierId, Pageable pageable);

    /**
     * Get purchase history for a specific product
     */
    Page<ImportReceipt> getPurchaseHistoryByProductId(Long productId, Pageable pageable);

    /**
     * Get statistics for a supplier (products count, total value, etc.)
     */
    SupplierProductStatsResponse getSupplierStatistics(Long supplierId);

    /**
     * Get statistics for a product (suppliers count, purchase frequency, etc.)
     */
    SupplierProductStatsResponse getProductStatistics(Long productId);
}
