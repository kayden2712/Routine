package com.example.be.service;

import java.time.LocalDateTime;
import java.util.List;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.be.entity.ImportReceiptDetail;
import com.example.be.entity.ExportReceiptDetail;
import com.example.be.entity.InventoryHistory;
import com.example.be.entity.ImportReceipt;
import com.example.be.entity.ExportReceipt;
import com.example.be.entity.Product;
import com.example.be.entity.User;
import com.example.be.entity.enums.ChungTuType;
import com.example.be.entity.enums.InventoryChangeType;
import com.example.be.entity.enums.ReceiptStatus;
import com.example.be.exception.BadRequestException;
import com.example.be.exception.ResourceNotFoundException;
import com.example.be.repository.InventoryHistoryRepository;
import com.example.be.repository.ImportReceiptRepository;
import com.example.be.repository.ExportReceiptRepository;
import com.example.be.repository.ProductRepository;

import lombok.RequiredArgsConstructor;

/**
 * Service quản lý tồn kho - chứa toàn bộ logic cập nhật tồn kho atomic
 * Đây là service core của module Warehouse
 */
@Service
@RequiredArgsConstructor
@SuppressWarnings("null")
public class InventoryService {

    private static final Logger logger = LoggerFactory.getLogger(InventoryService.class);

    private final ProductRepository productRepository;
    private final ImportReceiptRepository importReceiptRepository;
    private final ExportReceiptRepository exportReceiptRepository;
    private final InventoryHistoryRepository inventoryHistoryRepository;

    /**
     * Confirm phiếu nhập kho → tăng tồn kho
     * CRITICAL: Transaction atomic - nếu 1 bước fail thì rollback toàn bộ
     * 
     * @param importReceiptId ID phiếu nhập
     * @param approver        User confirm phiếu
     */
    @Transactional(rollbackFor = Exception.class)
    public void confirmImportReceipt(Long importReceiptId, User approver) {
        logger.info("Bắt đầu confirm phiếu nhập kho ID: {}", importReceiptId);

        // 1. Load phiếu nhập
        ImportReceipt phieuNhap = importReceiptRepository.findById(importReceiptId)
                .orElseThrow(() -> new ResourceNotFoundException("Phiếu nhập không tồn tại"));

        // 2. Validate trạng thái
        if (phieuNhap.getTrangThai() != ReceiptStatus.DRAFT) {
            throw new BadRequestException("Chỉ có thể confirm phiếu ở trạng thái DRAFT");
        }

        // 3. Load chi tiết phiếu
        List<ImportReceiptDetail> chiTietList = phieuNhap.getChiTietList();
        if (chiTietList.isEmpty()) {
            throw new BadRequestException("Phiếu nhập không có chi tiết");
        }

        // 4. Cập nhật tồn kho từng sản phẩm
        for (ImportReceiptDetail chiTiet : chiTietList) {
            Product product = chiTiet.getProduct();
            int soLuongTruoc = product.getStock();
            int soLuongNhap = chiTiet.getSoLuongNhap();
            int soLuongSau = soLuongTruoc + soLuongNhap;

            // Update product stock
            product.setStock(soLuongSau);
            productRepository.save(product);

            // Ghi log lịch sử tồn kho
            InventoryHistory lichSu = new InventoryHistory();
            lichSu.setProduct(product);
            lichSu.setLoaiThayDoi(InventoryChangeType.NHAP_KHO);
            lichSu.setSoLuongTruoc(soLuongTruoc);
            lichSu.setSoLuongThayDoi(soLuongNhap); // Dương
            lichSu.setSoLuongSau(soLuongSau);
            lichSu.setMaChungTu(phieuNhap.getMaPhieuNhap());
            lichSu.setChungTuType(ChungTuType.PHIEU_NHAP);
            lichSu.setNguoiThucHien(approver);
            lichSu.setGhiChu("Nhập kho từ phiếu: " + phieuNhap.getMaPhieuNhap());
            lichSu.setThoiGian(LocalDateTime.now());
            inventoryHistoryRepository.save(lichSu);

            logger.info("Đã cập nhật tồn kho sản phẩm {} từ {} → {} (+{})",
                    product.getCode(), soLuongTruoc, soLuongSau, soLuongNhap);
        }

        // 5. Cập nhật trạng thái phiếu
        phieuNhap.setTrangThai(ReceiptStatus.CONFIRMED);
        phieuNhap.setNguoiDuyet(approver);
        phieuNhap.setNgayDuyet(LocalDateTime.now());
        importReceiptRepository.save(phieuNhap);

        logger.info("Đã confirm phiếu nhập kho {} thành công", phieuNhap.getMaPhieuNhap());
    }

