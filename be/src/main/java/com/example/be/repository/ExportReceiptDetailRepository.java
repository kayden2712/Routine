package com.example.be.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.example.be.entity.ExportReceiptDetail;

@Repository
public interface ExportReceiptDetailRepository extends JpaRepository<ExportReceiptDetail, Long> {

        /**
         * Lấy chi tiết theo phiếu xuất
         */
        @Query("SELECT ct FROM ExportReceiptDetail ct WHERE ct.phieuXuat.id = :phieuXuatId")
        List<ExportReceiptDetail> findByPhieuXuatId(@Param("phieuXuatId") Long phieuXuatId);

        /**
         * Lấy chi tiết theo sản phẩm
         */
        @Query("SELECT ct FROM ExportReceiptDetail ct WHERE ct.product.id = :productId ORDER BY ct.createdAt DESC")
        List<ExportReceiptDetail> findByProductId(@Param("productId") Long productId);

        /**
         * Kiểm tra sản phẩm đã có trong phiếu xuất chưa
         */
        @Query("SELECT CASE WHEN COUNT(ct) > 0 THEN true ELSE false END FROM ExportReceiptDetail ct " +
                        "WHERE ct.phieuXuat.id = :phieuXuatId AND ct.product.id = :productId")
        boolean existsByPhieuXuatIdAndProductId(
                        @Param("phieuXuatId") Long phieuXuatId,
                        @Param("productId") Long productId);

        /**
         * Xóa chi tiết theo phiếu xuất
         */
        void deleteByPhieuXuatId(Long phieuXuatId);
}
