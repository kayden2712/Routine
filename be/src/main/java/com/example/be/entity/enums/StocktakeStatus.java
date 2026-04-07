package com.example.be.entity.enums;

/**
 * Trạng thái kiểm kê
 */
public enum StocktakeStatus {
    /**
     * Đang thực hiện kiểm kê
     */
    DANG_KIEM,
    
    /**
     * Đã hoàn thành - đã điều chỉnh tồn kho
     */
    HOAN_THANH,
    
    /**
     * Đã hủy - không điều chỉnh tồn kho
     */
    HUY
}
