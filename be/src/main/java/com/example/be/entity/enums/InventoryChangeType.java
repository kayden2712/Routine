package com.example.be.entity.enums;

/**
 * Loại thay đổi tồn kho (cho audit trail)
 */
public enum InventoryChangeType {
    /**
     * Nhập kho - tồn tăng
     */
    NHAP_KHO,

    /**
     * Xuất kho - tồn giảm
     */
    XUAT_KHO,

    /**
     * Điều chỉnh sau kiểm kê
     */
    DIEU_CHINH_KIEM_KE
}
