package com.example.be.entity;

import java.math.BigDecimal;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.Index;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;

/**
 * Entity Chi tiết phiếu nhập kho
 */
@Entity
@Table(name = "chi_tiet_phieu_nhap", indexes = {
        @Index(name = "idx_ct_phieu_nhap", columnList = "phieu_nhap_id"),
        @Index(name = "idx_ct_product", columnList = "product_id")
})
@Data
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(callSuper = true)
public class ImportReceiptDetail extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "phieu_nhap_id", nullable = false)
    @NotNull(message = "Phiếu nhập không được để trống")
    private ImportReceipt phieuNhap;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_id", nullable = false)
    @NotNull(message = "Sản phẩm không được để trống")
    private Product product;

    @Column(name = "so_luong_nhap", nullable = false)
    @NotNull(message = "Số lượng nhập không được để trống")
    @Min(value = 1, message = "Số lượng nhập phải lớn hơn 0")
    private Integer soLuongNhap;

    @Column(name = "gia_nhap", nullable = false, precision = 15, scale = 2)
    @NotNull(message = "Giá nhập không được để trống")
    @DecimalMin(value = "0.01", message = "Giá nhập phải lớn hơn 0")
    private BigDecimal giaNhap;

    @Column(name = "thanh_tien", precision = 15, scale = 2)
    @SuppressWarnings("unused")
    private BigDecimal thanhTien;

    @Column(name = "so_luong_ton_truoc_nhap", nullable = false)
    @Min(0)
    private Integer soLuongTonTruocNhap = 0;

    @Column(name = "ghi_chu", columnDefinition = "TEXT")
    private String ghiChu;

    /**
     * Helper method: Tính thành tiền
     */
    public BigDecimal getThanhTien() {
        if (soLuongNhap != null && giaNhap != null) {
            return giaNhap.multiply(BigDecimal.valueOf(soLuongNhap));
        }
        return BigDecimal.ZERO;
    }
}
