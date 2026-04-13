package com.example.be.dto.response;

import java.time.LocalDate;
import java.util.List;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class InventoryCheckListResponse {

    private Long stocktakeId;
    private String stocktakeCode;
    private LocalDate checkDate;
    private double warningThreshold;
    private List<InventoryCheckItemResponse> items;
}
