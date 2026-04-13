package com.example.be.entity.enums;

/**
 * Status for inventory check rows.
 */
public enum InventoryCheckStatus {
    PENDING,
    MATCH,
    DISCREPANCY,
    WARNING,
    CONFIRMED,
    RECHECK_REQUIRED
}
