package com.example.be.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.example.be.entity.Supplier;
import com.example.be.entity.enums.SupplierStatus;

@Repository
public interface SupplierRepository extends JpaRepository<Supplier, Long> {

       /**
        * Tìm nhà cung cấp theo mã
        */
       Optional<Supplier> findByMaNcc(String maNcc);

       /**
        * Kiểm tra mã nhà cung cấp đã tồn tại
        */
       boolean existsByMaNcc(String maNcc);

       /**
        * Kiểm tra mã nhà cung cấp đã tồn tại (loại trừ ID hiện tại)
        */
       boolean existsByMaNccAndIdNot(String maNcc, Long id);

       /**
        * Kiểm tra tên + số điện thoại đã tồn tại
        */
       @Query("SELECT CASE WHEN COUNT(n) > 0 THEN true ELSE false END FROM Supplier n " +
                     "WHERE LOWER(n.tenNcc) = LOWER(:tenNcc) AND n.soDienThoai = :soDienThoai")
       boolean existsByNameAndPhone(@Param("tenNcc") String tenNcc,
                     @Param("soDienThoai") String soDienThoai);

       /**
        * Kiểm tra tên + số điện thoại đã tồn tại (loại trừ ID hiện tại)
        */
       @Query("SELECT CASE WHEN COUNT(n) > 0 THEN true ELSE false END FROM Supplier n " +
                     "WHERE LOWER(n.tenNcc) = LOWER(:tenNcc) AND n.soDienThoai = :soDienThoai AND n.id <> :id")
       boolean existsByNameAndPhoneAndIdNot(@Param("tenNcc") String tenNcc,
                     @Param("soDienThoai") String soDienThoai,
                     @Param("id") Long id);

       /**
        * Kiểm tra email đã tồn tại
        */
       boolean existsByEmail(String email);

       /**
        * Kiểm tra email đã tồn tại (loại trừ ID hiện tại)
        */
       boolean existsByEmailAndIdNot(String email, Long id);

       /**
        * Tìm danh sách nhà cung cấp theo trạng thái
        */
       List<Supplier> findByTrangThai(SupplierStatus trangThai);

       /**
        * Tìm danh sách nhà cung cấp theo trạng thái với phân trang
        */
       Page<Supplier> findByTrangThai(SupplierStatus trangThai, Pageable pageable);

       /**
        * Tìm kiếm nhà cung cấp theo tên (like)
        */
       @Query("SELECT n FROM Supplier n WHERE LOWER(n.tenNcc) LIKE LOWER(CONCAT('%', :keyword, '%'))")
       List<Supplier> searchByName(@Param("keyword") String keyword);

       /**
        * Tìm kiếm nhà cung cấp với từ khóa (tìm trong tên, SĐT, email)
        */
       @Query("SELECT n FROM Supplier n WHERE " +
                     "LOWER(n.tenNcc) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
                     "n.soDienThoai LIKE CONCAT('%', :keyword, '%') OR " +
                     "LOWER(n.email) LIKE LOWER(CONCAT('%', :keyword, '%'))")
       Page<Supplier> searchByKeyword(@Param("keyword") String keyword, Pageable pageable);

       /**
        * Tìm kiếm với từ khóa và lọc theo trạng thái
        */
       @Query("SELECT n FROM Supplier n WHERE " +
                     "(LOWER(n.tenNcc) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
                     "n.soDienThoai LIKE CONCAT('%', :keyword, '%') OR " +
                     "LOWER(n.email) LIKE LOWER(CONCAT('%', :keyword, '%'))) " +
                     "AND n.trangThai = :trangThai")
       Page<Supplier> searchByKeywordAndStatus(@Param("keyword") String keyword,
                     @Param("trangThai") SupplierStatus trangThai,
                     Pageable pageable);

       /**
        * Lấy danh sách nhà cung cấp đang hoạt động
        */
       @Query("SELECT n FROM Supplier n WHERE n.trangThai = 'ACTIVE' ORDER BY n.tenNcc")
       List<Supplier> findAllActive();

       /**
        * Đếm số phiếu nhập của nhà cung cấp
        */
       @Query("SELECT COUNT(p) FROM ImportReceipt p WHERE p.nhaCungCap.id = :supplierId")
       Long countPurchaseReceiptsBySupplierId(@Param("supplierId") Long supplierId);

       /**
        * Tính tổng giá trị nhập của nhà cung cấp
        */
       @Query("SELECT COALESCE(SUM(p.tongTien), 0) FROM ImportReceipt p WHERE p.nhaCungCap.id = :supplierId")
       Double sumTotalPurchaseValueBySupplierId(@Param("supplierId") Long supplierId);
}
