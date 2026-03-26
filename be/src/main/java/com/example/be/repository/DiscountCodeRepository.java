package com.example.be.repository;

import com.example.be.entity.DiscountCode;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface DiscountCodeRepository extends JpaRepository<DiscountCode, Long> {
    
    Optional<DiscountCode> findByCodeAndIsActiveTrue(String code);
    
    Optional<DiscountCode> findByCode(String code);
    
    boolean existsByCode(String code);
}
