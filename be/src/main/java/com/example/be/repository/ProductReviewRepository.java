package com.example.be.repository;

import com.example.be.entity.ProductReview;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ProductReviewRepository extends JpaRepository<ProductReview, Long> {
    
    List<ProductReview> findByProductIdOrderByCreatedAtDesc(Long productId);
    
    List<ProductReview> findByCustomerId(Long customerId);
    
    @Query("SELECT AVG(r.rating) FROM ProductReview r WHERE r.product.id = :productId")
    Double getAverageRating(@Param("productId") Long productId);
    
    @Query("SELECT COUNT(r) FROM ProductReview r WHERE r.product.id = :productId")
    Long getReviewCount(@Param("productId") Long productId);
}
