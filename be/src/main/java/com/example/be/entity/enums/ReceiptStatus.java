package com.example.be.entity.enums;

/**
 * Trạng thái phiếu nhập/xuất kho
 */
public enum ReceiptStatus {
    /**
     * Bản nháp - cho phép chỉnh sửa
     */
    DRAFT,
    
    /**
     * Đã xác nhận - không cho phép sửa, đã cập nhật tồn kho
     */
    CONFIRMED,
    
    /**
     * Đã hủy - không cập nhật tồn kho
     */
    CANCELLED
}
