package com.example.be.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.example.be.entity.Product;
import com.example.be.entity.ProductStatus;

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

       boolean existsByCodeIgnoreCase(String code);

       @Query("SELECT CASE WHEN COUNT(p) > 0 THEN true ELSE false END FROM Product p WHERE LOWER(TRIM(p.code)) = LOWER(TRIM(:code))")
       boolean existsByNormalizedCode(@Param("code") String code);

       @Query("SELECT CASE WHEN COUNT(p) > 0 THEN true ELSE false END FROM Product p WHERE p.id <> :id AND LOWER(TRIM(p.code)) = LOWER(TRIM(:code))")
       boolean existsByNormalizedCodeAndIdNot(@Param("code") String code, @Param("id") Long id);

       /**
        * Get products supplied by a specific supplier
        */
       @Query("SELECT DISTINCT ct.product FROM ImportReceiptDetail ct " +
                     "WHERE ct.phieuNhap.nhaCungCap.id = :supplierId " +
                     "ORDER BY ct.product.name")
       List<Product> findProductsBySupplierId(@Param("supplierId") Long supplierId);

       /**
        * Count total products from a supplier
        */
       @Query("SELECT COUNT(DISTINCT ct.product.id) FROM ImportReceiptDetail ct " +
                     "WHERE ct.phieuNhap.nhaCungCap.id = :supplierId")
       Long countProductsBySupplierId(@Param("supplierId") Long supplierId);
}
