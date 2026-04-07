package com.example.be.entity;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

import com.example.be.entity.enums.StocktakeStatus;

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
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;

/**
 * Entity Kiểm kê kho
 */
@Entity
@Table(name = "kiem_ke", indexes = {
        @Index(name = "idx_ma_kiem_ke", columnList = "ma_kiem_ke"),
        @Index(name = "idx_ngay_kiem_ke", columnList = "ngay_kiem_ke"),
        @Index(name = "idx_trang_thai_kiem_ke", columnList = "trang_thai")
})
@Data
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(callSuper = true)
public class Stocktake extends BaseEntity {

    @Column(name = "ma_kiem_ke", nullable = false, unique = true, length = 50)
    @NotBlank(message = "Mã kiểm kê không được để trống")
    private String maKiemKe;

    @Column(name = "ngay_kiem_ke", nullable = false)
    @NotNull(message = "Ngày kiểm kê không được để trống")
    private LocalDate ngayKiemKe;

    @Enumerated(EnumType.STRING)
    @Column(name = "trang_thai", nullable = false, length = 20)
    private StocktakeStatus trangThai = StocktakeStatus.DANG_KIEM;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "nguoi_kiem_id", nullable = false)
    @NotNull(message = "Người kiểm kê không được để trống")
    private User nguoiKiem;

    @Column(name = "ghi_chu", columnDefinition = "TEXT")
    private String ghiChu;

    @Column(name = "ngay_hoan_thanh")
    private LocalDateTime ngayHoanThanh;

    @OneToMany(mappedBy = "kiemKe", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<StocktakeDetail> chiTietList = new ArrayList<>();
}
