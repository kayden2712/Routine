package com.example.be.dto.response;

import java.math.BigDecimal;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Response DTO for Import Receipt Detail (Chi tiết phiếu nhập)
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ImportReceiptDetailResponse {
    
    /**
     * Detail ID
     */
    private Long id;
    
    /**
     * Product information
     */
    private ProductSimpleResponse product;
    
    /**
     * Import quantity
     */
    private Integer soLuongNhap;
    
    /**
     * Import price per unit
     */
    private BigDecimal giaNhap;
    
    /**
     * Total amount (quantity * price)
     */
    private BigDecimal thanhTien;
    
    /**
     * Stock quantity before import
     */
    private Integer soLuongTonTruocNhap;
    
    /**
     * Notes
     */
    private String ghiChu;
}
