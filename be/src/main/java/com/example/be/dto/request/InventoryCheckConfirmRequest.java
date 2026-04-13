package com.example.be.dto.request;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class InventoryCheckConfirmRequest {

    public enum Action {
        CONFIRM,
        RECHECK
    }

    @NotNull(message = "stocktakeId is required")
    private Long stocktakeId;

    @NotNull(message = "itemId is required")
    private Long itemId;

    @NotNull(message = "action is required")
    private Action action;

    private String note;
}
