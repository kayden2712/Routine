package com.example.be.dto.response;

import java.time.LocalDateTime;

import com.example.be.entity.enums.SupplierStatus;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Response DTO chi tiết cho Nhà cung cấp
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SupplierResponse {
    
    /**
     * Supplier ID
     */
    private Long id;
    
    /**
     * Supplier code
     */
    private String maNcc;
    
    /**
     * Supplier name
     */
    private String tenNcc;
    
    /**
     * Address
     */
    private String diaChi;
    
    /**
     * Phone number
     */
    private String soDienThoai;
    
    /**
     * Email address
     */
    private String email;
    
    /**
     * Contact person name
     */
    private String nguoiLienHe;
    
    /**
     * Notes
     */
    private String ghiChu;
    
    /**
     * Supplier status
     */
    private SupplierStatus trangThai;
    
    /**
     * Số lượng phiếu nhập (đề xuất bổ sung)
     */
    private Long soPhieuNhap;
    
    /**
     * Tổng giá trị nhập (đề xuất bổ sung)
     */
    private Double tongGiaTriNhap;
    
    /**
     * Created timestamp
     */
    private LocalDateTime createdAt;
    
    /**
     * Last updated timestamp
     */
    private LocalDateTime updatedAt;
}
