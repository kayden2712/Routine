package com.example.be.dto.request;

import java.time.LocalDateTime;
import java.util.List;

import com.example.be.entity.enums.ExportReason;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO Request tạo phiếu xuất kho
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ExportReceiptRequest {

    private String maPhieuXuat; // Auto-gen nếu null

    @NotNull(message = "Ngày xuất không được để trống")
    private LocalDateTime ngayXuat;

    @NotNull(message = "Lý do xuất không được để trống")
    private ExportReason lyDoXuat;

    private Long orderId; // Nếu xuất do bán hàng

    private String ghiChu;

    @NotEmpty(message = "Chi tiết phiếu xuất không được để trống")
    @Valid
    private List<ChiTietPhieuXuatRequest> chiTietList;

    /**
     * DTO Chi tiết phiếu xuất
     */
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ChiTietPhieuXuatRequest {

        @NotNull(message = "Sản phẩm không được để trống")
        private Long productId;

        @NotNull(message = "Số lượng xuất không được để trống")
        @Min(value = 1, message = "Số lượng xuất phải lớn hơn 0")
        private Integer soLuongXuat;

        private String ghiChu;
    }
}
