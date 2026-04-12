package com.example.be.mapper;

import org.springframework.stereotype.Component;

import com.example.be.dto.request.SupplierRequest;
import com.example.be.dto.response.SupplierListResponse;
import com.example.be.dto.response.SupplierResponse;
import com.example.be.entity.Supplier;
import com.example.be.entity.enums.SupplierStatus;

/**
 * Mapper để chuyển đổi giữa Entity và DTO
 */
@Component
public class SupplierMapper {

    /**
     * Convert Entity -> Response DTO (chi tiết)
     */
    public SupplierResponse toResponse(Supplier entity) {
        if (entity == null) {
            return null;
        }
        
        return SupplierResponse.builder()
                .id(entity.getId())
                .maNcc(entity.getMaNcc())
                .tenNcc(entity.getTenNcc())
                .diaChi(entity.getDiaChi())
                .soDienThoai(entity.getSoDienThoai())
                .email(entity.getEmail())
                .nguoiLienHe(entity.getNguoiLienHe())
                .ghiChu(entity.getGhiChu())
                .trangThai(entity.getTrangThai())
                .soPhieuNhap(null) // Sẽ được set sau
                .tongGiaTriNhap(null) // Sẽ được set sau
                .createdAt(entity.getCreatedAt())
                .updatedAt(entity.getUpdatedAt())
                .build();
    }
    
    /**
     * Convert Entity -> Response DTO (chi tiết) với thống kê
     */
    public SupplierResponse toResponse(Supplier entity, Long soPhieuNhap, Double tongGiaTriNhap) {
        SupplierResponse response = toResponse(entity);
        if (response != null) {
            response.setSoPhieuNhap(soPhieuNhap != null ? soPhieuNhap : 0L);
            response.setTongGiaTriNhap(tongGiaTriNhap != null ? tongGiaTriNhap : 0.0);
        }
        return response;
    }
    
    /**
     * Convert Entity -> List Response DTO (danh sách)
     */
    public SupplierListResponse toListResponse(Supplier entity) {
        if (entity == null) {
            return null;
        }
        
        return SupplierListResponse.builder()
                .id(entity.getId())
                .maNcc(entity.getMaNcc())
                .tenNcc(entity.getTenNcc())
                .diaChi(entity.getDiaChi())
                .soDienThoai(entity.getSoDienThoai())
                .email(entity.getEmail())
                .nguoiLienHe(entity.getNguoiLienHe())
                .trangThai(entity.getTrangThai())
                .soPhieuNhap(null) // Sẽ được set sau nếu cần
                .tongGiaTriNhap(null) // Sẽ được set sau nếu cần
                .createdAt(entity.getCreatedAt())
                .updatedAt(entity.getUpdatedAt())
                .build();
    }
    
    /**
     * Convert Entity -> List Response DTO với thống kê
     */
    public SupplierListResponse toListResponse(Supplier entity, Long soPhieuNhap, Double tongGiaTriNhap) {
        SupplierListResponse response = toListResponse(entity);
        if (response != null) {
            response.setSoPhieuNhap(soPhieuNhap != null ? soPhieuNhap : 0L);
            response.setTongGiaTriNhap(tongGiaTriNhap != null ? tongGiaTriNhap : 0.0);
        }
        return response;
    }

    /**
     * Convert Request DTO -> Entity (tạo mới)
     */
    public Supplier toEntity(SupplierRequest request) {
        if (request == null) {
            return null;
        }
        
        Supplier entity = new Supplier();
        entity.setMaNcc(request.getMaNcc()); // Sẽ được auto-generate nếu null
        entity.setTenNcc(request.getTenNcc());
        entity.setDiaChi(request.getDiaChi());
        entity.setSoDienThoai(request.getSoDienThoai());
        entity.setEmail(request.getEmail());
        entity.setNguoiLienHe(request.getNguoiLienHe());
        entity.setGhiChu(request.getGhiChu());
        entity.setTrangThai(request.getTrangThai() != null ? 
                request.getTrangThai() : SupplierStatus.ACTIVE);
        
        return entity;
    }

    /**
     * Update entity từ request DTO (sửa)
     */
    public void updateEntity(Supplier entity, SupplierRequest request) {
        if (entity == null || request == null) {
            return;
        }
        
        // Không update maNcc (immutable sau khi tạo)
        entity.setTenNcc(request.getTenNcc());
        entity.setDiaChi(request.getDiaChi());
        entity.setSoDienThoai(request.getSoDienThoai());
        entity.setEmail(request.getEmail());
        entity.setNguoiLienHe(request.getNguoiLienHe());
        entity.setGhiChu(request.getGhiChu());
        
        // Chỉ update trạng thái nếu có trong request
        if (request.getTrangThai() != null) {
            entity.setTrangThai(request.getTrangThai());
        }
    }
}
