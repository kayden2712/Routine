package com.example.be.repository;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.example.be.entity.PromotionUsageLog;

@Repository
public interface PromotionUsageLogRepository extends JpaRepository<PromotionUsageLog, Long> {

    List<PromotionUsageLog> findByPromotionId(Long promotionId);

    List<PromotionUsageLog> findByOrderId(Long orderId);

    List<PromotionUsageLog> findByCustomerId(Long customerId);

    @Query("SELECT COUNT(pul) FROM PromotionUsageLog pul WHERE pul.promotion.id = :promotionId")
    Long countByPromotionId(@Param("promotionId") Long promotionId);

    @Query("SELECT pul FROM PromotionUsageLog pul WHERE pul.promotion.id = :promotionId " +
           "AND pul.appliedAt BETWEEN :startDate AND :endDate")
    List<PromotionUsageLog> findByPromotionIdAndDateRange(@Param("promotionId") Long promotionId,
                                                           @Param("startDate") LocalDateTime startDate,
                                                           @Param("endDate") LocalDateTime endDate);

    @Query("SELECT SUM(pul.discountAmount) FROM PromotionUsageLog pul WHERE pul.promotion.id = :promotionId")
    java.math.BigDecimal sumDiscountAmountByPromotionId(@Param("promotionId") Long promotionId);

    @Query("SELECT COUNT(pul) FROM PromotionUsageLog pul WHERE pul.customerId = :customerId " +
           "AND pul.promotion.id = :promotionId")
    Long countByCustomerIdAndPromotionId(@Param("customerId") Long customerId, 
                                         @Param("promotionId") Long promotionId);
}
