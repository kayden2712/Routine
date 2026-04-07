package com.example.be.dto.request;

import java.time.LocalDate;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO Request tạo phiên kiểm kê
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class StocktakeRequest {

    private String maKiemKe; // Auto-gen nếu null

    @NotNull(message = "Ngày kiểm kê không được để trống")
    private LocalDate ngayKiemKe;

    private String ghiChu;
}
