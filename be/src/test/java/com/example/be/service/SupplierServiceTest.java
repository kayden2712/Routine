package com.example.be.service;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

import java.time.LocalDateTime;
import java.util.Arrays;
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
import org.springframework.data.domain.Pageable;

import com.example.be.dto.request.SupplierRequest;
import com.example.be.dto.request.SupplierSearchRequest;
import com.example.be.dto.response.SupplierListResponse;
import com.example.be.dto.response.SupplierResponse;
import com.example.be.entity.Supplier;
import com.example.be.entity.enums.SupplierStatus;
import com.example.be.exception.BadRequestException;
import com.example.be.exception.ResourceNotFoundException;
import com.example.be.mapper.SupplierMapper;
import com.example.be.repository.SupplierRepository;

/**
 * Unit tests for Supplier Service Implementation
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("Supplier Service Tests")
@SuppressWarnings({ "null", "unused" })
class SupplierServiceTest {

        @Mock
        private SupplierRepository repository;

        @Mock
        private SupplierMapper mapper;

        @InjectMocks
        private SupplierServiceImpl service;

        private Supplier sampleSupplier;
        private SupplierRequest sampleRequest;
        private SupplierResponse sampleResponse;
        private SupplierListResponse sampleListResponse;

        @BeforeEach
        @SuppressWarnings("unused")
        void setUp() {
                // Setup sample supplier entity
                sampleSupplier = new Supplier();
                sampleSupplier.setId(1L);
                sampleSupplier.setMaNcc("NCC-20260407-001");
                sampleSupplier.setTenNcc("Công ty TNHH May Mặc ABC");
                sampleSupplier.setDiaChi("123 Đường ABC, Q1, TP.HCM");
                sampleSupplier.setSoDienThoai("0901234567");
                sampleSupplier.setEmail("contact@abc.com");
                sampleSupplier.setNguoiLienHe("Nguyễn Văn A");
                sampleSupplier.setGhiChu("Nhà cung cấp uy tín");
                sampleSupplier.setTrangThai(SupplierStatus.ACTIVE);
                sampleSupplier.setCreatedAt(LocalDateTime.now());
                sampleSupplier.setUpdatedAt(LocalDateTime.now());

                // Setup sample request
                sampleRequest = new SupplierRequest();
                sampleRequest.setTenNcc("Công ty TNHH May Mặc ABC");
                sampleRequest.setDiaChi("123 Đường ABC, Q1, TP.HCM");
                sampleRequest.setSoDienThoai("0901234567");
                sampleRequest.setEmail("contact@abc.com");
                sampleRequest.setNguoiLienHe("Nguyễn Văn A");
                sampleRequest.setGhiChu("Nhà cung cấp uy tín");
                sampleRequest.setTrangThai(SupplierStatus.ACTIVE);

                // Setup sample response
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

                // Setup sample list response
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
                                .build();
        }

        // ============ GET ALL SUPPLIERS TESTS ============

        @Test
        @DisplayName("Should get all suppliers successfully")
        void testGetAllSuppliers_Success() {
                // Arrange
                List<Supplier> suppliers = Arrays.asList(sampleSupplier);
                when(repository.findAll(any(org.springframework.data.domain.Sort.class))).thenReturn(suppliers);
                when(repository.countPurchaseReceiptsBySupplierId(anyLong())).thenReturn(5L);
                when(repository.sumTotalPurchaseValueBySupplierId(anyLong())).thenReturn(10000000.0);
                when(mapper.toListResponse(any(Supplier.class), anyLong(), anyDouble()))
                                .thenReturn(sampleListResponse);

                // Act
                List<SupplierListResponse> result = service.getAllSuppliers();

                // Assert
                assertNotNull(result);
                assertEquals(1, result.size());
                assertEquals("NCC-20260407-001", result.get(0).getMaNcc());
                verify(repository, times(1)).findAll(any(org.springframework.data.domain.Sort.class));
        }

        @Test
        @DisplayName("Should get active suppliers successfully")
        void testGetActiveSuppliers_Success() {
                // Arrange
                List<Supplier> activeSuppliers = Arrays.asList(sampleSupplier);
                when(repository.findAllActive()).thenReturn(activeSuppliers);
                when(mapper.toListResponse(any(Supplier.class))).thenReturn(sampleListResponse);

                // Act
                List<SupplierListResponse> result = service.getActiveSuppliers();

                // Assert
                assertNotNull(result);
                assertEquals(1, result.size());
                assertEquals(SupplierStatus.ACTIVE, result.get(0).getTrangThai());
                verify(repository, times(1)).findAllActive();
        }

        // ============ SEARCH SUPPLIERS TESTS ============

        @Test
        @DisplayName("Should search suppliers with keyword successfully")
        void testSearchSuppliers_WithKeyword_Success() {
                // Arrange
                SupplierSearchRequest searchRequest = SupplierSearchRequest.builder()
                                .keyword("May mặc")
                                .page(0)
                                .size(10)
                                .sortBy("createdAt")
                                .sortDirection("DESC")
                                .build();

                Page<Supplier> page = new PageImpl<>(Arrays.asList(sampleSupplier));
                when(repository.searchByKeyword(anyString(), any(Pageable.class))).thenReturn(page);
                when(repository.countPurchaseReceiptsBySupplierId(anyLong())).thenReturn(5L);
                when(repository.sumTotalPurchaseValueBySupplierId(anyLong())).thenReturn(10000000.0);
                when(mapper.toListResponse(any(Supplier.class), anyLong(), anyDouble()))
                                .thenReturn(sampleListResponse);

                // Act
                Page<SupplierListResponse> result = service.searchSuppliers(searchRequest);

                // Assert
                assertNotNull(result);
                assertEquals(1, result.getContent().size());
                verify(repository, times(1)).searchByKeyword(anyString(), any(Pageable.class));
        }

        @Test
        @DisplayName("Should search suppliers with status filter successfully")
        void testSearchSuppliers_WithStatusFilter_Success() {
                // Arrange
                SupplierSearchRequest searchRequest = SupplierSearchRequest.builder()
                                .trangThai(SupplierStatus.ACTIVE)
                                .page(0)
                                .size(10)
                                .sortBy("tenNcc")
                                .sortDirection("ASC")
                                .build();

                Page<Supplier> page = new PageImpl<>(Arrays.asList(sampleSupplier));
                when(repository.findByTrangThai(any(SupplierStatus.class), any(Pageable.class)))
                                .thenReturn(page);
                when(repository.countPurchaseReceiptsBySupplierId(anyLong())).thenReturn(5L);
                when(repository.sumTotalPurchaseValueBySupplierId(anyLong())).thenReturn(10000000.0);
                when(mapper.toListResponse(any(Supplier.class), anyLong(), anyDouble()))
                                .thenReturn(sampleListResponse);

                // Act
                Page<SupplierListResponse> result = service.searchSuppliers(searchRequest);

                // Assert
                assertNotNull(result);
                assertEquals(1, result.getContent().size());
                verify(repository, times(1)).findByTrangThai(any(SupplierStatus.class), any(Pageable.class));
        }

        @Test
        @DisplayName("Should search suppliers with keyword and status successfully")
        void testSearchSuppliers_WithKeywordAndStatus_Success() {
                // Arrange
                SupplierSearchRequest searchRequest = SupplierSearchRequest.builder()
                                .keyword("ABC")
                                .trangThai(SupplierStatus.ACTIVE)
                                .page(0)
                                .size(10)
                                .sortBy("createdAt")
                                .sortDirection("DESC")
                                .build();

                Page<Supplier> page = new PageImpl<>(Arrays.asList(sampleSupplier));
                when(repository.searchByKeywordAndStatus(anyString(), any(SupplierStatus.class), any(Pageable.class)))
                                .thenReturn(page);
                when(repository.countPurchaseReceiptsBySupplierId(anyLong())).thenReturn(5L);
                when(repository.sumTotalPurchaseValueBySupplierId(anyLong())).thenReturn(10000000.0);
                when(mapper.toListResponse(any(Supplier.class), anyLong(), anyDouble()))
                                .thenReturn(sampleListResponse);

                // Act
                Page<SupplierListResponse> result = service.searchSuppliers(searchRequest);

                // Assert
                assertNotNull(result);
                assertEquals(1, result.getContent().size());
                verify(repository, times(1)).searchByKeywordAndStatus(anyString(), any(SupplierStatus.class),
                                any(Pageable.class));
        }

        // ============ GET BY ID TESTS ============

        @Test
        @DisplayName("Should get supplier by ID successfully")
        void testGetSupplierById_Success() {
                // Arrange
                when(repository.findById(anyLong())).thenReturn(Optional.of(sampleSupplier));
                when(repository.countPurchaseReceiptsBySupplierId(anyLong())).thenReturn(5L);
                when(repository.sumTotalPurchaseValueBySupplierId(anyLong())).thenReturn(10000000.0);
                when(mapper.toResponse(any(Supplier.class), anyLong(), anyDouble()))
                                .thenReturn(sampleResponse);

                // Act
                SupplierResponse result = service.getSupplierById(1L);

                // Assert
                assertNotNull(result);
                assertEquals(1L, result.getId());
                assertEquals("NCC-20260407-001", result.getMaNcc());
                verify(repository, times(1)).findById(1L);
        }

        @Test
        @DisplayName("Should throw exception when supplier not found by ID")
        void testGetSupplierById_NotFound() {
                // Arrange
                when(repository.findById(anyLong())).thenReturn(Optional.empty());

                // Act & Assert
                ResourceNotFoundException exception = assertThrows(
                                ResourceNotFoundException.class,
                                () -> service.getSupplierById(999L));
                assertTrue(exception.getMessage().contains("999"));
        }

        // ============ CREATE SUPPLIER TESTS ============

        @Test
        @DisplayName("Should create supplier successfully with auto-generated code")
        void testCreateSupplier_Success_AutoGeneratedCode() {
                // Arrange
                SupplierRequest request = new SupplierRequest();
                request.setTenNcc("Công ty XYZ");
                request.setSoDienThoai("0912345678");
                request.setEmail("xyz@example.com");

                when(repository.existsByNameAndPhone(anyString(), anyString())).thenReturn(false);
                when(repository.existsByEmail(anyString())).thenReturn(false);
                when(mapper.toEntity(any(SupplierRequest.class))).thenReturn(sampleSupplier);
                when(repository.findAll()).thenReturn(Arrays.asList()); // No suppliers today
                when(repository.save(any(Supplier.class))).thenReturn(sampleSupplier);
                when(repository.countPurchaseReceiptsBySupplierId(anyLong())).thenReturn(0L);
                when(repository.sumTotalPurchaseValueBySupplierId(anyLong())).thenReturn(0.0);
                when(mapper.toResponse(any(Supplier.class), anyLong(), anyDouble()))
                                .thenReturn(sampleResponse);

                // Act
                SupplierResponse result = service.createSupplier(request);

                // Assert
                assertNotNull(result);
                verify(repository, times(1)).save(any(Supplier.class));
        }

        @Test
        @DisplayName("Should throw exception when creating duplicate supplier (name + phone)")
        void testCreateSupplier_DuplicateNameAndPhone() {
                // Arrange
                when(repository.existsByNameAndPhone(anyString(), anyString())).thenReturn(true);

                // Act & Assert
                BadRequestException exception = assertThrows(
                                BadRequestException.class,
                                () -> service.createSupplier(sampleRequest));
                assertTrue(exception.getMessage().contains("đã tồn tại"));
                verify(repository, never()).save(any(Supplier.class));
        }

        @Test
        @DisplayName("Should throw exception when creating duplicate supplier (email)")
        void testCreateSupplier_DuplicateEmail() {
                // Arrange
                when(repository.existsByNameAndPhone(anyString(), anyString())).thenReturn(false);
                when(repository.existsByEmail(anyString())).thenReturn(true);

                // Act & Assert
                BadRequestException exception = assertThrows(
                                BadRequestException.class,
                                () -> service.createSupplier(sampleRequest));
                assertTrue(exception.getMessage().contains("Email đã được sử dụng"));
                verify(repository, never()).save(any(Supplier.class));
        }

        // ============ UPDATE SUPPLIER TESTS ============

        @Test
        @DisplayName("Should update supplier successfully")
        void testUpdateSupplier_Success() {
                // Arrange
                SupplierRequest updateRequest = new SupplierRequest();
                updateRequest.setTenNcc("Công ty ABC Updated");
                updateRequest.setSoDienThoai("0901234567");
                updateRequest.setEmail("newemail@abc.com");

                when(repository.findById(anyLong())).thenReturn(Optional.of(sampleSupplier));
                when(repository.existsByNameAndPhoneAndIdNot(anyString(), anyString(), anyLong()))
                                .thenReturn(false);
                when(repository.existsByEmailAndIdNot(anyString(), anyLong())).thenReturn(false);
                when(repository.save(any(Supplier.class))).thenReturn(sampleSupplier);
                when(repository.countPurchaseReceiptsBySupplierId(anyLong())).thenReturn(5L);
                when(repository.sumTotalPurchaseValueBySupplierId(anyLong())).thenReturn(10000000.0);
                when(mapper.toResponse(any(Supplier.class), anyLong(), anyDouble()))
                                .thenReturn(sampleResponse);

                // Act
                SupplierResponse result = service.updateSupplier(1L, updateRequest);

                // Assert
                assertNotNull(result);
                verify(repository, times(1)).save(any(Supplier.class));
                verify(mapper, times(1)).updateEntity(any(Supplier.class), any(SupplierRequest.class));
        }

        @Test
        @DisplayName("Should throw exception when updating with duplicate data")
        void testUpdateSupplier_DuplicateData() {
                // Arrange
                when(repository.findById(anyLong())).thenReturn(Optional.of(sampleSupplier));
                when(repository.existsByNameAndPhoneAndIdNot(anyString(), anyString(), anyLong()))
                                .thenReturn(true);

                // Act & Assert
                BadRequestException exception = assertThrows(
                                BadRequestException.class,
                                () -> service.updateSupplier(1L, sampleRequest));
                assertTrue(exception.getMessage().contains("đã tồn tại"));
                verify(repository, never()).save(any(Supplier.class));
        }

        // ============ DELETE SUPPLIER TESTS ============

        @Test
        @DisplayName("Should hard delete supplier when no related data")
        void testDeleteSupplier_HardDelete_NoRelatedData() {
                // Arrange
                when(repository.findById(anyLong())).thenReturn(Optional.of(sampleSupplier));
                when(repository.countPurchaseReceiptsBySupplierId(anyLong())).thenReturn(0L);

                // Act
                service.deleteSupplier(1L);

                // Assert
                verify(repository, times(1)).delete(sampleSupplier);
                verify(repository, never()).save(any(Supplier.class));
        }

        @Test
        @DisplayName("Should soft delete supplier when has related data")
        void testDeleteSupplier_SoftDelete_HasRelatedData() {
                // Arrange
                when(repository.findById(anyLong())).thenReturn(Optional.of(sampleSupplier));
                when(repository.countPurchaseReceiptsBySupplierId(anyLong())).thenReturn(5L);

                // Act
                service.deleteSupplier(1L);

                // Assert
                verify(repository, times(1)).save(sampleSupplier);
                verify(repository, never()).delete(any(Supplier.class));
                assertEquals(SupplierStatus.INACTIVE, sampleSupplier.getTrangThai());
        }

        // ============ UPDATE STATUS TESTS ============

        @Test
        @DisplayName("Should update supplier status successfully")
        void testUpdateSupplierStatus_Success() {
                // Arrange
                when(repository.findById(anyLong())).thenReturn(Optional.of(sampleSupplier));
                when(repository.save(any(Supplier.class))).thenReturn(sampleSupplier);
                when(repository.countPurchaseReceiptsBySupplierId(anyLong())).thenReturn(5L);
                when(repository.sumTotalPurchaseValueBySupplierId(anyLong())).thenReturn(10000000.0);
                when(mapper.toResponse(any(Supplier.class), anyLong(), anyDouble()))
                                .thenReturn(sampleResponse);

                // Act
                SupplierResponse result = service.updateSupplierStatus(1L, SupplierStatus.INACTIVE);

                // Assert
                assertNotNull(result);
                assertEquals(SupplierStatus.INACTIVE, sampleSupplier.getTrangThai());
                verify(repository, times(1)).save(sampleSupplier);
        }

        // ============ HAS RELATED DATA TESTS ============

        @Test
        @DisplayName("Should return true when supplier has related data")
        void testHasRelatedData_True() {
                // Arrange
                when(repository.countPurchaseReceiptsBySupplierId(anyLong())).thenReturn(5L);

                // Act
                boolean result = service.hasRelatedData(1L);

                // Assert
                assertTrue(result);
        }

        @Test
        @DisplayName("Should return false when supplier has no related data")
        void testHasRelatedData_False() {
                // Arrange
                when(repository.countPurchaseReceiptsBySupplierId(anyLong())).thenReturn(0L);

                // Act
                boolean result = service.hasRelatedData(1L);

                // Assert
                assertFalse(result);
        }
}
