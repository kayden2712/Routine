package com.example.be.dto.request;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class InventoryCheckSubmitRequest {

    @NotNull(message = "stocktakeId is required")
    private Long stocktakeId;

    @NotNull(message = "itemId is required")
    private Long itemId;

    @NotNull(message = "actualQty is required")
    @Min(value = 0, message = "actualQty must be >= 0")
    private Integer actualQty;

    private String note;
}
