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

import com.example.be.entity.ImportReceipt;
import com.example.be.entity.enums.ReceiptStatus;

@Repository
public interface ImportReceiptRepository extends JpaRepository<ImportReceipt, Long> {

       /**
        * Tìm phiếu nhập theo mã
        */
       Optional<ImportReceipt> findByMaPhieuNhap(String maPhieuNhap);

       /**
        * Kiểm tra mã phiếu đã tồn tại
        */
       boolean existsByMaPhieuNhap(String maPhieuNhap);

       /**
        * Lấy danh sách phiếu theo trạng thái
        */
       Page<ImportReceipt> findByTrangThai(ReceiptStatus trangThai, Pageable pageable);

       Page<ImportReceipt> findByTrangThaiOrderByNgayNhapDesc(ReceiptStatus trangThai, Pageable pageable);

       Page<ImportReceipt> findAllByOrderByNgayNhapDesc(Pageable pageable);

       /**
        * Lấy danh sách phiếu theo nhà cung cấp
        */
       @Query("SELECT p FROM ImportReceipt p WHERE p.nhaCungCap.id = :supplierId ORDER BY p.ngayNhap DESC")
       List<ImportReceipt> findBySupplierId(@Param("supplierId") Long supplierId);

       /**
        * Tìm phiếu theo khoảng thời gian
        */
       @Query("SELECT p FROM ImportReceipt p WHERE p.ngayNhap BETWEEN :startDate AND :endDate ORDER BY p.ngayNhap DESC")
       List<ImportReceipt> findByNgayNhapBetween(
                     @Param("startDate") LocalDateTime startDate,
                     @Param("endDate") LocalDateTime endDate);

       /**
        * Tìm kiếm phiếu với filter động
        */
       @Query("SELECT p FROM ImportReceipt p WHERE " +
                     "(:trangThai IS NULL OR p.trangThai = :trangThai) AND " +
                     "(:supplierId IS NULL OR p.nhaCungCap.id = :supplierId) AND " +
                     "(:fromDate IS NULL OR p.ngayNhap >= :fromDate) AND " +
                     "(:toDate IS NULL OR p.ngayNhap <= :toDate) " +
                     "ORDER BY p.ngayNhap DESC")
       Page<ImportReceipt> findWithFilters(
                     @Param("trangThai") ReceiptStatus trangThai,
                     @Param("supplierId") Long supplierId,
                     @Param("fromDate") LocalDateTime fromDate,
                     @Param("toDate") LocalDateTime toDate,
                     Pageable pageable);

       /**
        * Lấy tất cả phiếu của người tạo
        */
       @Query("SELECT p FROM ImportReceipt p WHERE p.nguoiTao.id = :userId ORDER BY p.createdAt DESC")
       List<ImportReceipt> findByNguoiTaoId(@Param("userId") Long userId);

       /**
        * Đếm số phiếu theo trạng thái
        */
       long countByTrangThai(ReceiptStatus trangThai);

       /**
        * Get purchase orders for a specific product
        */
       @Query("SELECT DISTINCT p FROM ImportReceipt p " +
                     "JOIN p.chiTietList ct " +
                     "WHERE ct.product.id = :productId " +
                     "ORDER BY p.ngayNhap DESC")
       List<ImportReceipt> findByProductId(@Param("productId") Long productId);

       /**
        * Get purchase orders for a product with pagination
        */
       @Query("SELECT DISTINCT p FROM ImportReceipt p " +
                     "JOIN p.chiTietList ct " +
                     "WHERE ct.product.id = :productId " +
                     "ORDER BY p.ngayNhap DESC")
       Page<ImportReceipt> findByProductId(@Param("productId") Long productId, Pageable pageable);

       /**
        * Get suppliers for a specific product
        */
       @Query("SELECT DISTINCT p.nhaCungCap FROM ImportReceipt p " +
                     "JOIN p.chiTietList ct " +
                     "WHERE ct.product.id = :productId")
       List<com.example.be.entity.Supplier> findSuppliersByProductId(@Param("productId") Long productId);
}
