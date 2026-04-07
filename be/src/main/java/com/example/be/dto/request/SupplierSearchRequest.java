package com.example.be.dto.request;

import com.example.be.entity.enums.SupplierStatus;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO cho tìm kiếm và lọc nhà cung cấp
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SupplierSearchRequest {

    /**
     * Từ khóa tìm kiếm (tìm trong tên, số điện thoại, email)
     */
    private String keyword;

    /**
     * Lọc theo trạng thái
     */
    private SupplierStatus trangThai;

    /**
     * Số trang (bắt đầu từ 0)
     */
    @Builder.Default
    private Integer page = 0;

    /**
     * Số bản ghi mỗi trang
     */
    @Builder.Default
    private Integer size = 10;

    /**
     * Trường sắp xếp (tenNcc, createdAt, trangThai)
     */
    @Builder.Default
    private String sortBy = "createdAt";

    /**
     * Hướng sắp xếp (ASC, DESC)
     */
    @Builder.Default
    private String sortDirection = "DESC";
}
