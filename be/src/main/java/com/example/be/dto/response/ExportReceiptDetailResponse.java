package com.example.be.dto.response;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Response DTO for Export Receipt Detail (Chi tiết phiếu xuất)
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ExportReceiptDetailResponse {
    
    /**
     * Detail ID
     */
    private Long id;
    
    /**
     * Product information
     */
    private ProductSimpleResponse product;
    
    /**
     * Export quantity
     */
    private Integer soLuongXuat;
    
    /**
     * Stock quantity before export
     */
    private Integer soLuongTonTruocXuat;
    
    /**
     * Notes
     */
    private String ghiChu;
}
