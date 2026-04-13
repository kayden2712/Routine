package com.example.be.entity;

import java.time.LocalDateTime;

import com.example.be.entity.enums.InventoryCheckStatus;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.Index;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "inventory_checks", indexes = {
        @Index(name = "idx_inv_check_stocktake", columnList = "stocktake_id"),
        @Index(name = "idx_inv_check_item", columnList = "item_id"),
        @Index(name = "idx_inv_check_checked_at", columnList = "checked_at")
})
@Data
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(callSuper = true)
public class InventoryCheckAudit extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "stocktake_id", nullable = false)
    @NotNull
    private Stocktake stocktake;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "item_id", nullable = false)
    @NotNull
    private Product item;

    @Column(name = "system_qty", nullable = false)
    private Integer systemQty;

    @Column(name = "actual_qty")
    private Integer actualQty;

    @Column(name = "discrepancy")
    private Integer discrepancy;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 30)
    private InventoryCheckStatus status;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "checked_by", nullable = false)
    @NotNull
    private User checkedBy;

    @Column(name = "checked_at", nullable = false)
    private LocalDateTime checkedAt;

    @Column(name = "note", columnDefinition = "TEXT")
    private String note;
}
