package com.example.be.repository;

import com.example.be.entity.Product;
import com.example.be.entity.ProductStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ProductRepository extends JpaRepository<Product, Long> {
    
    Optional<Product> findByCode(String code);
    
    List<Product> findByStatus(ProductStatus status);
    
    List<Product> findByCategoryId(Long categoryId);
    
    List<Product> findByCategoryIdAndStatus(Long categoryId, ProductStatus status);
    
    @Query("SELECT p FROM Product p WHERE " +
           "LOWER(p.name) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(p.code) LIKE LOWER(CONCAT('%', :search, '%'))")
    List<Product> searchProducts(@Param("search") String search);
    
    @Query("SELECT p FROM Product p WHERE p.stock <= p.minStock")
    List<Product> findLowStockProducts();
    
    @Query("SELECT p FROM Product p WHERE p.status = 'ACTIVE' ORDER BY p.rating DESC")
    List<Product> findTopRatedProducts();
    
    boolean existsByCode(String code);
}
