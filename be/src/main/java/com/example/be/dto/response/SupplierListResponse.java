package com.example.be.dto.response;

import java.time.LocalDateTime;

import com.example.be.entity.enums.SupplierStatus;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Response DTO đơn giản cho danh sách nhà cung cấp
 * (Chỉ chứa thông tin cơ bản, không có relationship)
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SupplierListResponse {
    
    private Long id;
    private String maNcc;
    private String tenNcc;
    private String diaChi;
    private String soDienThoai;
    private String email;
    private String nguoiLienHe;
    private SupplierStatus trangThai;
    
    /**
     * Số lượng phiếu nhập (đề xuất bổ sung)
     */
    private Long soPhieuNhap;
    
    /**
     * Tổng giá trị nhập (đề xuất bổ sung)
     */
    private Double tongGiaTriNhap;
    
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
