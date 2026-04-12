package com.example.be.repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.example.be.entity.Promotion;
import com.example.be.entity.enums.PromotionStatus;

@Repository
public interface PromotionRepository extends JpaRepository<Promotion, Long> {

    Optional<Promotion> findByCode(String code);

    boolean existsByCode(String code);

    boolean existsByCodeAndIdNot(String code, Long id);

    List<Promotion> findByStatus(PromotionStatus status);

    @Query("SELECT p FROM Promotion p WHERE p.status = :status " +
           "AND p.startDate <= :now AND p.endDate >= :now")
    List<Promotion> findActivePromotions(@Param("status") PromotionStatus status, 
                                         @Param("now") LocalDateTime now);

    @Query("SELECT p FROM Promotion p WHERE p.status = 'ACTIVE' " +
           "AND p.endDate < :now")
    List<Promotion> findExpiredPromotions(@Param("now") LocalDateTime now);

    @Query("SELECT p FROM Promotion p WHERE p.status = 'DRAFT' " +
           "AND p.startDate <= :now")
    List<Promotion> findPromotionsToActivate(@Param("now") LocalDateTime now);

    @Query("SELECT p FROM Promotion p WHERE " +
           "(LOWER(p.name) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(p.code) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(p.description) LIKE LOWER(CONCAT('%', :search, '%')))")
    List<Promotion> searchPromotions(@Param("search") String search);

    @Query("SELECT p FROM Promotion p WHERE p.status = :status " +
           "AND (p.startDate BETWEEN :startDate AND :endDate " +
           "OR p.endDate BETWEEN :startDate AND :endDate)")
    List<Promotion> findByStatusAndDateRange(@Param("status") PromotionStatus status,
                                              @Param("startDate") LocalDateTime startDate,
                                              @Param("endDate") LocalDateTime endDate);

    @Modifying
    @Query("UPDATE Promotion p SET p.status = :newStatus WHERE p.id IN :ids")
    void updateStatusBatch(@Param("ids") List<Long> ids, @Param("newStatus") PromotionStatus newStatus);

    @Query("SELECT p FROM Promotion p WHERE p.applyToAllProducts = true " +
           "AND p.status = 'ACTIVE' " +
           "AND p.startDate <= :now AND p.endDate >= :now " +
           "AND (p.usageLimit IS NULL OR p.usageCount < p.usageLimit)")
    List<Promotion> findApplicablePromotionsForAllProducts(@Param("now") LocalDateTime now);

    @Query("SELECT DISTINCT p FROM Promotion p " +
           "LEFT JOIN p.promotionProducts pp " +
           "WHERE p.status = 'ACTIVE' " +
           "AND p.startDate <= :now AND p.endDate >= :now " +
           "AND (p.usageLimit IS NULL OR p.usageCount < p.usageLimit) " +
           "AND (p.applyToAllProducts = true OR pp.product.id = :productId)")
    List<Promotion> findApplicablePromotionsForProduct(@Param("productId") Long productId,
                                                        @Param("now") LocalDateTime now);
}
