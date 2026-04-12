package com.example.be.repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.example.be.entity.Stocktake;
import com.example.be.entity.enums.StocktakeStatus;

@Repository
public interface StocktakeRepository extends JpaRepository<Stocktake, Long> {

    /**
     * Tìm kiểm kê theo mã
     */
    Optional<Stocktake> findByMaKiemKe(String maKiemKe);

    /**
     * Kiểm tra mã kiểm kê đã tồn tại
     */
    boolean existsByMaKiemKe(String maKiemKe);

    /**
     * Lấy danh sách kiểm kê theo trạng thái
     */
    Page<Stocktake> findByTrangThai(StocktakeStatus trangThai, Pageable pageable);

    /**
     * Tìm kiểm kê theo ngày
     */
    List<Stocktake> findByNgayKiemKe(LocalDate ngayKiemKe);

    /**
     * Tìm kiểm kê theo khoảng thời gian
     */
    @Query("SELECT k FROM Stocktake k WHERE k.ngayKiemKe BETWEEN :startDate AND :endDate ORDER BY k.ngayKiemKe DESC")
    List<Stocktake> findByStocktakeDateBetween(
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate);

    /**
     * Kiểm tra có phiên kiểm kê đang thực hiện không
     */
    @Query("SELECT CASE WHEN COUNT(k) > 0 THEN true ELSE false END FROM Stocktake k WHERE k.trangThai = 'DANG_KIEM'")
    boolean hasActiveStocktake();

    /**
     * Lấy phiên kiểm kê đang thực hiện (nếu có)
     */
    @Query("SELECT k FROM Stocktake k WHERE k.trangThai = 'DANG_KIEM' ORDER BY k.createdAt DESC")
    Optional<Stocktake> findActiveStocktake();

    /**
     * Lấy danh sách kiểm kê của người kiểm
     */
    @Query("SELECT k FROM Stocktake k WHERE k.nguoiKiem.id = :userId ORDER BY k.ngayKiemKe DESC")
    List<Stocktake> findByAuditorId(@Param("userId") Long userId);

    /**
     * Đếm số phiên kiểm kê theo trạng thái
     */
    long countByTrangThai(StocktakeStatus trangThai);
}
