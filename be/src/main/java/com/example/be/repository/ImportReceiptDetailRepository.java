package com.example.be.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.example.be.entity.ImportReceiptDetail;

@Repository
public interface ImportReceiptDetailRepository extends JpaRepository<ImportReceiptDetail, Long> {

        /**
         * Lấy chi tiết theo phiếu nhập
         */
        @Query("SELECT ct FROM ImportReceiptDetail ct WHERE ct.phieuNhap.id = :phieuNhapId")
        List<ImportReceiptDetail> findByPhieuNhapId(@Param("phieuNhapId") Long phieuNhapId);

        /**
         * Lấy chi tiết theo sản phẩm
         */
        @Query("SELECT ct FROM ImportReceiptDetail ct WHERE ct.product.id = :productId ORDER BY ct.createdAt DESC")
        List<ImportReceiptDetail> findByProductId(@Param("productId") Long productId);

        /**
         * Kiểm tra sản phẩm đã có trong phiếu nhập chưa
         */
        @Query("SELECT CASE WHEN COUNT(ct) > 0 THEN true ELSE false END FROM ImportReceiptDetail ct " +
                        "WHERE ct.phieuNhap.id = :phieuNhapId AND ct.product.id = :productId")
        boolean existsByPhieuNhapIdAndProductId(
                        @Param("phieuNhapId") Long phieuNhapId,
                        @Param("productId") Long productId);

        /**
         * Xóa chi tiết theo phiếu nhập (dùng khi xóa toàn bộ phiếu)
         */
        void deleteByPhieuNhapId(Long phieuNhapId);
}
