package com.example.be.repository;

import com.example.be.entity.WishlistItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface WishlistItemRepository extends JpaRepository<WishlistItem, Long> {
    
    List<WishlistItem> findByCustomerId(Long customerId);
    
    Optional<WishlistItem> findByCustomerIdAndProductId(Long customerId, Long productId);
    
    boolean existsByCustomerIdAndProductId(Long customerId, Long productId);
    
    @Modifying
    @Query("DELETE FROM WishlistItem w WHERE w.customer.id = :customerId AND w.product.id = :productId")
    void deleteByCustomerIdAndProductId(@Param("customerId") Long customerId, 
                                        @Param("productId") Long productId);
}
