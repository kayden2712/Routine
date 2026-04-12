package com.example.be.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.Index;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;

/**
 * Entity Chi tiết phiếu xuất kho
 */
@Entity
@Table(name = "chi_tiet_phieu_xuat", indexes = {
        @Index(name = "idx_ct_phieu_xuat", columnList = "phieu_xuat_id"),
        @Index(name = "idx_ct_xuat_product", columnList = "product_id")
})
@Data
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(callSuper = true)
public class ExportReceiptDetail extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "phieu_xuat_id", nullable = false)
    @NotNull(message = "Phiếu xuất không được để trống")
    private ExportReceipt phieuXuat;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_id", nullable = false)
    @NotNull(message = "Sản phẩm không được để trống")
    private Product product;

    @Column(name = "so_luong_xuat", nullable = false)
    @NotNull(message = "Số lượng xuất không được để trống")
    @Min(value = 1, message = "Số lượng xuất phải lớn hơn 0")
    private Integer soLuongXuat;

    @Column(name = "so_luong_ton_truoc_xuat", nullable = false)
    @Min(0)
    private Integer soLuongTonTruocXuat = 0;

    @Column(name = "ghi_chu", columnDefinition = "TEXT")
    private String ghiChu;
}
