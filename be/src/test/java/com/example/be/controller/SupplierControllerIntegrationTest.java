package com.example.be.controller;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.validation.beanvalidation.LocalValidatorFactoryBean;

import com.example.be.dto.request.SupplierRequest;
import com.example.be.dto.request.SupplierSearchRequest;
import com.example.be.dto.response.SupplierListResponse;
import com.example.be.dto.response.SupplierResponse;
import com.example.be.entity.enums.SupplierStatus;
import com.example.be.exception.BadRequestException;
import com.example.be.exception.GlobalExceptionHandler;
import com.example.be.exception.ResourceNotFoundException;
import com.example.be.service.SupplierService;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;

/**
 * Integration tests for Supplier Controller
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("Supplier Controller Integration Tests")
@SuppressWarnings({ "null", "unused" })
class SupplierControllerIntegrationTest {

        private MockMvc mockMvc;

        @Mock
        private SupplierService supplierService;

        @InjectMocks
        private SupplierController supplierController;

        private final ObjectMapper objectMapper = new ObjectMapper();

        private SupplierResponse sampleResponse;
        private SupplierListResponse sampleListResponse;
        private SupplierRequest sampleRequest;

        @BeforeEach
        @SuppressWarnings("unused")
        void setUp() {
                objectMapper.registerModule(new JavaTimeModule());

                LocalValidatorFactoryBean validator = new LocalValidatorFactoryBean();
                validator.afterPropertiesSet();

                mockMvc = MockMvcBuilders.standaloneSetup(supplierController)
                                .setControllerAdvice(new GlobalExceptionHandler())
                                .setValidator(validator)
                                .build();

                // Setup sample data
                sampleResponse = SupplierResponse.builder()
                                .id(1L)
                                .maNcc("NCC-20260407-001")
                                .tenNcc("Công ty TNHH May Mặc ABC")
                                .diaChi("123 Đường ABC, Q1, TP.HCM")
                                .soDienThoai("0901234567")
                                .email("contact@abc.com")
                                .nguoiLienHe("Nguyễn Văn A")
                                .ghiChu("Nhà cung cấp uy tín")
                                .trangThai(SupplierStatus.ACTIVE)
                                .soPhieuNhap(5L)
                                .tongGiaTriNhap(10000000.0)
                                .createdAt(LocalDateTime.now())
                                .updatedAt(LocalDateTime.now())
                                .build();

                sampleListResponse = SupplierListResponse.builder()
                                .id(1L)
                                .maNcc("NCC-20260407-001")
                                .tenNcc("Công ty TNHH May Mặc ABC")
                                .diaChi("123 Đường ABC, Q1, TP.HCM")
                                .soDienThoai("0901234567")
                                .email("contact@abc.com")
                                .trangThai(SupplierStatus.ACTIVE)
                                .soPhieuNhap(5L)
                                .tongGiaTriNhap(10000000.0)
                                .createdAt(LocalDateTime.now())
                                .updatedAt(LocalDateTime.now())
                                .build();

                sampleRequest = new SupplierRequest();
                sampleRequest.setTenNcc("Công ty TNHH May Mặc ABC");
                sampleRequest.setDiaChi("123 Đường ABC, Q1, TP.HCM");
                sampleRequest.setSoDienThoai("0901234567");
                sampleRequest.setEmail("contact@abc.com");
                sampleRequest.setNguoiLienHe("Nguyễn Văn A");
                sampleRequest.setGhiChu("Nhà cung cấp uy tín");
                sampleRequest.setTrangThai(SupplierStatus.ACTIVE);
        }

        // ============ GET ALL SUPPLIERS TESTS ============

        @Test
        @WithMockUser(roles = "MANAGER")
        @DisplayName("GET /api/suppliers - Should return all suppliers successfully")
        void testGetAllSuppliers_Success() throws Exception {
                // Arrange
                List<SupplierListResponse> suppliers = Arrays.asList(sampleListResponse);
                when(supplierService.getAllSuppliers()).thenReturn(suppliers);

                // Act & Assert
                mockMvc.perform(get("/suppliers")
                                .contentType(MediaType.APPLICATION_JSON))
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$.success").value(true))
                                .andExpect(jsonPath("$.data").isArray())
                                .andExpect(jsonPath("$.data[0].id").value(1))
                                .andExpect(jsonPath("$.data[0].maNcc").value("NCC-20260407-001"))
                                .andExpect(jsonPath("$.data[0].tenNcc").value("Công ty TNHH May Mặc ABC"));

                verify(supplierService, times(1)).getAllSuppliers();
        }

        // ============ SEARCH SUPPLIERS TESTS ============

        @Test
        @WithMockUser(roles = "MANAGER")
        @DisplayName("POST /api/suppliers/search - Should search suppliers successfully")
        void testSearchSuppliers_Success() throws Exception {
                // Arrange
                SupplierSearchRequest searchRequest = SupplierSearchRequest.builder()
                                .keyword("May mặc")
                                .trangThai(SupplierStatus.ACTIVE)
                                .page(0)
                                .size(10)
                                .sortBy("createdAt")
                                .sortDirection("DESC")
                                .build();

                Page<SupplierListResponse> page = new PageImpl<>(Arrays.asList(sampleListResponse));
                when(supplierService.searchSuppliers(any(SupplierSearchRequest.class))).thenReturn(page);

                // Act & Assert
                mockMvc.perform(post("/suppliers/search")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(searchRequest)))
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$.success").value(true))
                                .andExpect(jsonPath("$.data.content").isArray())
                                .andExpect(jsonPath("$.data.content[0].maNcc").value("NCC-20260407-001"))
                                .andExpect(jsonPath("$.data.totalElements").value(1));

                verify(supplierService, times(1)).searchSuppliers(any(SupplierSearchRequest.class));
        }

        // ============ GET ACTIVE SUPPLIERS TESTS ============

        @Test
        @WithMockUser(roles = "MANAGER")
        @DisplayName("GET /api/suppliers/active - Should return active suppliers")
        void testGetActiveSuppliers_Success() throws Exception {
                // Arrange
                List<SupplierListResponse> activeSuppliers = Arrays.asList(sampleListResponse);
                when(supplierService.getActiveSuppliers()).thenReturn(activeSuppliers);

                // Act & Assert
                mockMvc.perform(get("/suppliers/active")
                                .contentType(MediaType.APPLICATION_JSON))
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$.success").value(true))
                                .andExpect(jsonPath("$.data").isArray())
                                .andExpect(jsonPath("$.data[0].trangThai").value("ACTIVE"));

                verify(supplierService, times(1)).getActiveSuppliers();
        }

        // ============ GET SUPPLIER BY ID TESTS ============

        @Test
        @WithMockUser(roles = "MANAGER")
        @DisplayName("GET /api/suppliers/{id} - Should return supplier by ID")
        void testGetSupplierById_Success() throws Exception {
                // Arrange
                when(supplierService.getSupplierById(1L)).thenReturn(sampleResponse);

                // Act & Assert
                mockMvc.perform(get("/suppliers/1")
                                .contentType(MediaType.APPLICATION_JSON))
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$.success").value(true))
                                .andExpect(jsonPath("$.data.id").value(1))
                                .andExpect(jsonPath("$.data.maNcc").value("NCC-20260407-001"))
                                .andExpect(jsonPath("$.data.soPhieuNhap").value(5))
                                .andExpect(jsonPath("$.data.tongGiaTriNhap").value(10000000.0));

                verify(supplierService, times(1)).getSupplierById(1L);
        }

        @Test
        @WithMockUser(roles = "MANAGER")
        @DisplayName("GET /api/suppliers/{id} - Should return 404 when not found")
        void testGetSupplierById_NotFound() throws Exception {
                // Arrange
                when(supplierService.getSupplierById(999L))
                                .thenThrow(new ResourceNotFoundException("Không tìm thấy nhà cung cấp với ID: 999"));

                // Act & Assert
                mockMvc.perform(get("/suppliers/999")
                                .contentType(MediaType.APPLICATION_JSON))
                                .andExpect(status().isNotFound())
                                .andExpect(jsonPath("$.success").value(false))
                                .andExpect(jsonPath("$.message").value("Không tìm thấy nhà cung cấp với ID: 999"));
        }

        // ============ CREATE SUPPLIER TESTS ============

        @Test
        @WithMockUser(roles = "MANAGER")
        @DisplayName("POST /api/suppliers - Should create supplier successfully")
        void testCreateSupplier_Success() throws Exception {
                // Arrange
                when(supplierService.createSupplier(any(SupplierRequest.class)))
                                .thenReturn(sampleResponse);

                // Act & Assert
                mockMvc.perform(post("/suppliers")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(sampleRequest)))
                                .andExpect(status().isCreated())
                                .andExpect(jsonPath("$.success").value(true))
                                .andExpect(jsonPath("$.message").value("Thêm nhà cung cấp thành công"))
                                .andExpect(jsonPath("$.data.id").value(1))
                                .andExpect(jsonPath("$.data.maNcc").value("NCC-20260407-001"));

                verify(supplierService, times(1)).createSupplier(any(SupplierRequest.class));
        }

        @Test
        @WithMockUser(roles = "MANAGER")
        @DisplayName("POST /api/suppliers - Should return 400 when validation fails")
        void testCreateSupplier_ValidationFailed() throws Exception {
                // Arrange - Empty supplier name
                SupplierRequest invalidRequest = new SupplierRequest();
                invalidRequest.setTenNcc(""); // Invalid: too short
                invalidRequest.setSoDienThoai("0901234567");

                // Act & Assert
                mockMvc.perform(post("/suppliers")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(invalidRequest)))
                                .andExpect(status().isBadRequest())
                                .andExpect(jsonPath("$.success").value(false));

                verify(supplierService, never()).createSupplier(any(SupplierRequest.class));
        }

        @Test
        @WithMockUser(roles = "MANAGER")
        @DisplayName("POST /api/suppliers - Should return 400 when duplicate data")
        void testCreateSupplier_DuplicateData() throws Exception {
                // Arrange
                when(supplierService.createSupplier(any(SupplierRequest.class)))
                                .thenThrow(new BadRequestException(
                                                "Nhà cung cấp với tên 'Công ty TNHH May Mặc ABC' và số điện thoại '0901234567' đã tồn tại"));

                // Act & Assert
                mockMvc.perform(post("/suppliers")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(sampleRequest)))
                                .andExpect(status().isBadRequest())
                                .andExpect(jsonPath("$.success").value(false))
                                .andExpect(jsonPath("$.message").value(
                                                "Nhà cung cấp với tên 'Công ty TNHH May Mặc ABC' và số điện thoại '0901234567' đã tồn tại"));
        }

        // ============ UPDATE SUPPLIER TESTS ============

        @Test
        @WithMockUser(roles = "MANAGER")
        @DisplayName("PUT /api/suppliers/{id} - Should update supplier successfully")
        void testUpdateSupplier_Success() throws Exception {
                // Arrange
                SupplierRequest updateRequest = new SupplierRequest();
                updateRequest.setTenNcc("Công ty ABC Updated");
                updateRequest.setSoDienThoai("0901234567");
                updateRequest.setEmail("newemail@abc.com");
                updateRequest.setNguoiLienHe("Nguyễn Văn A Updated");

                SupplierResponse updatedResponse = SupplierResponse.builder()
                                .id(1L)
                                .maNcc("NCC-20260407-001")
                                .tenNcc("Công ty ABC Updated")
                                .soDienThoai("0901234567")
                                .email("newemail@abc.com")
                                .trangThai(SupplierStatus.ACTIVE)
                                .build();

                when(supplierService.updateSupplier(eq(1L), any(SupplierRequest.class)))
                                .thenReturn(updatedResponse);

                // Act & Assert
                mockMvc.perform(put("/suppliers/1")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(updateRequest)))
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$.success").value(true))
                                .andExpect(jsonPath("$.message").value("Cập nhật nhà cung cấp thành công"))
                                .andExpect(jsonPath("$.data.tenNcc").value("Công ty ABC Updated"));

                verify(supplierService, times(1)).updateSupplier(eq(1L), any(SupplierRequest.class));
        }

        // ============ DELETE SUPPLIER TESTS ============

        @Test
        @WithMockUser(roles = "MANAGER")
        @DisplayName("DELETE /api/suppliers/{id} - Should hard delete when no related data")
        void testDeleteSupplier_HardDelete() throws Exception {
                // Arrange
                when(supplierService.hasRelatedData(1L)).thenReturn(false);
                doNothing().when(supplierService).deleteSupplier(1L);

                // Act & Assert
                mockMvc.perform(delete("/suppliers/1")
                                .contentType(MediaType.APPLICATION_JSON))
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$.success").value(true))
                                .andExpect(jsonPath("$.message").value("Xóa nhà cung cấp thành công"));

                verify(supplierService, times(1)).deleteSupplier(1L);
        }

        @Test
        @WithMockUser(roles = "MANAGER")
        @DisplayName("DELETE /api/suppliers/{id} - Should soft delete when has related data")
        void testDeleteSupplier_SoftDelete() throws Exception {
                // Arrange
                when(supplierService.hasRelatedData(1L)).thenReturn(true);
                doNothing().when(supplierService).deleteSupplier(1L);

                // Act & Assert
                mockMvc.perform(delete("/suppliers/1")
                                .contentType(MediaType.APPLICATION_JSON))
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$.success").value(true))
                                .andExpect(jsonPath("$.message").value(
                                                "Nhà cung cấp đã có phiếu nhập, chuyển trạng thái Ngừng hoạt động thành công"));

                verify(supplierService, times(1)).deleteSupplier(1L);
        }

        // ============ UPDATE STATUS TESTS ============

        @Test
        @WithMockUser(roles = "MANAGER")
        @DisplayName("PATCH /api/suppliers/{id}/status - Should activate supplier")
        void testUpdateSupplierStatus_Activate() throws Exception {
                // Arrange
                SupplierResponse activatedResponse = SupplierResponse.builder()
                                .id(1L)
                                .maNcc("NCC-20260407-001")
                                .tenNcc("Công ty TNHH May Mặc ABC")
                                .trangThai(SupplierStatus.ACTIVE)
                                .build();

                when(supplierService.updateSupplierStatus(eq(1L), eq(SupplierStatus.ACTIVE)))
                                .thenReturn(activatedResponse);

                // Act & Assert
                mockMvc.perform(patch("/suppliers/1/status")
                                .param("trangThai", "ACTIVE")
                                .contentType(MediaType.APPLICATION_JSON))
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$.success").value(true))
                                .andExpect(jsonPath("$.message").value("Kích hoạt nhà cung cấp thành công"))
                                .andExpect(jsonPath("$.data.trangThai").value("ACTIVE"));

                verify(supplierService, times(1)).updateSupplierStatus(1L, SupplierStatus.ACTIVE);
        }

        @Test
        @WithMockUser(roles = "MANAGER")
        @DisplayName("PATCH /api/suppliers/{id}/status - Should deactivate supplier")
        void testUpdateSupplierStatus_Deactivate() throws Exception {
                // Arrange
                SupplierResponse deactivatedResponse = SupplierResponse.builder()
                                .id(1L)
                                .maNcc("NCC-20260407-001")
                                .tenNcc("Công ty TNHH May Mặc ABC")
                                .trangThai(SupplierStatus.INACTIVE)
                                .build();

                when(supplierService.updateSupplierStatus(eq(1L), eq(SupplierStatus.INACTIVE)))
                                .thenReturn(deactivatedResponse);

                // Act & Assert
                mockMvc.perform(patch("/suppliers/1/status")
                                .param("trangThai", "INACTIVE")
                                .contentType(MediaType.APPLICATION_JSON))
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$.success").value(true))
                                .andExpect(jsonPath("$.message").value("Ngừng hoạt động nhà cung cấp thành công"))
                                .andExpect(jsonPath("$.data.trangThai").value("INACTIVE"));

                verify(supplierService, times(1)).updateSupplierStatus(1L, SupplierStatus.INACTIVE);
        }

        // ============ AUTHORIZATION TESTS ============

        @Test
        @WithMockUser(roles = "SALES")
        @DisplayName("Should return 403 Forbidden when non-MANAGER tries to access")
        void testUnauthorizedAccess_Forbidden() throws Exception {
                // Act & Assert
                mockMvc.perform(get("/suppliers")
                                .contentType(MediaType.APPLICATION_JSON))
                                .andExpect(status().isForbidden());

                verify(supplierService, never()).getAllSuppliers();
        }
}
