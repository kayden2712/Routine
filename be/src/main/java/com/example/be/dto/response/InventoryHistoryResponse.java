package com.example.be.dto.response;

import java.time.LocalDateTime;

import com.example.be.entity.enums.ChungTuType;
import com.example.be.entity.enums.InventoryChangeType;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Response DTO for Inventory History (Lịch sử tồn kho)
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class InventoryHistoryResponse {

    /**
     * History ID
     */
    private Long id;

    /**
     * Product information
     */
    private ProductSimpleResponse product;

    /**
     * Type of stock change
     */
    private InventoryChangeType loaiThayDoi;

    /**
     * Stock quantity before change
     */
    private Integer soLuongTruoc;

    /**
     * Stock quantity change (positive for increase, negative for decrease)
     */
    private Integer soLuongThayDoi;

    /**
     * Stock quantity after change
     */
    private Integer soLuongSau;

    /**
     * Reference document code (e.g., import/export receipt code)
     */
    private String maChungTu;

    /**
     * Reference document type
     */
    private ChungTuType chungTuType;

    /**
     * User who performed the action
     */
    private UserSimpleResponse nguoiThucHien;

    /**
     * Notes
     */
    private String ghiChu;

    /**
     * Timestamp of the change
     */
    private LocalDateTime thoiGian;
}
