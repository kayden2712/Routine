package com.example.be.dto.response;

import java.time.LocalDateTime;
import java.util.List;

import com.example.be.entity.enums.ExportReason;
import com.example.be.entity.enums.ReceiptStatus;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Response DTO for Export Receipt (Phiếu xuất kho)
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ExportReceiptResponse {

    /**
     * Receipt ID
     */
    private Long id;

    /**
     * Export receipt code
     */
    private String maPhieuXuat;

    /**
     * Export date
     */
    private LocalDateTime ngayXuat;

    /**
     * Export reason
     */
    private ExportReason lyDoXuat;

    /**
     * Receipt status
     */
    private ReceiptStatus trangThai;

    /**
     * Related order ID (if export is for order fulfillment)
     */
    private Long orderId;

    /**
     * Related order number
     */
    private String orderNumber;

    /**
     * Total quantity of all items
     */
    private Integer tongSoLuong;

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
     * List of export receipt details
     */
    private List<ExportReceiptDetailResponse> chiTietList;

    /**
     * Created timestamp
     */
    private LocalDateTime createdAt;

    /**
     * Last updated timestamp
     */
    private LocalDateTime updatedAt;
}
