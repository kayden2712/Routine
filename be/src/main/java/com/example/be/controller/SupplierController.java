package com.example.be.controller;

import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import com.example.be.dto.request.SupplierRequest;
import com.example.be.dto.request.SupplierSearchRequest;
import com.example.be.dto.response.ApiResponse;
import com.example.be.dto.response.SupplierListResponse;
import com.example.be.dto.response.SupplierResponse;
import com.example.be.entity.enums.SupplierStatus;
import com.example.be.service.SupplierService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

/**
 * REST Controller cho Quản lý Nhà cung cấp
 * 
 * Endpoints:
 * - GET /api/suppliers - Danh sách tất cả nhà cung cấp
 * - POST /api/suppliers/search - Tìm kiếm và lọc với phân trang
 * - GET /api/suppliers/active - Danh sách nhà cung cấp đang hoạt động
 * - GET /api/suppliers/{id} - Chi tiết nhà cung cấp
 * - GET /api/suppliers/code/{maNcc} - Chi tiết theo mã nhà cung cấp
 * - POST /api/suppliers - Tạo mới nhà cung cấp
 * - PUT /api/suppliers/{id} - Cập nhật nhà cung cấp
 * - DELETE /api/suppliers/{id} - Xóa nhà cung cấp
 * - PATCH /api/suppliers/{id}/status - Cập nhật trạng thái
 * 
 * Authorization: Chỉ MANAGER mới được CRUD
 */
@RestController
@RequestMapping("/suppliers")
@RequiredArgsConstructor
public class SupplierController {

    private final SupplierService supplierService;

    /**
     * Lấy danh sách tất cả nhà cung cấp (không phân trang)
     * GET /api/suppliers
     */
    @GetMapping
    @PreAuthorize("hasRole('MANAGER')")
    public ResponseEntity<ApiResponse<List<SupplierListResponse>>> getAllSuppliers() {
        List<SupplierListResponse> suppliers = supplierService.getAllSuppliers();
        return ResponseEntity.ok(ApiResponse.success(suppliers));
    }

    /**
     * Tìm kiếm và lọc nhà cung cấp với phân trang
     * POST /api/suppliers/search
     * 
     * Request body:
     * {
     * "keyword": "string", // Tìm trong tên, SĐT, email
     * "trangThai": "ACTIVE", // ACTIVE, INACTIVE, hoặc null (tất cả)
     * "page": 0, // Số trang (bắt đầu từ 0)
     * "size": 10, // Số bản ghi mỗi trang
     * "sortBy": "createdAt", // Trường sắp xếp: tenNcc, createdAt, trangThai
     * "sortDirection": "DESC" // ASC hoặc DESC
     * }
     */
    @PostMapping("/search")
    @PreAuthorize("hasRole('MANAGER')")
    public ResponseEntity<ApiResponse<Page<SupplierListResponse>>> searchSuppliers(
            @RequestBody SupplierSearchRequest searchRequest) {
        Page<SupplierListResponse> page = supplierService.searchSuppliers(searchRequest);
        return ResponseEntity.ok(ApiResponse.success(page));
    }

    /**
     * Lấy danh sách nhà cung cấp đang hoạt động (ACTIVE)
     * GET /api/suppliers/active
     * 
     * Dùng cho dropdown chọn nhà cung cấp khi tạo phiếu nhập
     */
    @GetMapping("/active")
    @PreAuthorize("hasAnyRole('MANAGER', 'WAREHOUSE')")
    public ResponseEntity<ApiResponse<List<SupplierListResponse>>> getActiveSuppliers() {
        List<SupplierListResponse> suppliers = supplierService.getActiveSuppliers();
        return ResponseEntity.ok(ApiResponse.success(suppliers));
    }

    /**
     * Lấy chi tiết nhà cung cấp theo ID
     * GET /api/suppliers/{id}
     */
    @GetMapping("/{id}")
    @PreAuthorize("hasRole('MANAGER')")
    public ResponseEntity<ApiResponse<SupplierResponse>> getSupplierById(@PathVariable Long id) {
        SupplierResponse supplier = supplierService.getSupplierById(id);
        return ResponseEntity.ok(ApiResponse.success(supplier));
    }