    /**
     * Confirm phiếu xuất kho → giảm tồn kho
     * CRITICAL: Transaction atomic - validate trước, rollback nếu không đủ hàng
     * 
     * @param exportReceiptId ID phiếu xuất
     * @param approver        User confirm phiếu
     */
    @Transactional(rollbackFor = Exception.class)
    public void confirmExportReceipt(Long exportReceiptId, User approver) {
        logger.info("Bắt đầu confirm phiếu xuất kho ID: {}", exportReceiptId);

        // 1. Load phiếu xuất
        ExportReceipt phieuXuat = exportReceiptRepository.findById(exportReceiptId)
                .orElseThrow(() -> new ResourceNotFoundException("Phiếu xuất không tồn tại"));

        // 2. Validate trạng thái
        if (phieuXuat.getTrangThai() != ReceiptStatus.DRAFT) {
            throw new BadRequestException("Chỉ có thể confirm phiếu ở trạng thái DRAFT");
        }

        // 3. Load chi tiết phiếu
        List<ExportReceiptDetail> chiTietList = phieuXuat.getChiTietList();
        if (chiTietList.isEmpty()) {
            throw new BadRequestException("Phiếu xuất không có chi tiết");
        }

        // 4. VALIDATE TRƯỚC: Kiểm tra tồn kho đủ không
        for (ExportReceiptDetail chiTiet : chiTietList) {
            Product product = productRepository.findById(chiTiet.getProduct().getId())
                    .orElseThrow(() -> new ResourceNotFoundException("Sản phẩm không tồn tại"));

            int soLuongTon = product.getStock();
            int soLuongXuat = chiTiet.getSoLuongXuat();

            if (soLuongTon < soLuongXuat) {
                throw new BadRequestException(
                        String.format("Không đủ hàng để xuất: %s (Tồn: %d, Cần xuất: %d)",
                                product.getName(), soLuongTon, soLuongXuat));
            }
        }

        // 5. Cập nhật tồn kho từng sản phẩm (sau khi validate hết)
        for (ExportReceiptDetail chiTiet : chiTietList) {
            Product product = chiTiet.getProduct();
            int soLuongTruoc = product.getStock();
            int soLuongXuat = chiTiet.getSoLuongXuat();
            int soLuongSau = soLuongTruoc - soLuongXuat;

            // Update product stock
            product.setStock(soLuongSau);
            productRepository.save(product);

            // Ghi log lịch sử tồn kho
            InventoryHistory lichSu = new InventoryHistory();
            lichSu.setProduct(product);
            lichSu.setLoaiThayDoi(InventoryChangeType.XUAT_KHO);
            lichSu.setSoLuongTruoc(soLuongTruoc);
            lichSu.setSoLuongThayDoi(-soLuongXuat); // Âm
            lichSu.setSoLuongSau(soLuongSau);
            lichSu.setMaChungTu(phieuXuat.getMaPhieuXuat());
            lichSu.setChungTuType(ChungTuType.PHIEU_XUAT);
            lichSu.setNguoiThucHien(approver);
            lichSu.setGhiChu("Xuất kho từ phiếu: " + phieuXuat.getMaPhieuXuat() +
                    " (Lý do: " + phieuXuat.getLyDoXuat() + ")");
            lichSu.setThoiGian(LocalDateTime.now());
            inventoryHistoryRepository.save(lichSu);

            logger.info("Đã cập nhật tồn kho sản phẩm {} từ {} → {} (-{})",
                    product.getCode(), soLuongTruoc, soLuongSau, soLuongXuat);
        }

        // 6. Cập nhật trạng thái phiếu
        phieuXuat.setTrangThai(ReceiptStatus.CONFIRMED);
        phieuXuat.setNguoiDuyet(approver);
        phieuXuat.setNgayDuyet(LocalDateTime.now());
        exportReceiptRepository.save(phieuXuat);

        logger.info("Đã confirm phiếu xuất kho {} thành công", phieuXuat.getMaPhieuXuat());
    }

