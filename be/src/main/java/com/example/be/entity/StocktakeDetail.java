package com.example.be.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.Index;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;

/**
 * Entity Chi tiết kiểm kê
 */
@Entity
@Table(name = "chi_tiet_kiem_ke", indexes = {
        @Index(name = "idx_ct_kiem_ke", columnList = "kiem_ke_id"),
        @Index(name = "idx_ct_kiem_ke_product", columnList = "product_id")
}, uniqueConstraints = {
        @UniqueConstraint(name = "uk_kiem_ke_product", columnNames = { "kiem_ke_id", "product_id" })
})
@Data
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(callSuper = true)
public class StocktakeDetail extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "kiem_ke_id", nullable = false)
    @NotNull(message = "Kiểm kê không được để trống")
    private Stocktake kiemKe;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_id", nullable = false)
    @NotNull(message = "Sản phẩm không được để trống")
    private Product product;

    @Column(name = "so_luong_he_thong", nullable = false)
    private Integer soLuongHeThong; // Snapshot từ Product.stock

    @Column(name = "so_luong_thuc_te")
    private Integer soLuongThucTe; // NV nhập sau khi đếm

    @Column(name = "chenh_lech", insertable = false, updatable = false)
    @SuppressWarnings("unused")
    private Integer chenhLech; // = thực tế - hệ thống

    @Column(name = "ghi_chu", columnDefinition = "TEXT")
    private String ghiChu;

    /**
     * Helper: Tính chênh lệch
     */
    public Integer getChenhLech() {
        if (soLuongThucTe != null && soLuongHeThong != null) {
            return soLuongThucTe - soLuongHeThong;
        }
        return null;
    }

    /**
     * Helper: Cập nhật chênh lệch
     */
    public void updateChenhLech() {
        this.chenhLech = getChenhLech();
    }
}
