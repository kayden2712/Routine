package com.example.be.entity.enums;

public enum PromotionType {
    GIAM_PHAN_TRAM("Giảm phần trăm"),
    GIAM_TIEN("Giảm tiền"),
    TANG_QUA("Tặng quà");

    private final String displayName;

    PromotionType(String displayName) {
        this.displayName = displayName;
    }

    public String getDisplayName() {
        return displayName;
    }
}
