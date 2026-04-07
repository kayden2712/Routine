package com.example.be.repository;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.example.be.entity.InventoryHistory;
import com.example.be.entity.enums.InventoryChangeType;

@Repository
public interface InventoryHistoryRepository extends JpaRepository<InventoryHistory, Long> {

    Page<InventoryHistory> findAllByOrderByThoiGianDesc(Pageable pageable);

    /**
     * Lấy lịch sử theo sản phẩm
     */
    @Query("SELECT l FROM InventoryHistory l WHERE l.product.id = :productId ORDER BY l.thoiGian DESC")
    Page<InventoryHistory> findByProductId(@Param("productId") Long productId, Pageable pageable);

    /**
     * Lấy lịch sử theo sản phẩm và khoảng thời gian
     */
    @Query("SELECT l FROM InventoryHistory l WHERE l.product.id = :productId " +
            "AND l.thoiGian BETWEEN :startDate AND :endDate ORDER BY l.thoiGian DESC")
    List<InventoryHistory> findByProductIdAndThoiGianBetween(
            @Param("productId") Long productId,
            @Param("startDate") LocalDateTime startDate,
            @Param("endDate") LocalDateTime endDate);

    /**
     * Lấy lịch sử theo loại thay đổi
     */
    List<InventoryHistory> findByLoaiThayDoi(InventoryChangeType loaiThayDoi);

    /**
     * Lấy lịch sử theo chứng từ
     */
    @Query("SELECT l FROM InventoryHistory l WHERE l.maChungTu = :maChungTu ORDER BY l.thoiGian DESC")
    List<InventoryHistory> findByMaChungTu(@Param("maChungTu") String maChungTu);

    /**
     * Lấy lịch sử thay đổi gần nhất của sản phẩm
     */
    @Query("SELECT l FROM InventoryHistory l WHERE l.product.id = :productId ORDER BY l.thoiGian DESC")
    List<InventoryHistory> findLatestByProductId(@Param("productId") Long productId, Pageable pageable);

    /**
     * Thống kê theo khoảng thời gian
     */
    @Query("SELECT l FROM InventoryHistory l WHERE l.thoiGian BETWEEN :startDate AND :endDate ORDER BY l.thoiGian DESC")
    List<InventoryHistory> findByThoiGianBetween(
            @Param("startDate") LocalDateTime startDate,
            @Param("endDate") LocalDateTime endDate);

    @Query("SELECT MAX(l.thoiGian) FROM InventoryHistory l WHERE l.product.id = :productId")
    LocalDateTime findLatestThoiGianByProductId(@Param("productId") Long productId);

    @Query("SELECT COALESCE(SUM(CASE WHEN l.soLuongThayDoi > 0 THEN l.soLuongThayDoi ELSE 0 END), 0) " +
            "FROM InventoryHistory l WHERE l.product.id = :productId")
    Long sumPositiveChangesByProductId(@Param("productId") Long productId);

    @Query("SELECT COALESCE(SUM(CASE WHEN l.soLuongThayDoi < 0 THEN -l.soLuongThayDoi ELSE 0 END), 0) " +
            "FROM InventoryHistory l WHERE l.product.id = :productId")
    Long sumNegativeChangesByProductId(@Param("productId") Long productId);
}
