package com.example.be.service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.be.dto.response.ProductSupplierResponse;
import com.example.be.dto.response.SupplierProductResponse;
import com.example.be.dto.response.SupplierProductStatsResponse;
import com.example.be.entity.ImportReceiptDetail;
import com.example.be.entity.Supplier;
import com.example.be.entity.ImportReceipt;
import com.example.be.entity.Product;
import com.example.be.exception.ResourceNotFoundException;
import com.example.be.repository.SupplierRepository;
import com.example.be.repository.ImportReceiptRepository;
import com.example.be.repository.ProductRepository;

import lombok.RequiredArgsConstructor;

/**
 * Service implementation for Product-Supplier relationship queries
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
@SuppressWarnings("null")
public class ProductSupplierServiceImpl implements ProductSupplierService {

    private static final Logger logger = LoggerFactory.getLogger(ProductSupplierServiceImpl.class);

    private final ProductRepository productRepository;
    private final SupplierRepository supplierRepository;
    private final ImportReceiptRepository purchaseOrderRepository;

    @Override
    public List<SupplierProductResponse> getProductsBySupplierId(Long supplierId) {
        logger.info("Getting products for supplier ID: {}", supplierId);

        // Verify supplier exists
        Supplier supplier = supplierRepository.findById(supplierId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy nhà cung cấp với ID: " + supplierId));

        // Get distinct products
        List<Product> products = productRepository.findProductsBySupplierId(supplierId);

        logger.info("Found {} products for supplier: {}", products.size(), supplier.getTenNcc());

        // Build response with statistics
        return products.stream()
                .map(product -> buildSupplierProductResponse(product, supplierId))
                .collect(Collectors.toList());
    }

    @Override
    public List<ProductSupplierResponse> getSuppliersByProductId(Long productId) {
        logger.info("Getting suppliers for product ID: {}", productId);

        // Verify product exists
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy sản phẩm với ID: " + productId));

        // Get suppliers
        List<Supplier> suppliers = purchaseOrderRepository.findSuppliersByProductId(productId);

        logger.info("Found {} suppliers for product: {}", suppliers.size(), product.getName());

        // Build response with statistics
        return suppliers.stream()
                .map(supplier -> buildProductSupplierResponse(supplier, productId))
                .collect(Collectors.toList());
    }

    @Override
    public Page<ImportReceipt> getPurchaseHistoryBySupplierId(Long supplierId, Pageable pageable) {
        logger.info("Getting purchase history for supplier ID: {}", supplierId);

        // Verify supplier exists
        supplierRepository.findById(supplierId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy nhà cung cấp với ID: " + supplierId));

        // Get purchase orders (phieu nhap kho already has the relationship)
        List<ImportReceipt> orders = purchaseOrderRepository.findBySupplierId(supplierId);

        // Convert to Page (manual pagination for now)
        int start = (int) pageable.getOffset();
        int end = Math.min((start + pageable.getPageSize()), orders.size());

        List<ImportReceipt> pageContent = orders.subList(start, end);

        return new org.springframework.data.domain.PageImpl<>(
                pageContent, pageable, orders.size());
    }

    @Override
    public Page<ImportReceipt> getPurchaseHistoryByProductId(Long productId, Pageable pageable) {
        logger.info("Getting purchase history for product ID: {}", productId);

        // Verify product exists
        productRepository.findById(productId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy sản phẩm với ID: " + productId));

        return purchaseOrderRepository.findByProductId(productId, pageable);
    }

    @Override
    public SupplierProductStatsResponse getSupplierStatistics(Long supplierId) {
        logger.info("Getting statistics for supplier ID: {}", supplierId);

        // Verify supplier exists
        Supplier supplier = supplierRepository.findById(supplierId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy nhà cung cấp với ID: " + supplierId));

        // Get basic counts
        Long totalProducts = productRepository.countProductsBySupplierId(supplierId);
        Long totalOrders = supplierRepository.countPurchaseReceiptsBySupplierId(supplierId);
        Double totalValue = supplierRepository.sumTotalPurchaseValueBySupplierId(supplierId);

        // Get purchase orders
        List<ImportReceipt> orders = purchaseOrderRepository.findBySupplierId(supplierId);

        // Calculate total quantity
        Long totalQuantity = orders.stream()
                .flatMap(order -> order.getChiTietList().stream())
                .mapToLong(ImportReceiptDetail::getSoLuongNhap)
                .sum();

        // Calculate average order value
        BigDecimal avgOrderValue = BigDecimal.ZERO;
        if (totalOrders > 0 && totalValue != null && totalValue > 0) {
            avgOrderValue = BigDecimal.valueOf(totalValue)
                    .divide(BigDecimal.valueOf(totalOrders), 2, RoundingMode.HALF_UP);
        }

        // Count active/inactive products
        List<Product> products = productRepository.findProductsBySupplierId(supplierId);
        int activeProducts = (int) products.stream()
                .filter(p -> "ACTIVE".equals(p.getStatus().name()))
                .count();
        int inactiveProducts = products.size() - activeProducts;

        return SupplierProductStatsResponse.builder()
                .supplierId(supplierId)
                .supplierName(supplier.getTenNcc())
                .totalProducts(totalProducts)
                .totalPurchaseOrders(totalOrders)
                .totalQuantityPurchased(totalQuantity)
                .totalPurchaseValue(totalValue != null ? BigDecimal.valueOf(totalValue) : BigDecimal.ZERO)
                .avgOrderValue(avgOrderValue)
                .activeProducts(activeProducts)
                .inactiveProducts(inactiveProducts)
                .build();
    }

    @Override
    public SupplierProductStatsResponse getProductStatistics(Long productId) {
        logger.info("Getting statistics for product ID: {}", productId);

        // Verify product exists
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy sản phẩm với ID: " + productId));

        // Get suppliers
        List<Supplier> suppliers = purchaseOrderRepository.findSuppliersByProductId(productId);

        // Get purchase orders
        List<ImportReceipt> orders = purchaseOrderRepository.findByProductId(productId);

        // Calculate total quantity and value for this product
        Long totalQuantity = 0L;
        BigDecimal totalValue = BigDecimal.ZERO;

        for (ImportReceipt order : orders) {
            for (ImportReceiptDetail detail : order.getChiTietList()) {
                if (detail.getProduct().getId().equals(productId)) {
                    totalQuantity += detail.getSoLuongNhap();
                    totalValue = totalValue.add(detail.getThanhTien());
                }
            }
        }

        // Calculate average order value
        BigDecimal avgOrderValue = BigDecimal.ZERO;
        if (!orders.isEmpty()) {
            avgOrderValue = totalValue.divide(
                    BigDecimal.valueOf(orders.size()), 2, RoundingMode.HALF_UP);
        }

        return SupplierProductStatsResponse.builder()
                .supplierId(productId) // Reusing field for productId
                .supplierName(product.getName()) // Reusing field for productName
                .totalProducts((long) suppliers.size()) // Number of suppliers
                .totalPurchaseOrders((long) orders.size())
                .totalQuantityPurchased(totalQuantity)
                .totalPurchaseValue(totalValue)
                .avgOrderValue(avgOrderValue)
                .activeProducts(suppliers.size()) // All are suppliers for this product
                .inactiveProducts(0)
                .build();
    }

    /**
     * Build SupplierProductResponse with statistics
     */
    private SupplierProductResponse buildSupplierProductResponse(Product product, Long supplierId) {
        // Get all purchase details for this product from this supplier
        List<ImportReceipt> orders = purchaseOrderRepository.findBySupplierId(supplierId);

        List<ImportReceiptDetail> relevantDetails = new ArrayList<>();
        for (ImportReceipt order : orders) {
            for (ImportReceiptDetail detail : order.getChiTietList()) {
                if (detail.getProduct().getId().equals(product.getId())) {
                    relevantDetails.add(detail);
                }
            }
        }

        // Calculate statistics
        Long totalQuantity = relevantDetails.stream()
                .mapToLong(ImportReceiptDetail::getSoLuongNhap)
                .sum();

        BigDecimal totalValue = relevantDetails.stream()
                .map(ImportReceiptDetail::getThanhTien)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal avgPrice = BigDecimal.ZERO;
        if (!relevantDetails.isEmpty()) {
            BigDecimal totalPrices = relevantDetails.stream()
                    .map(ImportReceiptDetail::getGiaNhap)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);
            avgPrice = totalPrices.divide(
                    BigDecimal.valueOf(relevantDetails.size()), 2, RoundingMode.HALF_UP);
        }

        // Get last purchase info
        BigDecimal lastPrice = null;
        LocalDateTime lastDate = null;
        if (!orders.isEmpty()) {
            ImportReceipt lastOrder = orders.get(0); // Already sorted DESC
            lastDate = lastOrder.getNgayNhap();

            for (ImportReceiptDetail detail : lastOrder.getChiTietList()) {
                if (detail.getProduct().getId().equals(product.getId())) {
                    lastPrice = detail.getGiaNhap();
                    break;
                }
            }
        }

        return SupplierProductResponse.builder()
                .productId(product.getId())
                .productCode(product.getCode())
                .productName(product.getName())
                .categoryName(product.getCategory() != null ? product.getCategory().getName() : "N/A")
                .currentPrice(product.getPrice())
                .currentStock(product.getStock())
                .totalPurchaseOrders((long) orders.size())
                .totalQuantityPurchased(totalQuantity)
                .lastPurchasePrice(lastPrice)
                .lastPurchaseDate(lastDate)
                .avgPurchasePrice(avgPrice)
                .totalPurchaseValue(totalValue)
                .build();
    }

    /**
     * Build ProductSupplierResponse with statistics
     */
    private ProductSupplierResponse buildProductSupplierResponse(Supplier supplier, Long productId) {
        // Get all purchase details for this product from this supplier
        List<ImportReceipt> orders = purchaseOrderRepository.findBySupplierId(supplier.getId());

        List<ImportReceiptDetail> relevantDetails = new ArrayList<>();
        for (ImportReceipt order : orders) {
            for (ImportReceiptDetail detail : order.getChiTietList()) {
                if (detail.getProduct().getId().equals(productId)) {
                    relevantDetails.add(detail);
                }
            }
        }

        // Calculate statistics
        Long totalQuantity = relevantDetails.stream()
                .mapToLong(ImportReceiptDetail::getSoLuongNhap)
                .sum();

        BigDecimal totalValue = relevantDetails.stream()
                .map(ImportReceiptDetail::getThanhTien)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal avgPrice = BigDecimal.ZERO;
        if (!relevantDetails.isEmpty()) {
            BigDecimal totalPrices = relevantDetails.stream()
                    .map(ImportReceiptDetail::getGiaNhap)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);
            avgPrice = totalPrices.divide(
                    BigDecimal.valueOf(relevantDetails.size()), 2, RoundingMode.HALF_UP);
        }

        // Get last purchase info
        BigDecimal lastPrice = null;
        LocalDateTime lastDate = null;
        if (!orders.isEmpty()) {
            ImportReceipt lastOrder = orders.get(0); // Already sorted DESC
            lastDate = lastOrder.getNgayNhap();

            for (ImportReceiptDetail detail : lastOrder.getChiTietList()) {
                if (detail.getProduct().getId().equals(productId)) {
                    lastPrice = detail.getGiaNhap();
                    break;
                }
            }
        }

        return ProductSupplierResponse.builder()
                .supplierId(supplier.getId())
                .supplierCode(supplier.getMaNcc())
                .supplierName(supplier.getTenNcc())
                .phone(supplier.getSoDienThoai())
                .email(supplier.getEmail())
                .status(supplier.getTrangThai().name())
                .totalPurchaseOrders((long) orders.size())
                .totalQuantityPurchased(totalQuantity)
                .lastPurchasePrice(lastPrice)
                .lastPurchaseDate(lastDate)
                .avgPurchasePrice(avgPrice)
                .totalPurchaseValue(totalValue)
                .build();
    }
}
