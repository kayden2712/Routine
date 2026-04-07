package com.example.be.entity.enums;

public enum PromotionStatus {
    DRAFT("Nháp - Chưa kích hoạt"),
    ACTIVE("Đang hoạt động"),
    EXPIRED("Hết hạn"),
    CANCELLED("Đã hủy");

    private final String displayName;

    PromotionStatus(String displayName) {
        this.displayName = displayName;
    }

    public String getDisplayName() {
        return displayName;
    }

    public boolean canTransitionTo(PromotionStatus targetStatus) {
        return switch (this) {
            case DRAFT -> targetStatus == ACTIVE || targetStatus == CANCELLED;
            case ACTIVE -> targetStatus == EXPIRED || targetStatus == CANCELLED;
            case EXPIRED, CANCELLED -> false;
        };
    }
}
