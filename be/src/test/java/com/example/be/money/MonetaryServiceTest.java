package com.example.be.money;

import java.math.BigDecimal;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import org.junit.jupiter.api.Test;

import com.example.be.exception.BadRequestException;

class MonetaryServiceTest {

    private final MonetaryService monetaryService = new MonetaryService();

    @Test
    void normalizeReturnsZeroWhenNull() {
        assertEquals(BigDecimal.valueOf(0.00).setScale(2), monetaryService.normalize(null));
    }

    @Test
    void computeLineSubtotalRejectsInvalidQuantity() {
        assertThrows(BadRequestException.class,
                () -> monetaryService.computeLineSubtotal(BigDecimal.valueOf(100000), 0));
    }

    @Test
    void summarizeOrderRejectsDiscountExceedSubtotal() {
        assertThrows(BadRequestException.class,
                () -> monetaryService.summarizeOrder(BigDecimal.valueOf(100000), BigDecimal.valueOf(120000)));
    }

    @Test
    void summarizeOrderComputesTotal() {
        MonetaryService.OrderAmountSummary summary = monetaryService.summarizeOrder(
                BigDecimal.valueOf(200000),
                BigDecimal.valueOf(10000));

        assertEquals(BigDecimal.valueOf(200000).setScale(2), summary.subtotal());
        assertEquals(BigDecimal.valueOf(10000).setScale(2), summary.discount());
        assertEquals(BigDecimal.valueOf(190000).setScale(2), summary.total());
    }
}
