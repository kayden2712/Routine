package com.example.be.entity;

import java.time.LocalDateTime;

import com.example.be.entity.enums.ChungTuType;
import com.example.be.entity.enums.InventoryChangeType;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.Index;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;

/**
 * Entity Lịch sử thay đổi tồn kho (Audit Trail)
 */
@Entity
@Table(name = "lich_su_ton_kho", indexes = {
        @Index(name = "idx_lich_su_product", columnList = "product_id"),
        @Index(name = "idx_lich_su_loai", columnList = "loai_thay_doi"),
        @Index(name = "idx_lich_su_thoi_gian", columnList = "thoi_gian"),
        @Index(name = "idx_lich_su_chung_tu", columnList = "ma_chung_tu,chung_tu_type")
})
@Data
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(callSuper = true)
public class InventoryHistory extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_id", nullable = false)
    @NotNull(message = "Sản phẩm không được để trống")
    private Product product;

    @Enumerated(EnumType.STRING)
    @Column(name = "loai_thay_doi", nullable = false, length = 30)
    @NotNull(message = "Loại thay đổi không được để trống")
    private InventoryChangeType loaiThayDoi;

    @Column(name = "so_luong_truoc", nullable = false)
    private Integer soLuongTruoc;

    @Column(name = "so_luong_thay_doi", nullable = false)
    private Integer soLuongThayDoi; // Dương = nhập, Âm = xuất

    @Column(name = "so_luong_sau", nullable = false)
    private Integer soLuongSau;

    @Column(name = "ma_chung_tu", length = 50)
    private String maChungTu; // MaPhieuNhap, MaPhieuXuat, MaKiemKe

    @Enumerated(EnumType.STRING)
    @Column(name = "chung_tu_type", length = 30)
    private ChungTuType chungTuType;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "nguoi_thuc_hien_id", nullable = false)
    @NotNull(message = "Người thực hiện không được để trống")
    private User nguoiThucHien;

    @Column(name = "ghi_chu", columnDefinition = "TEXT")
    private String ghiChu;

    @Column(name = "thoi_gian", nullable = false)
    private LocalDateTime thoiGian = LocalDateTime.now();
}
