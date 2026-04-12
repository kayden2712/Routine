package com.example.be.dto.response;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

import com.example.be.entity.enums.ReceiptStatus;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Response DTO for Import Receipt (Phiếu nhập kho)
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ImportReceiptResponse {

    /**
     * Receipt ID
     */
    private Long id;

    /**
     * Import receipt code
     */
    private String maPhieuNhap;

    /**
     * Import date
     */
    private LocalDateTime ngayNhap;

    /**
     * Supplier information
     */
    private SupplierResponse nhaCungCap;

    /**
     * Receipt status
     */
    private ReceiptStatus trangThai;

    /**
     * Total quantity of all items
     */
    private Integer tongSoLuong;

    /**
     * Total amount
     */
    private BigDecimal tongTien;

    /**
     * Notes
     */
    private String ghiChu;

    /**
     * Creator information
     */
    private UserSimpleResponse nguoiTao;

    /**
     * Approver information
     */
    private UserSimpleResponse nguoiDuyet;

    /**
     * Approval date
     */
    private LocalDateTime ngayDuyet;

    /**
     * List of import receipt details
     */
    private List<ImportReceiptDetailResponse> chiTietList;

    /**
     * Created timestamp
     */
    private LocalDateTime createdAt;

    /**
     * Last updated timestamp
     */
    private LocalDateTime updatedAt;
}
