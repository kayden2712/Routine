package com.example.be.dto.request;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class InventoryAdjustRequest {

    @NotNull(message = "Product ID is required")
    private Long productId;

    @NotNull(message = "Adjust mode is required")
    private AdjustMode mode;

    @NotNull(message = "Quantity is required")
    @Min(value = 0, message = "Quantity must be >= 0")
    private Integer quantity;

    private String note;

    public enum AdjustMode {
        IN,
        OUT,
        SET
    }
}