    /**
     * Lấy chi tiết nhà cung cấp theo mã
     * GET /api/suppliers/code/{maNcc}
     */
    @GetMapping("/code/{maNcc}")
    @PreAuthorize("hasRole('MANAGER')")
    public ResponseEntity<ApiResponse<SupplierResponse>> getSupplierByCode(@PathVariable String maNcc) {
        SupplierResponse supplier = supplierService.getSupplierByCode(maNcc);
        return ResponseEntity.ok(ApiResponse.success(supplier));
    }

    /**
     * Tạo mới nhà cung cấp
     * POST /api/suppliers
     * 
     * Request body:
     * {
     * "maNcc": "NCC-001", // Optional, auto-gen nếu null
     * "tenNcc": "string", // Required, 2-200 ký tự
     * "diaChi": "string", // Optional, max 500 ký tự
     * "soDienThoai": "0901234567", // Optional, format Việt Nam
     * "email": "email@example.com", // Optional, format email
     * "nguoiLienHe": "string", // Optional, max 100 ký tự
     * "ghiChu": "string", // Optional, max 1000 ký tự
     * "trangThai": "ACTIVE" // Optional, default ACTIVE
     * }
     * 
     * Validation rules:
     * - Không trùng: tên + số điện thoại
     * - Không trùng: email
     * - Số điện thoại đúng format Việt Nam
     * - Email đúng format
     */
    @PostMapping
    @PreAuthorize("hasRole('MANAGER')")
    public ResponseEntity<ApiResponse<SupplierResponse>> createSupplier(
            @Valid @RequestBody SupplierRequest request) {
        SupplierResponse created = supplierService.createSupplier(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Thêm nhà cung cấp thành công", created));
    }

    /**
     * Cập nhật nhà cung cấp
     * PUT /api/suppliers/{id}
     * 
     * Request body: giống POST
     * 
     * Note: Mã nhà cung cấp (maNcc) không được thay đổi sau khi tạo
     */
    @PutMapping("/{id}")
    @PreAuthorize("hasRole('MANAGER')")
    public ResponseEntity<ApiResponse<SupplierResponse>> updateSupplier(
            @PathVariable Long id,
            @Valid @RequestBody SupplierRequest request) {
        SupplierResponse updated = supplierService.updateSupplier(id, request);
        return ResponseEntity.ok(ApiResponse.success("Cập nhật nhà cung cấp thành công", updated));
    }

    /**
     * Xóa nhà cung cấp
     * DELETE /api/suppliers/{id}
     * 
     * Logic:
     * - Nếu nhà cung cấp chưa có phiếu nhập: Hard delete
     * - Nếu nhà cung cấp đã có phiếu nhập: Soft delete (chuyển trạng thái INACTIVE)
     * 
     * Response sẽ báo rõ đã hard delete hay soft delete
     */
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('MANAGER')")
    public ResponseEntity<ApiResponse<Void>> deleteSupplier(@PathVariable Long id) {
        // Kiểm tra xem nhà cung cấp có phát sinh dữ liệu không
        boolean hasRelatedData = supplierService.hasRelatedData(id);

        supplierService.deleteSupplier(id);

        String message = hasRelatedData
                ? "Nhà cung cấp đã có phiếu nhập, chuyển trạng thái Ngừng hoạt động thành công"
                : "Xóa nhà cung cấp thành công";

        return ResponseEntity.ok(ApiResponse.success(message, null));
    }

    /**
     * Cập nhật trạng thái nhà cung cấp
     * PATCH /api/suppliers/{id}/status
     * 
     * Request param:
     * ?trangThai=ACTIVE hoặc INACTIVE
     */
    @PatchMapping("/{id}/status")
    @PreAuthorize("hasRole('MANAGER')")
    public ResponseEntity<ApiResponse<SupplierResponse>> updateSupplierStatus(
            @PathVariable Long id,
            @RequestParam SupplierStatus trangThai) {
        SupplierResponse updated = supplierService.updateSupplierStatus(id, trangThai);

        String message = trangThai == SupplierStatus.ACTIVE
                ? "Kích hoạt nhà cung cấp thành công"
                : "Ngừng hoạt động nhà cung cấp thành công";

        return ResponseEntity.ok(ApiResponse.success(message, updated));
    }
}
