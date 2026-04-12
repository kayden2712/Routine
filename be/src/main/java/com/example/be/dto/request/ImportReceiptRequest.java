package com.example.be.dto.request;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

import jakarta.validation.Valid;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO Request tạo/sửa phiếu nhập kho
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ImportReceiptRequest {

    private String maPhieuNhap; // Auto-gen nếu null

    @NotNull(message = "Ngày nhập không được để trống")
    private LocalDateTime ngayNhap;

    @NotNull(message = "Nhà cung cấp không được để trống")
    private Long supplierId;

    private String ghiChu;

    @NotEmpty(message = "Chi tiết phiếu nhập không được để trống")
    @Valid
    private List<ChiTietPhieuNhapRequest> chiTietList;

    /**
     * DTO Chi tiết phiếu nhập
     */
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ChiTietPhieuNhapRequest {

        @NotNull(message = "Sản phẩm không được để trống")
        private Long productId;

        @NotNull(message = "Số lượng nhập không được để trống")
        @Min(value = 1, message = "Số lượng nhập phải lớn hơn 0")
        private Integer soLuongNhap;

        @NotNull(message = "Giá nhập không được để trống")
        @DecimalMin(value = "0.01", message = "Giá nhập phải lớn hơn 0")
        private BigDecimal giaNhap;

        private String ghiChu;
    }
}
