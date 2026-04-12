package com.example.be.entity.enums;

/**
 * Lý do xuất kho
 */
public enum ExportReason {
    /**
     * Xuất kho do bán hàng cho khách
     */
    BAN_HANG,
    
    /**
     * Chuyển kho giữa các chi nhánh
     */
    CHUYEN_KHO,
    
    /**
     * Hàng hỏng, thất thoát cần xuất kho
     */
    HONG_THAT_THOAT,
    
    /**
     * Lý do khác
     */
    KHAC
}
