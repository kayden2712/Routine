package com.example.be.entity;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

import com.example.be.entity.enums.ExportReason;
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
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;

/**
 * Entity Phiếu xuất kho
 */
@Entity
@Table(name = "phieu_xuat_kho", indexes = {
        @Index(name = "idx_ma_phieu_xuat", columnList = "ma_phieu_xuat"),
        @Index(name = "idx_ngay_xuat", columnList = "ngay_xuat"),
        @Index(name = "idx_trang_thai_xuat", columnList = "trang_thai"),
        @Index(name = "idx_order", columnList = "order_id"),
        @Index(name = "idx_ly_do_xuat", columnList = "ly_do_xuat")
})
@Data
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(callSuper = true)
public class ExportReceipt extends BaseEntity {

    @Column(name = "ma_phieu_xuat", nullable = false, unique = true, length = 50)
    @NotBlank(message = "Mã phiếu xuất không được để trống")
    private String maPhieuXuat;

    @Column(name = "ngay_xuat", nullable = false)
    @NotNull(message = "Ngày xuất không được để trống")
    private LocalDateTime ngayXuat = LocalDateTime.now();

    @Enumerated(EnumType.STRING)
    @Column(name = "ly_do_xuat", nullable = false, length = 30)
    @NotNull(message = "Lý do xuất không được để trống")
    private ExportReason lyDoXuat;

    @Enumerated(EnumType.STRING)
    @Column(name = "trang_thai", nullable = false, length = 20)
    private ReceiptStatus trangThai = ReceiptStatus.DRAFT;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "order_id")
    private Order order;

    @Column(name = "tong_so_luong")
    @Min(0)
    private Integer tongSoLuong = 0;

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

    @OneToMany(mappedBy = "phieuXuat", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<ExportReceiptDetail> chiTietList = new ArrayList<>();

    /**
     * Helper method: Tính tổng số lượng từ chi tiết
     */
    public void calculateTongSoLuong() {
        this.tongSoLuong = chiTietList.stream()
                .mapToInt(ExportReceiptDetail::getSoLuongXuat)
                .sum();
    }
}
