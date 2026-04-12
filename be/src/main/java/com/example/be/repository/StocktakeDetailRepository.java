package com.example.be.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.example.be.entity.StocktakeDetail;

@Repository
public interface StocktakeDetailRepository extends JpaRepository<StocktakeDetail, Long> {

        /**
         * Lấy chi tiết theo kiểm kê
         */
        @Query("SELECT ct FROM StocktakeDetail ct JOIN FETCH ct.product WHERE ct.kiemKe.id = :kiemKeId")
        List<StocktakeDetail> findByStocktakeId(@Param("kiemKeId") Long kiemKeId);

        /**
         * Lấy chi tiết theo sản phẩm
         */
        @Query("SELECT ct FROM StocktakeDetail ct WHERE ct.product.id = :productId ORDER BY ct.createdAt DESC")
        List<StocktakeDetail> findByProductId(@Param("productId") Long productId);

        /**
         * Tìm chi tiết kiểm kê theo kiểm kê và sản phẩm
         */
        @Query("SELECT ct FROM StocktakeDetail ct WHERE ct.kiemKe.id = :kiemKeId AND ct.product.id = :productId")
        Optional<StocktakeDetail> findByStocktakeIdAndProductId(
                        @Param("kiemKeId") Long kiemKeId,
                        @Param("productId") Long productId);

        /**
         * Lấy danh sách chi tiết có chênh lệch
         */
        @Query("SELECT ct FROM StocktakeDetail ct WHERE ct.kiemKe.id = :kiemKeId " +
                        "AND ct.soLuongThucTe IS NOT NULL " +
                        "AND ct.soLuongThucTe <> ct.soLuongHeThong")
        List<StocktakeDetail> findDiscrepanciesByStocktakeId(@Param("kiemKeId") Long kiemKeId);

        /**
         * Lấy danh sách chi tiết chưa nhập số thực tế
         */
        @Query("SELECT ct FROM StocktakeDetail ct WHERE ct.kiemKe.id = :kiemKeId AND ct.soLuongThucTe IS NULL")
        List<StocktakeDetail> findPendingByStocktakeId(@Param("kiemKeId") Long kiemKeId);

        /**
         * Đếm số sản phẩm có chênh lệch lớn (>10%)
         */
        @Query("SELECT COUNT(ct) FROM StocktakeDetail ct WHERE ct.kiemKe.id = :kiemKeId " +
                        "AND ct.soLuongThucTe IS NOT NULL " +
                        "AND ABS(ct.soLuongThucTe - ct.soLuongHeThong) > (ct.soLuongHeThong * 0.1)")
        long countLargeDiscrepancy(@Param("kiemKeId") Long kiemKeId);

        /**
         * Xóa chi tiết theo kiểm kê
         */
        void deleteByKiemKeId(Long kiemKeId);
}
