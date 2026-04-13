package com.example.be.service;

import com.example.be.entity.enums.InventoryCheckStatus;

public final class InventoryDiscrepancyCalculator {

    private InventoryDiscrepancyCalculator() {
    }

    public static int calculateDiscrepancy(int systemQty, int actualQty) {
        return actualQty - systemQty;
    }

    public static boolean isWarning(int systemQty, int discrepancy, double warningThreshold) {
        int absDiscrepancy = Math.abs(discrepancy);
        if (systemQty <= 0) {
            return absDiscrepancy > 0;
        }
        return absDiscrepancy > (systemQty * warningThreshold);
    }

    public static InventoryCheckStatus resolveStatus(int systemQty, Integer actualQty, double warningThreshold) {
        if (actualQty == null) {
            return InventoryCheckStatus.PENDING;
        }

        int discrepancy = calculateDiscrepancy(systemQty, actualQty);
        if (discrepancy == 0) {
            return InventoryCheckStatus.MATCH;
        }

        return isWarning(systemQty, discrepancy, warningThreshold)
                ? InventoryCheckStatus.WARNING
                : InventoryCheckStatus.DISCREPANCY;
    }
}
