package com.example.be.repository;

import com.example.be.entity.CartItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CartItemRepository extends JpaRepository<CartItem, Long> {
    
    List<CartItem> findByCustomerId(Long customerId);
    
    Optional<CartItem> findByCustomerIdAndProductIdAndSizeAndColor(
        Long customerId, Long productId, String size, String color);

    Optional<CartItem> findByIdAndCustomerEmail(Long id, String customerEmail);
    
    @Modifying
    @Query("DELETE FROM CartItem c WHERE c.customer.id = :customerId")
    void deleteAllByCustomerId(@Param("customerId") Long customerId);
    
    @Query("SELECT SUM(c.quantity * c.product.price) FROM CartItem c WHERE c.customer.id = :customerId")
    Double getCartTotal(@Param("customerId") Long customerId);
}
