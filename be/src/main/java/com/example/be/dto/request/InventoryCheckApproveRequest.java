package com.example.be.dto.request;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class InventoryCheckApproveRequest {

    @NotNull(message = "stocktakeId is required")
    private Long stocktakeId;
}
