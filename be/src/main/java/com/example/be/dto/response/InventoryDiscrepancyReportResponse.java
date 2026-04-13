package com.example.be.dto.response;

import java.time.LocalDate;
import java.util.List;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class InventoryDiscrepancyReportResponse {

    private Long stocktakeId;
    private String stocktakeCode;
    private LocalDate checkDate;

    private int totalItems;
    private int checkedItems;
    private int discrepancyItems;
    private int warningItems;

    private List<InventoryCheckItemResponse> items;
}
