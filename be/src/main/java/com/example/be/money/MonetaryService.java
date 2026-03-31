package com.example.be.money;

import java.math.BigDecimal;
import java.math.RoundingMode;

import org.springframework.stereotype.Service;

import com.example.be.exception.BadRequestException;
import com.example.be.exception.ErrorCode;

@Service
public class MonetaryService {
    private static final int MONEY_SCALE = 2;

    public BigDecimal normalize(BigDecimal amount) {
        return (amount == null ? BigDecimal.ZERO : amount)
                .setScale(MONEY_SCALE, RoundingMode.HALF_UP);
    }

    public BigDecimal add(BigDecimal left, BigDecimal right) {
        return normalize(left).add(normalize(right)).setScale(MONEY_SCALE, RoundingMode.HALF_UP);
    }

    public BigDecimal computeLineSubtotal(BigDecimal unitPrice, Integer quantity) {
        if (quantity == null || quantity <= 0) {
            throw new BadRequestException(ErrorCode.MONEY_INVALID_AMOUNT, "Quantity must be greater than zero");
        }

        BigDecimal normalizedUnitPrice = normalize(unitPrice);
        if (normalizedUnitPrice.compareTo(BigDecimal.ZERO) < 0) {
            throw new BadRequestException(ErrorCode.MONEY_INVALID_AMOUNT, "Unit price must be non-negative");
        }

        return normalizedUnitPrice
                .multiply(BigDecimal.valueOf(quantity))
                .setScale(MONEY_SCALE, RoundingMode.HALF_UP);
    }

    public OrderAmountSummary summarizeOrder(BigDecimal rawSubtotal, BigDecimal rawDiscount) {
        BigDecimal subtotal = normalize(rawSubtotal);
        BigDecimal discount = normalize(rawDiscount);

        if (discount.compareTo(BigDecimal.ZERO) < 0) {
            throw new BadRequestException(ErrorCode.MONEY_INVALID_AMOUNT, "Discount must be non-negative");
        }
        if (discount.compareTo(subtotal) > 0) {
            throw new BadRequestException(ErrorCode.MONEY_DISCOUNT_EXCEEDS_SUBTOTAL,
                    "Discount cannot exceed subtotal");
        }

        BigDecimal total = subtotal.subtract(discount).setScale(MONEY_SCALE, RoundingMode.HALF_UP);
        return new OrderAmountSummary(subtotal, discount, total);
    }

    public record OrderAmountSummary(BigDecimal subtotal, BigDecimal discount, BigDecimal total) {
    }
}
