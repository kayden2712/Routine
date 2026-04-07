package com.example.be.dto.response;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

import com.example.be.entity.enums.StocktakeStatus;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Response DTO for Inventory Check (Kiểm kê)
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class StocktakeResponse {

    /**
     * Inventory check ID
     */
    private Long id;

    /**
     * Inventory check code
     */
    private String maKiemKe;

    /**
     * Check date
     */
    private LocalDate ngayKiemKe;

    /**
     * Check status
     */
    private StocktakeStatus trangThai;

    /**
     * Staff performing the check
     */
    private UserSimpleResponse nguoiKiem;

    /**
     * Notes
     */
    private String ghiChu;

    /**
     * Completion date
     */
    private LocalDateTime ngayHoanThanh;

    /**
     * List of inventory check details
     */
    private List<StocktakeDetailResponse> chiTietList;

    /**
     * Total number of products checked
     */
    private Integer tongSanPham;

    /**
     * Total difference (sum of absolute differences)
     */
    private Integer tongChenhLech;

    /**
     * Created timestamp
     */
    private LocalDateTime createdAt;

    /**
     * Last updated timestamp
     */
    private LocalDateTime updatedAt;
}
