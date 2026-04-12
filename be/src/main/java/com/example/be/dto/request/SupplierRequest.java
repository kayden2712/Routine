package com.example.be.dto.request;

import com.example.be.entity.enums.SupplierStatus;
import com.example.be.validation.VietnamesePhoneNumber;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO Request tạo/sửa nhà cung cấp
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class SupplierRequest {

    private String maNcc; // Auto-gen nếu null

    @NotBlank(message = "Tên nhà cung cấp không được để trống")
    @Size(min = 2, max = 200, message = "Tên nhà cung cấp phải từ 2 đến 200 ký tự")
    private String tenNcc;

    @Size(max = 500, message = "Địa chỉ không được vượt quá 500 ký tự")
    private String diaChi;

    @VietnamesePhoneNumber(required = false, message = "Số điện thoại không đúng định dạng Việt Nam")
    private String soDienThoai;

    @Email(message = "Email không hợp lệ")
    @Size(max = 100, message = "Email không được vượt quá 100 ký tự")
    private String email;

    @Size(max = 100, message = "Tên người liên hệ không được vượt quá 100 ký tự")
    private String nguoiLienHe;

    @Size(max = 1000, message = "Ghi chú không được vượt quá 1000 ký tự")
    private String ghiChu;

    private SupplierStatus trangThai;
}
