package com.example.be.repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.example.be.entity.ExportReceipt;
import com.example.be.entity.enums.ExportReason;
import com.example.be.entity.enums.ReceiptStatus;

@Repository
public interface ExportReceiptRepository extends JpaRepository<ExportReceipt, Long> {

    Optional<ExportReceipt> findByMaPhieuXuat(String maPhieuXuat);

    boolean existsByMaPhieuXuat(String maPhieuXuat);

    Optional<ExportReceipt> findByOrderId(Long orderId);

    Page<ExportReceipt> findByTrangThaiOrderByNgayXuatDesc(ReceiptStatus trangThai, Pageable pageable);

    Page<ExportReceipt> findAllByOrderByNgayXuatDesc(Pageable pageable);

    List<ExportReceipt> findByLyDoXuat(ExportReason lyDoXuat);

    @Query("SELECT p FROM ExportReceipt p WHERE p.ngayXuat BETWEEN :startDate AND :endDate ORDER BY p.ngayXuat DESC")
    List<ExportReceipt> findByNgayXuatBetween(
            @Param("startDate") LocalDateTime startDate,
            @Param("endDate") LocalDateTime endDate);

    @Query("SELECT p FROM ExportReceipt p WHERE " +
            "(:trangThai IS NULL OR p.trangThai = :trangThai) AND " +
            "(:lyDoXuat IS NULL OR p.lyDoXuat = :lyDoXuat) AND " +
            "(:fromDate IS NULL OR p.ngayXuat >= :fromDate) AND " +
            "(:toDate IS NULL OR p.ngayXuat <= :toDate) " +
            "ORDER BY p.ngayXuat DESC")
    Page<ExportReceipt> findWithFilters(
            @Param("trangThai") ReceiptStatus trangThai,
            @Param("lyDoXuat") ExportReason lyDoXuat,
            @Param("fromDate") LocalDateTime fromDate,
            @Param("toDate") LocalDateTime toDate,
            Pageable pageable);

    @Query("SELECT p FROM ExportReceipt p WHERE p.nguoiTao.id = :userId ORDER BY p.createdAt DESC")
    List<ExportReceipt> findByNguoiTaoId(@Param("userId") Long userId);

    long countByTrangThai(ReceiptStatus trangThai);
}
