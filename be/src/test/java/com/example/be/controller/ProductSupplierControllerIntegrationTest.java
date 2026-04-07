package com.example.be.controller;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import com.example.be.dto.response.ProductSupplierResponse;
import com.example.be.dto.response.SupplierProductResponse;
import com.example.be.dto.response.SupplierProductStatsResponse;
import com.example.be.entity.ImportReceipt;
import com.example.be.exception.GlobalExceptionHandler;
import com.example.be.exception.ResourceNotFoundException;
import com.example.be.service.ProductSupplierService;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;

/**
 * Integration tests for ProductSupplier Controller
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("ProductSupplier Controller Integration Tests")
@SuppressWarnings({ "null", "unused" })
class ProductSupplierControllerIntegrationTest {

        private MockMvc mockMvc;

        @Mock
        private ProductSupplierService productSupplierService;

        @InjectMocks
        private ProductSupplierController productSupplierController;

        private final ObjectMapper objectMapper = new ObjectMapper();

        private SupplierProductResponse sampleSupplierProductResponse;
        private ProductSupplierResponse sampleProductSupplierResponse;
        private SupplierProductStatsResponse sampleStatsResponse;
        private ImportReceipt samplePurchaseOrder;

        @BeforeEach
        @SuppressWarnings("unused")
        void setUp() {
                objectMapper.registerModule(new JavaTimeModule());

                mockMvc = MockMvcBuilders.standaloneSetup(productSupplierController)
                                .setControllerAdvice(new GlobalExceptionHandler())
                                .build();

                // Setup sample SupplierProductResponse
                sampleSupplierProductResponse = SupplierProductResponse.builder()
                                .productId(1L)
                                .productCode("PRD-001")
                                .productName("Áo Thun Nam")
                                .categoryName("Áo Thun")
                                .currentPrice(BigDecimal.valueOf(200000))
                                .currentStock(100)
                                .totalPurchaseOrders(5L)
                                .totalQuantityPurchased(500L)
                                .lastPurchasePrice(BigDecimal.valueOf(100000))
                                .lastPurchaseDate(LocalDateTime.now())
                                .avgPurchasePrice(BigDecimal.valueOf(95000))
                                .totalPurchaseValue(BigDecimal.valueOf(47500000))
                                .build();

                // Setup sample ProductSupplierResponse
                sampleProductSupplierResponse = ProductSupplierResponse.builder()
                                .supplierId(1L)
                                .supplierCode("NCC-001")
                                .supplierName("Công ty TNHH ABC")
                                .phone("0901234567")
                                .email("contact@abc.com")
                                .status("ACTIVE")
                                .totalPurchaseOrders(10L)
                                .totalQuantityPurchased(1000L)
                                .lastPurchasePrice(BigDecimal.valueOf(100000))
                                .lastPurchaseDate(LocalDateTime.now())
                                .avgPurchasePrice(BigDecimal.valueOf(98000))
                                .totalPurchaseValue(BigDecimal.valueOf(98000000))
                                .build();

                // Setup sample SupplierProductStatsResponse
                sampleStatsResponse = SupplierProductStatsResponse.builder()
                                .supplierId(1L)
                                .supplierName("Công ty TNHH ABC")
                                .totalProducts(25L)
                                .totalPurchaseOrders(50L)
                                .totalQuantityPurchased(5000L)
                                .totalPurchaseValue(BigDecimal.valueOf(500000000))
                                .avgOrderValue(BigDecimal.valueOf(10000000))
                                .activeProducts(20)
                                .inactiveProducts(5)
                                .build();

                // Setup sample PhieuNhapKho
                samplePurchaseOrder = new ImportReceipt();
                samplePurchaseOrder.setId(1L);
                samplePurchaseOrder.setMaPhieuNhap("PNK-001");
                samplePurchaseOrder.setNgayNhap(LocalDateTime.now());
                samplePurchaseOrder.setTongTien(BigDecimal.valueOf(10000000));
        }

        // ============ GET PRODUCTS BY SUPPLIER ID TESTS ============

        @Test
        @WithMockUser(roles = "MANAGER")
        @DisplayName("GET /api/suppliers/{id}/products - Should return products successfully")
        void testGetProductsBySupplierId_Success() throws Exception {
                // Arrange
                Long supplierId = 1L;
                List<SupplierProductResponse> products = Arrays.asList(sampleSupplierProductResponse);

                when(productSupplierService.getProductsBySupplierId(supplierId)).thenReturn(products);

                // Act & Assert
                mockMvc.perform(get("/api/suppliers/{supplierId}/products", supplierId)
                                .contentType(MediaType.APPLICATION_JSON))
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$.success").value(true))
                                .andExpect(jsonPath("$.message")
                                                .value("Lấy danh sách sản phẩm của nhà cung cấp thành công"))
                                .andExpect(jsonPath("$.data").isArray())
                                .andExpect(jsonPath("$.data[0].productId").value(1))
                                .andExpect(jsonPath("$.data[0].productCode").value("PRD-001"))
                                .andExpect(jsonPath("$.data[0].productName").value("Áo Thun Nam"))
                                .andExpect(jsonPath("$.data[0].categoryName").value("Áo Thun"))
                                .andExpect(jsonPath("$.data[0].currentPrice").value(200000))
                                .andExpect(jsonPath("$.data[0].currentStock").value(100))
                                .andExpect(jsonPath("$.data[0].totalPurchaseOrders").value(5))
                                .andExpect(jsonPath("$.data[0].totalQuantityPurchased").value(500));

                verify(productSupplierService).getProductsBySupplierId(supplierId);
        }

        @Test
        @WithMockUser(roles = "MANAGER")
        @DisplayName("GET /api/suppliers/{id}/products - Should return 404 when supplier not found")
        void testGetProductsBySupplierId_NotFound() throws Exception {
                // Arrange
                Long supplierId = 999L;
                when(productSupplierService.getProductsBySupplierId(supplierId))
                                .thenThrow(new ResourceNotFoundException(
                                                "Không tìm thấy nhà cung cấp với ID: " + supplierId));

                // Act & Assert
                mockMvc.perform(get("/api/suppliers/{supplierId}/products", supplierId)
                                .contentType(MediaType.APPLICATION_JSON))
                                .andExpect(status().isNotFound())
                                .andExpect(jsonPath("$.success").value(false))
                                .andExpect(jsonPath("$.message")
                                                .value("Không tìm thấy nhà cung cấp với ID: " + supplierId));

                verify(productSupplierService).getProductsBySupplierId(supplierId);
        }

        @Test
        @WithMockUser(roles = "WAREHOUSE_STAFF")
        @DisplayName("GET /api/suppliers/{id}/products - WAREHOUSE_STAFF should have access")
        void testGetProductsBySupplierId_WarehouseStaffAccess() throws Exception {
                // Arrange
                Long supplierId = 1L;
                when(productSupplierService.getProductsBySupplierId(supplierId))
                                .thenReturn(Arrays.asList(sampleSupplierProductResponse));

                // Act & Assert
                mockMvc.perform(get("/api/suppliers/{supplierId}/products", supplierId)
                                .contentType(MediaType.APPLICATION_JSON))
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$.success").value(true));

                verify(productSupplierService).getProductsBySupplierId(supplierId);
        }

        @Test
        @WithMockUser(roles = "CUSTOMER")
        @DisplayName("GET /api/suppliers/{id}/products - Should return 403 for non-authorized role")
        void testGetProductsBySupplierId_Forbidden() throws Exception {
                // Arrange
                Long supplierId = 1L;

                // Act & Assert
                mockMvc.perform(get("/api/suppliers/{supplierId}/products", supplierId)
                                .contentType(MediaType.APPLICATION_JSON))
                                .andExpect(status().isForbidden());

                verify(productSupplierService, never()).getProductsBySupplierId(any());
        }

        // ============ GET SUPPLIERS BY PRODUCT ID TESTS ============

        @Test
        @WithMockUser(roles = "MANAGER")
        @DisplayName("GET /api/products/{id}/suppliers - Should return suppliers successfully")
        void testGetSuppliersByProductId_Success() throws Exception {
                // Arrange
                Long productId = 1L;
                List<ProductSupplierResponse> suppliers = Arrays.asList(sampleProductSupplierResponse);

                when(productSupplierService.getSuppliersByProductId(productId)).thenReturn(suppliers);

                // Act & Assert
                mockMvc.perform(get("/api/products/{productId}/suppliers", productId)
                                .contentType(MediaType.APPLICATION_JSON))
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$.success").value(true))
                                .andExpect(jsonPath("$.message")
                                                .value("Lấy danh sách nhà cung cấp của sản phẩm thành công"))
                                .andExpect(jsonPath("$.data").isArray())
                                .andExpect(jsonPath("$.data[0].supplierId").value(1))
                                .andExpect(jsonPath("$.data[0].supplierCode").value("NCC-001"))
                                .andExpect(jsonPath("$.data[0].supplierName").value("Công ty TNHH ABC"))
                                .andExpect(jsonPath("$.data[0].phone").value("0901234567"))
                                .andExpect(jsonPath("$.data[0].email").value("contact@abc.com"))
                                .andExpect(jsonPath("$.data[0].status").value("ACTIVE"))
                                .andExpect(jsonPath("$.data[0].totalPurchaseOrders").value(10))
                                .andExpect(jsonPath("$.data[0].totalQuantityPurchased").value(1000));

                verify(productSupplierService).getSuppliersByProductId(productId);
        }

        @Test
        @WithMockUser(roles = "MANAGER")
        @DisplayName("GET /api/products/{id}/suppliers - Should return 404 when product not found")
        void testGetSuppliersByProductId_NotFound() throws Exception {
                // Arrange
                Long productId = 999L;
                when(productSupplierService.getSuppliersByProductId(productId))
                                .thenThrow(new ResourceNotFoundException(
                                                "Không tìm thấy sản phẩm với ID: " + productId));

                // Act & Assert
                mockMvc.perform(get("/api/products/{productId}/suppliers", productId)
                                .contentType(MediaType.APPLICATION_JSON))
                                .andExpect(status().isNotFound())
                                .andExpect(jsonPath("$.success").value(false))
                                .andExpect(jsonPath("$.message").value("Không tìm thấy sản phẩm với ID: " + productId));

                verify(productSupplierService).getSuppliersByProductId(productId);
        }

        // ============ GET PURCHASE HISTORY BY SUPPLIER ID TESTS ============

        @Test
        @WithMockUser(roles = "MANAGER")
        @DisplayName("GET /api/suppliers/{id}/purchase-history - Should return history with pagination")
        void testGetPurchaseHistoryBySupplierId_Success() throws Exception {
                // Arrange
                Long supplierId = 1L;
                Page<ImportReceipt> historyPage = new PageImpl<>(Arrays.asList(samplePurchaseOrder));

                when(productSupplierService.getPurchaseHistoryBySupplierId(eq(supplierId), any(Pageable.class)))
                                .thenReturn(historyPage);

                // Act & Assert
                mockMvc.perform(get("/api/suppliers/{supplierId}/purchase-history", supplierId)
                                .param("page", "0")
                                .param("size", "10")
                                .param("sortBy", "ngayNhap")
                                .param("sortDirection", "DESC")
                                .contentType(MediaType.APPLICATION_JSON))
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$.success").value(true))
                                .andExpect(jsonPath("$.message")
                                                .value("Lấy lịch sử nhập hàng của nhà cung cấp thành công"))
                                .andExpect(jsonPath("$.data.content").isArray())
                                .andExpect(jsonPath("$.data.content[0].id").value(1))
                                .andExpect(jsonPath("$.data.content[0].maPhieuNhap").value("PNK-001"));

                verify(productSupplierService).getPurchaseHistoryBySupplierId(eq(supplierId), any(Pageable.class));
        }

        @Test
        @WithMockUser(roles = "ACCOUNTANT")
        @DisplayName("GET /api/suppliers/{id}/purchase-history - ACCOUNTANT should have access")
        void testGetPurchaseHistoryBySupplierId_AccountantAccess() throws Exception {
                // Arrange
                Long supplierId = 1L;
                Page<ImportReceipt> historyPage = new PageImpl<>(Collections.emptyList());

                when(productSupplierService.getPurchaseHistoryBySupplierId(eq(supplierId), any(Pageable.class)))
                                .thenReturn(historyPage);

                // Act & Assert
                mockMvc.perform(get("/api/suppliers/{supplierId}/purchase-history", supplierId)
                                .contentType(MediaType.APPLICATION_JSON))
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$.success").value(true));

                verify(productSupplierService).getPurchaseHistoryBySupplierId(eq(supplierId), any(Pageable.class));
        }

        @Test
        @WithMockUser(roles = "MANAGER")
        @DisplayName("GET /api/suppliers/{id}/purchase-history - Should handle custom pagination")
        void testGetPurchaseHistoryBySupplierId_CustomPagination() throws Exception {
                // Arrange
                Long supplierId = 1L;
                Page<ImportReceipt> historyPage = new PageImpl<>(Arrays.asList(samplePurchaseOrder));

                when(productSupplierService.getPurchaseHistoryBySupplierId(eq(supplierId), any(Pageable.class)))
                                .thenReturn(historyPage);

                // Act & Assert
                mockMvc.perform(get("/api/suppliers/{supplierId}/purchase-history", supplierId)
                                .param("page", "2")
                                .param("size", "20")
                                .param("sortBy", "tongGiaTri")
                                .param("sortDirection", "ASC")
                                .contentType(MediaType.APPLICATION_JSON))
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$.success").value(true));

                verify(productSupplierService).getPurchaseHistoryBySupplierId(eq(supplierId), any(Pageable.class));
        }

        // ============ GET PURCHASE HISTORY BY PRODUCT ID TESTS ============

        @Test
        @WithMockUser(roles = "MANAGER")
        @DisplayName("GET /api/products/{id}/purchase-history - Should return history with pagination")
        void testGetPurchaseHistoryByProductId_Success() throws Exception {
                // Arrange
                Long productId = 1L;
                Page<ImportReceipt> historyPage = new PageImpl<>(Arrays.asList(samplePurchaseOrder));

                when(productSupplierService.getPurchaseHistoryByProductId(eq(productId), any(Pageable.class)))
                                .thenReturn(historyPage);

                // Act & Assert
                mockMvc.perform(get("/api/products/{productId}/purchase-history", productId)
                                .param("page", "0")
                                .param("size", "10")
                                .param("sortBy", "ngayNhap")
                                .param("sortDirection", "DESC")
                                .contentType(MediaType.APPLICATION_JSON))
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$.success").value(true))
                                .andExpect(jsonPath("$.message").value("Lấy lịch sử nhập hàng của sản phẩm thành công"))
                                .andExpect(jsonPath("$.data.content").isArray())
                                .andExpect(jsonPath("$.data.content[0].id").value(1));

                verify(productSupplierService).getPurchaseHistoryByProductId(eq(productId), any(Pageable.class));
        }

        @Test
        @WithMockUser(roles = "WAREHOUSE_STAFF")
        @DisplayName("GET /api/products/{id}/purchase-history - WAREHOUSE_STAFF should have access")
        void testGetPurchaseHistoryByProductId_WarehouseStaffAccess() throws Exception {
                // Arrange
                Long productId = 1L;
                Page<ImportReceipt> historyPage = new PageImpl<>(Collections.emptyList());

                when(productSupplierService.getPurchaseHistoryByProductId(eq(productId), any(Pageable.class)))
                                .thenReturn(historyPage);

                // Act & Assert
                mockMvc.perform(get("/api/products/{productId}/purchase-history", productId)
                                .contentType(MediaType.APPLICATION_JSON))
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$.success").value(true));

                verify(productSupplierService).getPurchaseHistoryByProductId(eq(productId), any(Pageable.class));
        }

        // ============ GET SUPPLIER STATISTICS TESTS ============

        @Test
        @WithMockUser(roles = "MANAGER")
        @DisplayName("GET /api/suppliers/{id}/statistics - Should return statistics successfully")
        void testGetSupplierStatistics_Success() throws Exception {
                // Arrange
                Long supplierId = 1L;
                when(productSupplierService.getSupplierStatistics(supplierId)).thenReturn(sampleStatsResponse);

                // Act & Assert
                mockMvc.perform(get("/api/suppliers/{supplierId}/statistics", supplierId)
                                .contentType(MediaType.APPLICATION_JSON))
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$.success").value(true))
                                .andExpect(jsonPath("$.message").value("Lấy thống kê nhà cung cấp thành công"))
                                .andExpect(jsonPath("$.data.supplierId").value(1))
                                .andExpect(jsonPath("$.data.supplierName").value("Công ty TNHH ABC"))
                                .andExpect(jsonPath("$.data.totalProducts").value(25))
                                .andExpect(jsonPath("$.data.totalPurchaseOrders").value(50))
                                .andExpect(jsonPath("$.data.totalQuantityPurchased").value(5000))
                                .andExpect(jsonPath("$.data.totalPurchaseValue").value(500000000))
                                .andExpect(jsonPath("$.data.avgOrderValue").value(10000000))
                                .andExpect(jsonPath("$.data.activeProducts").value(20))
                                .andExpect(jsonPath("$.data.inactiveProducts").value(5));

                verify(productSupplierService).getSupplierStatistics(supplierId);
        }

        @Test
        @WithMockUser(roles = "ACCOUNTANT")
        @DisplayName("GET /api/suppliers/{id}/statistics - ACCOUNTANT should have access")
        void testGetSupplierStatistics_AccountantAccess() throws Exception {
                // Arrange
                Long supplierId = 1L;
                when(productSupplierService.getSupplierStatistics(supplierId)).thenReturn(sampleStatsResponse);

                // Act & Assert
                mockMvc.perform(get("/api/suppliers/{supplierId}/statistics", supplierId)
                                .contentType(MediaType.APPLICATION_JSON))
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$.success").value(true));

                verify(productSupplierService).getSupplierStatistics(supplierId);
        }

        @Test
        @WithMockUser(roles = "WAREHOUSE_STAFF")
        @DisplayName("GET /api/suppliers/{id}/statistics - Should return 403 for WAREHOUSE_STAFF")
        void testGetSupplierStatistics_WarehouseStaffForbidden() throws Exception {
                // Arrange
                Long supplierId = 1L;

                // Act & Assert
                mockMvc.perform(get("/api/suppliers/{supplierId}/statistics", supplierId)
                                .contentType(MediaType.APPLICATION_JSON))
                                .andExpect(status().isForbidden());

                verify(productSupplierService, never()).getSupplierStatistics(any());
        }

        // ============ GET PRODUCT STATISTICS TESTS ============

        @Test
        @WithMockUser(roles = "MANAGER")
        @DisplayName("GET /api/products/{id}/statistics - Should return statistics successfully")
        void testGetProductStatistics_Success() throws Exception {
                // Arrange
                Long productId = 1L;
                SupplierProductStatsResponse productStats = SupplierProductStatsResponse.builder()
                                .supplierId(1L) // Reusing field for productId
                                .supplierName("Áo Thun Nam") // Reusing field for productName
                                .totalProducts(3L) // Number of suppliers
                                .totalPurchaseOrders(15L)
                                .totalQuantityPurchased(1500L)
                                .totalPurchaseValue(BigDecimal.valueOf(150000000))
                                .avgOrderValue(BigDecimal.valueOf(10000000))
                                .activeProducts(3)
                                .inactiveProducts(0)
                                .build();

                when(productSupplierService.getProductStatistics(productId)).thenReturn(productStats);

                // Act & Assert
                mockMvc.perform(get("/api/products/{productId}/statistics", productId)
                                .contentType(MediaType.APPLICATION_JSON))
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$.success").value(true))
                                .andExpect(jsonPath("$.message").value("Lấy thống kê sản phẩm thành công"))
                                .andExpect(jsonPath("$.data.supplierId").value(1)) // Actually productId
                                .andExpect(jsonPath("$.data.supplierName").value("Áo Thun Nam")) // Actually productName
                                .andExpect(jsonPath("$.data.totalProducts").value(3)) // Number of suppliers
                                .andExpect(jsonPath("$.data.totalPurchaseOrders").value(15))
                                .andExpect(jsonPath("$.data.totalQuantityPurchased").value(1500));

                verify(productSupplierService).getProductStatistics(productId);
        }

        @Test
        @WithMockUser(roles = "WAREHOUSE_STAFF")
        @DisplayName("GET /api/products/{id}/statistics - WAREHOUSE_STAFF should have access")
        void testGetProductStatistics_WarehouseStaffAccess() throws Exception {
                // Arrange
                Long productId = 1L;
                when(productSupplierService.getProductStatistics(productId)).thenReturn(sampleStatsResponse);

                // Act & Assert
                mockMvc.perform(get("/api/products/{productId}/statistics", productId)
                                .contentType(MediaType.APPLICATION_JSON))
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$.success").value(true));

                verify(productSupplierService).getProductStatistics(productId);
        }

        @Test
        @WithMockUser(roles = "ACCOUNTANT")
        @DisplayName("GET /api/products/{id}/statistics - Should return 403 for ACCOUNTANT")
        void testGetProductStatistics_AccountantForbidden() throws Exception {
                // Arrange
                Long productId = 1L;

                // Act & Assert
                mockMvc.perform(get("/api/products/{productId}/statistics", productId)
                                .contentType(MediaType.APPLICATION_JSON))
                                .andExpect(status().isForbidden());

                verify(productSupplierService, never()).getProductStatistics(any());
        }
}
