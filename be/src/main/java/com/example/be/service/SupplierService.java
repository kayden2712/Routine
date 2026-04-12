package com.example.be.service;

import org.springframework.data.domain.Page;

import com.example.be.dto.request.SupplierRequest;
import com.example.be.dto.request.SupplierSearchRequest;
import com.example.be.dto.response.SupplierListResponse;
import com.example.be.dto.response.SupplierResponse;
import com.example.be.entity.enums.SupplierStatus;

import java.util.List;

/**
 * Service interface cho Quản lý Nhà cung cấp
 */
public interface SupplierService {
    
    /**
     * Lấy tất cả nhà cung cấp (danh sách đơn giản)
     */
    List<SupplierListResponse> getAllSuppliers();
    
    /**
     * Lấy danh sách nhà cung cấp đang hoạt động
     */
    List<SupplierListResponse> getActiveSuppliers();
    
    /**
     * Tìm kiếm và lọc nhà cung cấp với phân trang
     */
    Page<SupplierListResponse> searchSuppliers(SupplierSearchRequest searchRequest);
    
    /**
     * Lấy chi tiết nhà cung cấp theo ID
     */
    SupplierResponse getSupplierById(Long id);
    
    /**
     * Lấy chi tiết nhà cung cấp theo mã
     */
    SupplierResponse getSupplierByCode(String maNcc);
    
    /**
     * Tạo mới nhà cung cấp
     */
    SupplierResponse createSupplier(SupplierRequest request);
    
    /**
     * Cập nhật nhà cung cấp
     */
    SupplierResponse updateSupplier(Long id, SupplierRequest request);
    
    /**
     * Cập nhật trạng thái nhà cung cấp
     */
    SupplierResponse updateSupplierStatus(Long id, SupplierStatus trangThai);
    
    /**
     * Xóa nhà cung cấp
     * - Nếu chưa có phiếu nhập: có thể xóa
     * - Nếu đã có phiếu nhập: chỉ đổi trạng thái sang INACTIVE
     */
    void deleteSupplier(Long id);
    
    /**
     * Kiểm tra nhà cung cấp có phát sinh dữ liệu không
     */
    boolean hasRelatedData(Long id);
}