    /**
     * Điều chỉnh tồn kho sau kiểm kê
     * 
     * @param productId     ID sản phẩm
     * @param newQuantity   Số lượng mới sau kiểm kê
     * @param stocktakeCode Mã kiểm kê
     * @param performedBy   User thực hiện
     * @param note          Ghi chú
     */
    @Transactional(rollbackFor = Exception.class)
    public void adjustInventoryAfterStocktake(
            Long productId,
            Integer newQuantity,
            String stocktakeCode,
            User performedBy,
            String note) {

        logger.info("Điều chỉnh tồn kho sản phẩm {} sau kiểm kê {}", productId, stocktakeCode);

        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new ResourceNotFoundException("Sản phẩm không tồn tại"));

        int soLuongTruoc = product.getStock();
        int chenhLech = newQuantity - soLuongTruoc;

        if (chenhLech == 0) {
            logger.info("Không có chênh lệch, không cần điều chỉnh");
            return;
        }

        // Cập nhật tồn kho
        product.setStock(newQuantity);
        productRepository.save(product);

        // Ghi log
        InventoryHistory lichSu = new InventoryHistory();
        lichSu.setProduct(product);
        lichSu.setLoaiThayDoi(InventoryChangeType.DIEU_CHINH_KIEM_KE);
        lichSu.setSoLuongTruoc(soLuongTruoc);
        lichSu.setSoLuongThayDoi(chenhLech);
        lichSu.setSoLuongSau(newQuantity);
        lichSu.setMaChungTu(stocktakeCode);
        lichSu.setChungTuType(ChungTuType.KIEM_KE);
        lichSu.setNguoiThucHien(performedBy);
        lichSu.setGhiChu(note != null ? note : "Điều chỉnh tồn kho sau kiểm kê");
        lichSu.setThoiGian(LocalDateTime.now());
        inventoryHistoryRepository.save(lichSu);

        logger.info("Đã điều chỉnh tồn kho sản phẩm {} từ {} → {} ({}{})",
                product.getCode(), soLuongTruoc, newQuantity,
                chenhLech > 0 ? "+" : "", chenhLech);
    }

    /**
     * Cancel phiếu nhập - chỉ cho phép khi status = DRAFT
     */
    @Transactional
    public void cancelImportReceipt(Long importReceiptId, User user) {
        ImportReceipt phieuNhap = importReceiptRepository.findById(importReceiptId)
                .orElseThrow(() -> new ResourceNotFoundException("Phiếu nhập không tồn tại"));

        if (phieuNhap.getTrangThai() != ReceiptStatus.DRAFT) {
            throw new BadRequestException("Chỉ có thể hủy phiếu ở trạng thái DRAFT");
        }

        phieuNhap.setTrangThai(ReceiptStatus.CANCELLED);
        importReceiptRepository.save(phieuNhap);

        logger.info("Đã hủy phiếu nhập kho {} bởi user {}", phieuNhap.getMaPhieuNhap(), user.getEmail());
    }

    /**
     * Cancel phiếu xuất - chỉ cho phép khi status = DRAFT
     */
    @Transactional
    public void cancelExportReceipt(Long exportReceiptId, User user) {
        ExportReceipt phieuXuat = exportReceiptRepository.findById(exportReceiptId)
                .orElseThrow(() -> new ResourceNotFoundException("Phiếu xuất không tồn tại"));

        if (phieuXuat.getTrangThai() != ReceiptStatus.DRAFT) {
            throw new BadRequestException("Chỉ có thể hủy phiếu ở trạng thái DRAFT");
        }

        phieuXuat.setTrangThai(ReceiptStatus.CANCELLED);
        exportReceiptRepository.save(phieuXuat);

        logger.info("Đã hủy phiếu xuất kho {} bởi user {}", phieuXuat.getMaPhieuXuat(), user.getEmail());
    }
}
