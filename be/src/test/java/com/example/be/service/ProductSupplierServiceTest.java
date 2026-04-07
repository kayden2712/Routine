package com.example.be.service;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;

import com.example.be.dto.response.ProductSupplierResponse;
import com.example.be.dto.response.SupplierProductResponse;
import com.example.be.dto.response.SupplierProductStatsResponse;
import com.example.be.entity.Category;
import com.example.be.entity.ImportReceiptDetail;
import com.example.be.entity.Supplier;
import com.example.be.entity.ImportReceipt;
import com.example.be.entity.Product;
import com.example.be.entity.enums.SupplierStatus;
import com.example.be.exception.ResourceNotFoundException;
import com.example.be.repository.SupplierRepository;
import com.example.be.repository.ImportReceiptRepository;
import com.example.be.repository.ProductRepository;

/**
 * Unit tests for ProductSupplierService Implementation
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("ProductSupplier Service Tests")
@SuppressWarnings({ "null", "unused" })
class ProductSupplierServiceTest {

    @Mock
    private ProductRepository productRepository;

    @Mock
    private SupplierRepository supplierRepository;

    @Mock
    private ImportReceiptRepository purchaseOrderRepository;

    @InjectMocks
    private ProductSupplierServiceImpl service;

    private Supplier sampleSupplier;
    private Product sampleProduct;
    private Category sampleCategory;
    private ImportReceipt samplePurchaseOrder;
    private ImportReceiptDetail sampleDetail;

    @BeforeEach
    @SuppressWarnings("unused")
    void setUp() {
        // Setup sample category
        sampleCategory = new Category();
        sampleCategory.setId(1L);
        sampleCategory.setName("Áo Thun");

        // Setup sample supplier
        sampleSupplier = new Supplier();
        sampleSupplier.setId(1L);
        sampleSupplier.setMaNcc("NCC-001");
        sampleSupplier.setTenNcc("Công ty TNHH ABC");
        sampleSupplier.setDiaChi("123 Đường ABC, Q1, TP.HCM");
        sampleSupplier.setSoDienThoai("0901234567");
        sampleSupplier.setEmail("contact@abc.com");
        sampleSupplier.setTrangThai(SupplierStatus.ACTIVE);

        // Setup sample product
        sampleProduct = new Product();
        sampleProduct.setId(1L);
        sampleProduct.setCode("PRD-001");
        sampleProduct.setName("Áo Thun Nam");
        sampleProduct.setPrice(BigDecimal.valueOf(200000));
        sampleProduct.setStock(100);
        sampleProduct.setCategory(sampleCategory);

        // Setup sample purchase order
        samplePurchaseOrder = new ImportReceipt();
        samplePurchaseOrder.setId(1L);
        samplePurchaseOrder.setMaPhieuNhap("PNK-001");
        samplePurchaseOrder.setNgayNhap(LocalDateTime.now());
        samplePurchaseOrder.setNhaCungCap(sampleSupplier);
        samplePurchaseOrder.setTongTien(BigDecimal.valueOf(5000000));

        // Setup sample detail
        sampleDetail = new ImportReceiptDetail();
        sampleDetail.setId(1L);
        sampleDetail.setPhieuNhap(samplePurchaseOrder);
        sampleDetail.setProduct(sampleProduct);
        sampleDetail.setSoLuongNhap(50);
        sampleDetail.setGiaNhap(BigDecimal.valueOf(100000));

        samplePurchaseOrder.setChiTietList(Arrays.asList(sampleDetail));
    }

    // ============ GET PRODUCTS BY SUPPLIER ID TESTS ============

    @Test
    @DisplayName("getProductsBySupplierId - Should return products successfully")
    void testGetProductsBySupplierId_Success() {
        // Arrange
        Long supplierId = 1L;
        List<Product> products = Arrays.asList(sampleProduct);

        when(supplierRepository.findById(supplierId)).thenReturn(Optional.of(sampleSupplier));
        when(productRepository.findProductsBySupplierId(supplierId)).thenReturn(products);
        when(purchaseOrderRepository.findBySupplierId(supplierId))
                .thenReturn(Arrays.asList(samplePurchaseOrder));

        // Act
        List<SupplierProductResponse> result = service.getProductsBySupplierId(supplierId);

        // Assert
        assertNotNull(result);
        assertEquals(1, result.size());

        SupplierProductResponse response = result.get(0);
        assertEquals(sampleProduct.getId(), response.getProductId());
        assertEquals(sampleProduct.getCode(), response.getProductCode());
        assertEquals(sampleProduct.getName(), response.getProductName());
        assertEquals(sampleCategory.getName(), response.getCategoryName());
        assertEquals(sampleProduct.getPrice(), response.getCurrentPrice());
        assertEquals(sampleProduct.getStock(), response.getCurrentStock());

        verify(supplierRepository).findById(supplierId);
        verify(productRepository).findProductsBySupplierId(supplierId);
        verify(purchaseOrderRepository, atLeastOnce()).findBySupplierId(supplierId);
    }

    @Test
    @DisplayName("getProductsBySupplierId - Should throw exception when supplier not found")
    void testGetProductsBySupplierId_SupplierNotFound() {
        // Arrange
        Long supplierId = 999L;
        when(supplierRepository.findById(supplierId)).thenReturn(Optional.empty());

        // Act & Assert
        ResourceNotFoundException exception = assertThrows(
                ResourceNotFoundException.class,
                () -> service.getProductsBySupplierId(supplierId));

        assertTrue(exception.getMessage().contains("Không tìm thấy nhà cung cấp"));
        verify(supplierRepository).findById(supplierId);
        verify(productRepository, never()).findProductsBySupplierId(any());
    }

    @Test
    @DisplayName("getProductsBySupplierId - Should return empty list when no products")
    void testGetProductsBySupplierId_NoProducts() {
        // Arrange
        Long supplierId = 1L;
        when(supplierRepository.findById(supplierId)).thenReturn(Optional.of(sampleSupplier));
        when(productRepository.findProductsBySupplierId(supplierId)).thenReturn(Collections.emptyList());

        // Act
        List<SupplierProductResponse> result = service.getProductsBySupplierId(supplierId);

        // Assert
        assertNotNull(result);
        assertTrue(result.isEmpty());
        verify(supplierRepository).findById(supplierId);
        verify(productRepository).findProductsBySupplierId(supplierId);
    }

    // ============ GET SUPPLIERS BY PRODUCT ID TESTS ============

    @Test
    @DisplayName("getSuppliersByProductId - Should return suppliers successfully")
    void testGetSuppliersByProductId_Success() {
        // Arrange
        Long productId = 1L;
        List<Supplier> suppliers = Arrays.asList(sampleSupplier);

        when(productRepository.findById(productId)).thenReturn(Optional.of(sampleProduct));
        when(purchaseOrderRepository.findSuppliersByProductId(productId)).thenReturn(suppliers);
        when(purchaseOrderRepository.findBySupplierId(sampleSupplier.getId()))
                .thenReturn(Arrays.asList(samplePurchaseOrder));

        // Act
        List<ProductSupplierResponse> result = service.getSuppliersByProductId(productId);

        // Assert
        assertNotNull(result);
        assertEquals(1, result.size());

        ProductSupplierResponse response = result.get(0);
        assertEquals(sampleSupplier.getId(), response.getSupplierId());
        assertEquals(sampleSupplier.getMaNcc(), response.getSupplierCode());
        assertEquals(sampleSupplier.getTenNcc(), response.getSupplierName());
        assertEquals(sampleSupplier.getSoDienThoai(), response.getPhone());
        assertEquals(sampleSupplier.getEmail(), response.getEmail());
        assertEquals(sampleSupplier.getTrangThai().name(), response.getStatus());

        verify(productRepository).findById(productId);
        verify(purchaseOrderRepository).findSuppliersByProductId(productId);
        verify(purchaseOrderRepository, atLeastOnce()).findBySupplierId(sampleSupplier.getId());
    }

    @Test
    @DisplayName("getSuppliersByProductId - Should throw exception when product not found")
    void testGetSuppliersByProductId_ProductNotFound() {
        // Arrange
        Long productId = 999L;
        when(productRepository.findById(productId)).thenReturn(Optional.empty());

        // Act & Assert
        ResourceNotFoundException exception = assertThrows(
                ResourceNotFoundException.class,
                () -> service.getSuppliersByProductId(productId));

        assertTrue(exception.getMessage().contains("Không tìm thấy sản phẩm"));
        verify(productRepository).findById(productId);
        verify(purchaseOrderRepository, never()).findSuppliersByProductId(any());
    }

    @Test
    @DisplayName("getSuppliersByProductId - Should return empty list when no suppliers")
    void testGetSuppliersByProductId_NoSuppliers() {
        // Arrange
        Long productId = 1L;
        when(productRepository.findById(productId)).thenReturn(Optional.of(sampleProduct));
        when(purchaseOrderRepository.findSuppliersByProductId(productId)).thenReturn(Collections.emptyList());

        // Act
        List<ProductSupplierResponse> result = service.getSuppliersByProductId(productId);

        // Assert
        assertNotNull(result);
        assertTrue(result.isEmpty());
        verify(productRepository).findById(productId);
        verify(purchaseOrderRepository).findSuppliersByProductId(productId);
    }

    // ============ GET PURCHASE HISTORY BY SUPPLIER ID TESTS ============

    @Test
    @DisplayName("getPurchaseHistoryBySupplierId - Should return paginated history successfully")
    void testGetPurchaseHistoryBySupplierId_Success() {
        // Arrange
        Long supplierId = 1L;
        Pageable pageable = PageRequest.of(0, 10);
        List<ImportReceipt> orders = Arrays.asList(samplePurchaseOrder);

        when(supplierRepository.findById(supplierId)).thenReturn(Optional.of(sampleSupplier));
        when(purchaseOrderRepository.findBySupplierId(supplierId)).thenReturn(orders);

        // Act
        Page<ImportReceipt> result = service.getPurchaseHistoryBySupplierId(supplierId, pageable);

        // Assert
        assertNotNull(result);
        assertEquals(1, result.getTotalElements());
        assertEquals(1, result.getContent().size());
        assertEquals(samplePurchaseOrder.getId(), result.getContent().get(0).getId());

        verify(supplierRepository).findById(supplierId);
        verify(purchaseOrderRepository).findBySupplierId(supplierId);
    }

    @Test
    @DisplayName("getPurchaseHistoryBySupplierId - Should throw exception when supplier not found")
    void testGetPurchaseHistoryBySupplierId_SupplierNotFound() {
        // Arrange
        Long supplierId = 999L;
        Pageable pageable = PageRequest.of(0, 10);
        when(supplierRepository.findById(supplierId)).thenReturn(Optional.empty());

        // Act & Assert
        ResourceNotFoundException exception = assertThrows(
                ResourceNotFoundException.class,
                () -> service.getPurchaseHistoryBySupplierId(supplierId, pageable));

        assertTrue(exception.getMessage().contains("Không tìm thấy nhà cung cấp"));
        verify(supplierRepository).findById(supplierId);
        verify(purchaseOrderRepository, never()).findBySupplierId(any());
    }

    @Test
    @DisplayName("getPurchaseHistoryBySupplierId - Should handle pagination correctly")
    void testGetPurchaseHistoryBySupplierId_WithPagination() {
        // Arrange
        Long supplierId = 1L;
        ImportReceipt order2 = new ImportReceipt();
        order2.setId(2L);
        order2.setMaPhieuNhap("PNK-002");

        List<ImportReceipt> orders = Arrays.asList(samplePurchaseOrder, order2);
        Pageable pageable = PageRequest.of(0, 1); // First page, size 1

        when(supplierRepository.findById(supplierId)).thenReturn(Optional.of(sampleSupplier));
        when(purchaseOrderRepository.findBySupplierId(supplierId)).thenReturn(orders);

        // Act
        Page<ImportReceipt> result = service.getPurchaseHistoryBySupplierId(supplierId, pageable);

        // Assert
        assertNotNull(result);
        assertEquals(2, result.getTotalElements());
        assertEquals(1, result.getContent().size());
        assertEquals(samplePurchaseOrder.getId(), result.getContent().get(0).getId());

        verify(supplierRepository).findById(supplierId);
        verify(purchaseOrderRepository).findBySupplierId(supplierId);
    }

    // ============ GET PURCHASE HISTORY BY PRODUCT ID TESTS ============

    @Test
    @DisplayName("getPurchaseHistoryByProductId - Should return paginated history successfully")
    void testGetPurchaseHistoryByProductId_Success() {
        // Arrange
        Long productId = 1L;
        Pageable pageable = PageRequest.of(0, 10);
        Page<ImportReceipt> ordersPage = new PageImpl<>(Arrays.asList(samplePurchaseOrder));

        when(productRepository.findById(productId)).thenReturn(Optional.of(sampleProduct));
        when(purchaseOrderRepository.findByProductId(productId, pageable)).thenReturn(ordersPage);

        // Act
        Page<ImportReceipt> result = service.getPurchaseHistoryByProductId(productId, pageable);

        // Assert
        assertNotNull(result);
        assertEquals(1, result.getTotalElements());
        assertEquals(1, result.getContent().size());
        assertEquals(samplePurchaseOrder.getId(), result.getContent().get(0).getId());

        verify(productRepository).findById(productId);
        verify(purchaseOrderRepository).findByProductId(productId, pageable);
    }

    @Test
    @DisplayName("getPurchaseHistoryByProductId - Should throw exception when product not found")
    void testGetPurchaseHistoryByProductId_ProductNotFound() {
        // Arrange
        Long productId = 999L;
        Pageable pageable = PageRequest.of(0, 10);
        when(productRepository.findById(productId)).thenReturn(Optional.empty());

        // Act & Assert
        ResourceNotFoundException exception = assertThrows(
                ResourceNotFoundException.class,
                () -> service.getPurchaseHistoryByProductId(productId, pageable));

        assertTrue(exception.getMessage().contains("Không tìm thấy sản phẩm"));
        verify(productRepository).findById(productId);
        verify(purchaseOrderRepository, never()).findByProductId(any(), any());
    }

    // ============ GET SUPPLIER STATISTICS TESTS ============

    @Test
    @DisplayName("getSupplierStatistics - Should return statistics successfully")
    void testGetSupplierStatistics_Success() {
        // Arrange
        Long supplierId = 1L;
        Long totalProducts = 5L;
        Long totalOrders = 10L;
        Double totalValue = 50000000.0;

        when(supplierRepository.findById(supplierId)).thenReturn(Optional.of(sampleSupplier));
        when(productRepository.countProductsBySupplierId(supplierId)).thenReturn(totalProducts);
        when(supplierRepository.countPurchaseReceiptsBySupplierId(supplierId)).thenReturn(totalOrders);
        when(supplierRepository.sumTotalPurchaseValueBySupplierId(supplierId)).thenReturn(totalValue);
        when(purchaseOrderRepository.findBySupplierId(supplierId))
                .thenReturn(Arrays.asList(samplePurchaseOrder));
        when(productRepository.findProductsBySupplierId(supplierId))
                .thenReturn(Arrays.asList(sampleProduct));

        // Act
        SupplierProductStatsResponse result = service.getSupplierStatistics(supplierId);

        // Assert
        assertNotNull(result);
        assertEquals(supplierId, result.getSupplierId());
        assertEquals(sampleSupplier.getTenNcc(), result.getSupplierName());
        assertEquals(totalProducts, result.getTotalProducts());
        assertEquals(totalOrders, result.getTotalPurchaseOrders());
        assertNotNull(result.getTotalQuantityPurchased());
        assertNotNull(result.getTotalPurchaseValue());
        assertNotNull(result.getAvgOrderValue());

        verify(supplierRepository).findById(supplierId);
        verify(productRepository).countProductsBySupplierId(supplierId);
        verify(supplierRepository).countPurchaseReceiptsBySupplierId(supplierId);
        verify(supplierRepository).sumTotalPurchaseValueBySupplierId(supplierId);
    }

    @Test
    @DisplayName("getSupplierStatistics - Should throw exception when supplier not found")
    void testGetSupplierStatistics_SupplierNotFound() {
        // Arrange
        Long supplierId = 999L;
        when(supplierRepository.findById(supplierId)).thenReturn(Optional.empty());

        // Act & Assert
        ResourceNotFoundException exception = assertThrows(
                ResourceNotFoundException.class,
                () -> service.getSupplierStatistics(supplierId));

        assertTrue(exception.getMessage().contains("Không tìm thấy nhà cung cấp"));
        verify(supplierRepository).findById(supplierId);
        verify(productRepository, never()).countProductsBySupplierId(any());
    }

    @Test
    @DisplayName("getSupplierStatistics - Should handle zero values correctly")
    void testGetSupplierStatistics_ZeroValues() {
        // Arrange
        Long supplierId = 1L;
        when(supplierRepository.findById(supplierId)).thenReturn(Optional.of(sampleSupplier));
        when(productRepository.countProductsBySupplierId(supplierId)).thenReturn(0L);
        when(supplierRepository.countPurchaseReceiptsBySupplierId(supplierId)).thenReturn(0L);
        when(supplierRepository.sumTotalPurchaseValueBySupplierId(supplierId)).thenReturn(null);
        when(purchaseOrderRepository.findBySupplierId(supplierId)).thenReturn(Collections.emptyList());
        when(productRepository.findProductsBySupplierId(supplierId)).thenReturn(Collections.emptyList());

        // Act
        SupplierProductStatsResponse result = service.getSupplierStatistics(supplierId);

        // Assert
        assertNotNull(result);
        assertEquals(0L, result.getTotalProducts());
        assertEquals(0L, result.getTotalPurchaseOrders());
        assertEquals(0L, result.getTotalQuantityPurchased());
        assertEquals(BigDecimal.ZERO, result.getTotalPurchaseValue());
        assertEquals(BigDecimal.ZERO, result.getAvgOrderValue());
    }

    // ============ GET PRODUCT STATISTICS TESTS ============

    @Test
    @DisplayName("getProductStatistics - Should return statistics successfully")
    void testGetProductStatistics_Success() {
        // Arrange
        Long productId = 1L;
        List<Supplier> suppliers = Arrays.asList(sampleSupplier);
        List<ImportReceipt> orders = Arrays.asList(samplePurchaseOrder);

        when(productRepository.findById(productId)).thenReturn(Optional.of(sampleProduct));
        when(purchaseOrderRepository.findSuppliersByProductId(productId)).thenReturn(suppliers);
        when(purchaseOrderRepository.findByProductId(productId)).thenReturn(orders);

        // Act
        SupplierProductStatsResponse result = service.getProductStatistics(productId);

        // Assert
        assertNotNull(result);
        assertEquals(productId, result.getSupplierId()); // Reusing field
        assertEquals(sampleProduct.getName(), result.getSupplierName()); // Reusing field
        assertEquals(1L, result.getTotalProducts()); // Number of suppliers
        assertEquals(1L, result.getTotalPurchaseOrders());
        assertNotNull(result.getTotalQuantityPurchased());
        assertNotNull(result.getTotalPurchaseValue());

        verify(productRepository).findById(productId);
        verify(purchaseOrderRepository).findSuppliersByProductId(productId);
        verify(purchaseOrderRepository).findByProductId(productId);
    }

    @Test
    @DisplayName("getProductStatistics - Should throw exception when product not found")
    void testGetProductStatistics_ProductNotFound() {
        // Arrange
        Long productId = 999L;
        when(productRepository.findById(productId)).thenReturn(Optional.empty());

        // Act & Assert
        ResourceNotFoundException exception = assertThrows(
                ResourceNotFoundException.class,
                () -> service.getProductStatistics(productId));

        assertTrue(exception.getMessage().contains("Không tìm thấy sản phẩm"));
        verify(productRepository).findById(productId);
        verify(purchaseOrderRepository, never()).findSuppliersByProductId(any());
    }

    @Test
    @DisplayName("getProductStatistics - Should handle zero values correctly")
    void testGetProductStatistics_ZeroValues() {
        // Arrange
        Long productId = 1L;
        when(productRepository.findById(productId)).thenReturn(Optional.of(sampleProduct));
        when(purchaseOrderRepository.findSuppliersByProductId(productId)).thenReturn(Collections.emptyList());
        when(purchaseOrderRepository.findByProductId(productId)).thenReturn(Collections.emptyList());

        // Act
        SupplierProductStatsResponse result = service.getProductStatistics(productId);

        // Assert
        assertNotNull(result);
        assertEquals(0L, result.getTotalProducts()); // Number of suppliers
        assertEquals(0L, result.getTotalPurchaseOrders());
        assertEquals(0L, result.getTotalQuantityPurchased());
        assertEquals(BigDecimal.ZERO, result.getTotalPurchaseValue());
        assertEquals(BigDecimal.ZERO, result.getAvgOrderValue());
    }
}
