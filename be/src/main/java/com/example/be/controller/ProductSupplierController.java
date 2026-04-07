package com.example.be.controller;

import java.util.List;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.example.be.dto.response.ApiResponse;
import com.example.be.dto.response.ProductSupplierResponse;
import com.example.be.dto.response.SupplierProductResponse;
import com.example.be.dto.response.SupplierProductStatsResponse;
import com.example.be.entity.ImportReceipt;
import com.example.be.service.ProductSupplierService;

import lombok.RequiredArgsConstructor;

/**
 * REST Controller for Product-Supplier relationship queries
 */
@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class ProductSupplierController {

        private static final Logger logger = LoggerFactory.getLogger(ProductSupplierController.class);

        private final ProductSupplierService productSupplierService;

        /**
         * Get all products supplied by a specific supplier
         * 
         * GET /api/suppliers/{supplierId}/products
         */
        @GetMapping("/suppliers/{supplierId}/products")
        @PreAuthorize("hasAnyRole('MANAGER', 'WAREHOUSE')")
        public ResponseEntity<ApiResponse<List<SupplierProductResponse>>> getProductsBySupplierId(
                        @PathVariable Long supplierId) {
                logger.info("API: Get products for supplier ID: {}", supplierId);

                List<SupplierProductResponse> products = productSupplierService.getProductsBySupplierId(supplierId);

                return ResponseEntity.ok(ApiResponse.<List<SupplierProductResponse>>builder()
                                .success(true)
                                .message("Lấy danh sách sản phẩm của nhà cung cấp thành công")
                                .data(products)
                                .build());
        }

        /**
         * Get all suppliers for a specific product
         * 
         * GET /api/products/{productId}/suppliers
         */
        @GetMapping("/products/{productId}/suppliers")
        @PreAuthorize("hasAnyRole('MANAGER', 'WAREHOUSE')")
        public ResponseEntity<ApiResponse<List<ProductSupplierResponse>>> getSuppliersByProductId(
                        @PathVariable Long productId) {
                logger.info("API: Get suppliers for product ID: {}", productId);

                List<ProductSupplierResponse> suppliers = productSupplierService.getSuppliersByProductId(productId);

                return ResponseEntity.ok(ApiResponse.<List<ProductSupplierResponse>>builder()
                                .success(true)
                                .message("Lấy danh sách nhà cung cấp của sản phẩm thành công")
                                .data(suppliers)
                                .build());
        }

        /**
         * Get purchase history for a supplier
         * 
         * GET /api/suppliers/{supplierId}/purchase-history
         */
        @GetMapping("/suppliers/{supplierId}/purchase-history")
        @PreAuthorize("hasAnyRole('MANAGER', 'WAREHOUSE', 'ACCOUNTANT')")
        public ResponseEntity<ApiResponse<Page<ImportReceipt>>> getPurchaseHistoryBySupplierId(
                        @PathVariable Long supplierId,
                        @RequestParam(defaultValue = "0") int page,
                        @RequestParam(defaultValue = "10") int size,
                        @RequestParam(defaultValue = "ngayNhap") String sortBy,
                        @RequestParam(defaultValue = "DESC") String sortDirection) {
                logger.info("API: Get purchase history for supplier ID: {}", supplierId);

                Sort sort = Sort.by(
                                "DESC".equalsIgnoreCase(sortDirection) ? Sort.Direction.DESC : Sort.Direction.ASC,
                                sortBy);
                Pageable pageable = PageRequest.of(page, size, sort);

                Page<ImportReceipt> history = productSupplierService.getPurchaseHistoryBySupplierId(supplierId,
                                pageable);

                return ResponseEntity.ok(ApiResponse.<Page<ImportReceipt>>builder()
                                .success(true)
                                .message("Lấy lịch sử nhập hàng của nhà cung cấp thành công")
                                .data(history)
                                .build());
        }

        /**
         * Get purchase history for a product
         * 
         * GET /api/products/{productId}/purchase-history
         */
        @GetMapping("/products/{productId}/purchase-history")
        @PreAuthorize("hasAnyRole('MANAGER', 'WAREHOUSE')")
        public ResponseEntity<ApiResponse<Page<ImportReceipt>>> getPurchaseHistoryByProductId(
                        @PathVariable Long productId,
                        @RequestParam(defaultValue = "0") int page,
                        @RequestParam(defaultValue = "10") int size,
                        @RequestParam(defaultValue = "ngayNhap") String sortBy,
                        @RequestParam(defaultValue = "DESC") String sortDirection) {
                logger.info("API: Get purchase history for product ID: {}", productId);

                Sort sort = Sort.by(
                                "DESC".equalsIgnoreCase(sortDirection) ? Sort.Direction.DESC : Sort.Direction.ASC,
                                sortBy);
                Pageable pageable = PageRequest.of(page, size, sort);

                Page<ImportReceipt> history = productSupplierService.getPurchaseHistoryByProductId(productId, pageable);

                return ResponseEntity.ok(ApiResponse.<Page<ImportReceipt>>builder()
                                .success(true)
                                .message("Lấy lịch sử nhập hàng của sản phẩm thành công")
                                .data(history)
                                .build());
        }

        /**
         * Get statistics for a supplier
         * 
         * GET /api/suppliers/{supplierId}/statistics
         */
        @GetMapping("/suppliers/{supplierId}/statistics")
        @PreAuthorize("hasAnyRole('MANAGER', 'ACCOUNTANT')")
        public ResponseEntity<ApiResponse<SupplierProductStatsResponse>> getSupplierStatistics(
                        @PathVariable Long supplierId) {
                logger.info("API: Get statistics for supplier ID: {}", supplierId);

                SupplierProductStatsResponse stats = productSupplierService.getSupplierStatistics(supplierId);

                return ResponseEntity.ok(ApiResponse.<SupplierProductStatsResponse>builder()
                                .success(true)
                                .message("Lấy thống kê nhà cung cấp thành công")
                                .data(stats)
                                .build());
        }

        /**
         * Get statistics for a product
         * 
         * GET /api/products/{productId}/statistics
         */
        @GetMapping("/products/{productId}/statistics")
        @PreAuthorize("hasAnyRole('MANAGER', 'WAREHOUSE')")
        public ResponseEntity<ApiResponse<SupplierProductStatsResponse>> getProductStatistics(
                        @PathVariable Long productId) {
                logger.info("API: Get statistics for product ID: {}", productId);

                SupplierProductStatsResponse stats = productSupplierService.getProductStatistics(productId);

                return ResponseEntity.ok(ApiResponse.<SupplierProductStatsResponse>builder()
                                .success(true)
                                .message("Lấy thống kê sản phẩm thành công")
                                .data(stats)
                                .build());
        }
}
