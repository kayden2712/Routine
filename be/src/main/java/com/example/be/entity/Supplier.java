package com.example.be.entity;

import java.util.ArrayList;
import java.util.List;

import com.example.be.entity.enums.SupplierStatus;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Index;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;

/**
 * Entity Nhà cung cấp
 */
@Entity
@Table(name = "nha_cung_cap", indexes = {
        @Index(name = "idx_ma_ncc", columnList = "ma_ncc"),
        @Index(name = "idx_ten_ncc", columnList = "ten_ncc"),
        @Index(name = "idx_trang_thai", columnList = "trang_thai")
})
@Data
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(callSuper = true)
public class Supplier extends BaseEntity {

    @Column(name = "ma_ncc", nullable = false, unique = true, length = 50)
    @NotBlank(message = "Mã nhà cung cấp không được để trống")
    private String maNcc;

    @Column(name = "ten_ncc", nullable = false, length = 200)
    @NotBlank(message = "Tên nhà cung cấp không được để trống")
    private String tenNcc;

    @Column(name = "dia_chi", columnDefinition = "TEXT")
    private String diaChi;

    @Column(name = "so_dien_thoai", length = 20)
    private String soDienThoai;

    @Column(length = 100)
    @Email(message = "Email không hợp lệ")
    private String email;

    @Column(name = "nguoi_lien_he", length = 100)
    private String nguoiLienHe;

    @Column(name = "ghi_chu", columnDefinition = "TEXT")
    private String ghiChu;

    @Enumerated(EnumType.STRING)
    @Column(name = "trang_thai", nullable = false, length = 20)
    private SupplierStatus trangThai = SupplierStatus.ACTIVE;

    @OneToMany(mappedBy = "nhaCungCap", cascade = CascadeType.ALL)
    private List<ImportReceipt> phieuNhapList = new ArrayList<>();
}
