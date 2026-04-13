package com.example.be.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import org.junit.jupiter.api.Test;

import com.example.be.entity.enums.InventoryCheckStatus;

class InventoryDiscrepancyCalculatorTest {

    @Test
    void calculateDiscrepancy_shouldReturnActualMinusSystem() {
        int discrepancy = InventoryDiscrepancyCalculator.calculateDiscrepancy(100, 92);
        assertEquals(-8, discrepancy);
    }

    @Test
    void isWarning_shouldReturnTrueWhenDiscrepancyExceedsThreshold() {
        boolean warning = InventoryDiscrepancyCalculator.isWarning(100, 11, 0.1);
        assertTrue(warning);
    }

    @Test
    void isWarning_shouldReturnFalseWhenDiscrepancyWithinThreshold() {
        boolean warning = InventoryDiscrepancyCalculator.isWarning(100, 10, 0.1);
        assertFalse(warning);
    }

    @Test
    void resolveStatus_shouldReturnWarningForLargeGap() {
        InventoryCheckStatus status = InventoryDiscrepancyCalculator.resolveStatus(40, 34, 0.1);
        assertEquals(InventoryCheckStatus.WARNING, status);
    }

    @Test
    void resolveStatus_shouldReturnMatchWhenEqual() {
        InventoryCheckStatus status = InventoryDiscrepancyCalculator.resolveStatus(25, 25, 0.1);
        assertEquals(InventoryCheckStatus.MATCH, status);
    }
}
