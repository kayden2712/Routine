package com.example.be.entity;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

import com.example.be.entity.enums.ReceiptStatus;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.Index;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;

/**
 * Entity Phiếu nhập kho
 */
@Entity
@Table(name = "phieu_nhap_kho", indexes = {
        @Index(name = "idx_ma_phieu_nhap", columnList = "ma_phieu_nhap"),
        @Index(name = "idx_ngay_nhap", columnList = "ngay_nhap"),
        @Index(name = "idx_trang_thai", columnList = "trang_thai"),
        @Index(name = "idx_nha_cung_cap", columnList = "nha_cung_cap_id")
})
@Data
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(callSuper = true)
public class ImportReceipt extends BaseEntity {

    @Column(name = "ma_phieu_nhap", nullable = false, unique = true, length = 50)
    @NotBlank(message = "Mã phiếu nhập không được để trống")
    private String maPhieuNhap;

    @Column(name = "ngay_nhap", nullable = false)
    @NotNull(message = "Ngày nhập không được để trống")
    private LocalDateTime ngayNhap = LocalDateTime.now();

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "nha_cung_cap_id", nullable = false)
    @NotNull(message = "Nhà cung cấp không được để trống")
    private Supplier nhaCungCap;

    @Enumerated(EnumType.STRING)
    @Column(name = "trang_thai", nullable = false, length = 20)
    private ReceiptStatus trangThai = ReceiptStatus.DRAFT;

    @Column(name = "tong_so_luong")
    @Min(0)
    private Integer tongSoLuong = 0;

    @Column(name = "tong_tien", precision = 15, scale = 2)
    @DecimalMin(value = "0.0")
    private BigDecimal tongTien = BigDecimal.ZERO;

    @Column(name = "ghi_chu", columnDefinition = "TEXT")
    private String ghiChu;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "nguoi_tao_id", nullable = false)
    @NotNull(message = "Người tạo không được để trống")
    private User nguoiTao;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "nguoi_duyet_id")
    private User nguoiDuyet;

    @Column(name = "ngay_duyet")
    private LocalDateTime ngayDuyet;

    @OneToMany(mappedBy = "phieuNhap", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<ImportReceiptDetail> chiTietList = new ArrayList<>();

    /**
     * Helper method: Tính tổng số lượng từ chi tiết
     */
    public void calculateTongSoLuong() {
        this.tongSoLuong = chiTietList.stream()
                .mapToInt(ImportReceiptDetail::getSoLuongNhap)
                .sum();
    }

    /**
     * Helper method: Tính tổng tiền từ chi tiết
     */
    public void calculateTongTien() {
        this.tongTien = chiTietList.stream()
                .map(ImportReceiptDetail::getThanhTien)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }
}
