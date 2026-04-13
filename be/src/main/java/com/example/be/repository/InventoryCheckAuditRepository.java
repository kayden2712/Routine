package com.example.be.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.example.be.entity.InventoryCheckAudit;

@Repository
public interface InventoryCheckAuditRepository extends JpaRepository<InventoryCheckAudit, Long> {

    Optional<InventoryCheckAudit> findTopByStocktakeIdAndItemIdOrderByCheckedAtDesc(Long stocktakeId, Long itemId);
}
