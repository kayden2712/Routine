package com.example.be.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.example.be.entity.PromotionProduct;

@Repository
public interface PromotionProductRepository extends JpaRepository<PromotionProduct, Long> {

    List<PromotionProduct> findByPromotionId(Long promotionId);

    List<PromotionProduct> findByProductId(Long productId);

    @Query("SELECT pp FROM PromotionProduct pp WHERE pp.promotion.id = :promotionId")
    List<PromotionProduct> findAllByPromotionId(@Param("promotionId") Long promotionId);

    @Modifying
    @Query("DELETE FROM PromotionProduct pp WHERE pp.promotion.id = :promotionId")
    void deleteByPromotionId(@Param("promotionId") Long promotionId);

    @Modifying
    @Query("DELETE FROM PromotionProduct pp WHERE pp.promotion.id = :promotionId AND pp.product.id IN :productIds")
    void deleteByPromotionIdAndProductIds(@Param("promotionId") Long promotionId, 
                                          @Param("productIds") List<Long> productIds);

    boolean existsByPromotionIdAndProductId(Long promotionId, Long productId);
}
