package com.example.be.dto.response;

import java.time.LocalDateTime;

import com.example.be.entity.enums.InventoryCheckStatus;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class InventoryCheckItemResponse {

    private Long itemId;
    private String name;
    private String sku;
    private String unit;

    private Integer systemQty;
    private Integer actualQty;
    private Integer discrepancy;

    private InventoryCheckStatus status;
    private boolean warning;

    private UserSimpleResponse checkedBy;
    private LocalDateTime checkedAt;
    private String note;
}
