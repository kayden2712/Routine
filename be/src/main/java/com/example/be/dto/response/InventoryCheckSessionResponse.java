package com.example.be.dto.response;

import java.time.LocalDate;

import com.example.be.entity.enums.StocktakeStatus;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class InventoryCheckSessionResponse {

    private Long stocktakeId;
    private String stocktakeCode;
    private LocalDate checkDate;
    private StocktakeStatus status;
    private int totalItems;
    private int checkedItems;
    private String evaluation;
}
