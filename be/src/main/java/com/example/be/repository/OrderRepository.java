package com.example.be.repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.example.be.entity.Order;
import com.example.be.entity.OrderStatus;

@Repository
public interface OrderRepository extends JpaRepository<Order, Long> {

       Optional<Order> findByOrderNumber(String orderNumber);

       List<Order> findTop10ByOrderByCreatedAtDesc();

       List<Order> findByCustomerId(Long customerId);

       List<Order> findByStatus(OrderStatus status);

       List<Order> findByCreatedAtBetween(LocalDateTime startDate, LocalDateTime endDate);

       @Query("SELECT o FROM Order o WHERE " +
                     "o.orderNumber LIKE CONCAT('%', :search, '%')")
       List<Order> searchByOrderNumber(@Param("search") String search);

       @Query("SELECT SUM(o.total) FROM Order o WHERE " +
                     "o.status = 'PAID' AND " +
                     "o.createdAt >= :startDate AND o.createdAt <= :endDate")
       Double getTotalRevenue(@Param("startDate") LocalDateTime startDate,
                     @Param("endDate") LocalDateTime endDate);

       @Query("SELECT COUNT(o) FROM Order o WHERE " +
                     "o.status = 'PAID' AND " +
                     "o.createdAt >= :startDate AND o.createdAt <= :endDate")
       Long getTotalOrders(@Param("startDate") LocalDateTime startDate,
                     @Param("endDate") LocalDateTime endDate);
}
