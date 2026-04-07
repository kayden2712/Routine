package com.example.be.service;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Objects;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.be.dto.request.ExportReceiptRequest;
import com.example.be.dto.request.ImportReceiptRequest;
import com.example.be.dto.response.ExportReceiptDetailResponse;
import com.example.be.dto.response.ExportReceiptResponse;
import com.example.be.dto.response.ImportReceiptDetailResponse;
import com.example.be.dto.response.ImportReceiptResponse;
import com.example.be.dto.response.ProductSimpleResponse;
import com.example.be.dto.response.SupplierResponse;
import com.example.be.dto.response.UserSimpleResponse;
import com.example.be.entity.ExportReceipt;
import com.example.be.entity.ExportReceiptDetail;
import com.example.be.entity.ImportReceipt;
import com.example.be.entity.ImportReceiptDetail;
import com.example.be.entity.Order;
import com.example.be.entity.Product;
import com.example.be.entity.Supplier;
import com.example.be.entity.User;
import com.example.be.entity.enums.ReceiptStatus;
import com.example.be.entity.enums.SupplierStatus;
import com.example.be.exception.BadRequestException;
import com.example.be.exception.ResourceNotFoundException;
import com.example.be.repository.ExportReceiptRepository;
import com.example.be.repository.ImportReceiptRepository;
import com.example.be.repository.OrderRepository;
import com.example.be.repository.ProductRepository;
import com.example.be.repository.SupplierRepository;
import com.example.be.repository.UserRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
@SuppressWarnings("null")
public class InventoryReceiptServiceImpl implements InventoryReceiptService {

    private static final DateTimeFormatter CODE_DATE_FORMAT = DateTimeFormatter.ofPattern("yyyyMMdd");

    private final ImportReceiptRepository phieuNhapKhoRepository;
    private final ExportReceiptRepository phieuXuatKhoRepository;
    private final ProductRepository productRepository;
    private final SupplierRepository supplierRepository;
    private final OrderRepository orderRepository;
    private final UserRepository userRepository;
    private final InventoryService inventoryService;

    @Override
    public Page<ImportReceiptResponse> getImportReceipts(ReceiptStatus status, int page, int size) {
        Pageable pageable = PageRequest.of(Math.max(page, 0), Math.max(size, 1));
        Page<ImportReceipt> data = status == null
                ? phieuNhapKhoRepository.findAllByOrderByNgayNhapDesc(pageable)
                : phieuNhapKhoRepository.findByTrangThaiOrderByNgayNhapDesc(status, pageable);
        return data.map(this::toImportResponse);
    }

    @Override
    @Transactional
    public ImportReceiptResponse createImportReceipt(ImportReceiptRequest request, String userEmail) {
        User creator = findUserByEmail(userEmail);
        Long supplierId = Objects.requireNonNull(request.getSupplierId(), "supplierId is required");

        Supplier supplier = supplierRepository.findById(supplierId)
                .orElseThrow(() -> new ResourceNotFoundException("Supplier not found"));

        if (supplier.getTrangThai() != SupplierStatus.ACTIVE) {
            throw new BadRequestException("Supplier is not active");
        }

        ImportReceipt receipt = new ImportReceipt();
        receipt.setMaPhieuNhap(generateImportCode(request.getMaPhieuNhap()));
        receipt.setNgayNhap(request.getNgayNhap() != null ? request.getNgayNhap() : LocalDateTime.now());
        receipt.setNhaCungCap(supplier);
        receipt.setTrangThai(ReceiptStatus.DRAFT);
        receipt.setGhiChu(request.getGhiChu());
        receipt.setNguoiTao(creator);

        List<ImportReceiptDetail> details = request.getChiTietList().stream()
                .map(line -> {
                    Product product = productRepository.findById(line.getProductId())
                            .orElseThrow(
                                    () -> new ResourceNotFoundException("Product not found: " + line.getProductId()));

                    BigDecimal unitPrice = line.getGiaNhap();
                    if (unitPrice == null || unitPrice.compareTo(BigDecimal.ZERO) <= 0) {
                        throw new BadRequestException("Import price must be greater than 0");
                    }

                    ImportReceiptDetail detail = new ImportReceiptDetail();
                    detail.setPhieuNhap(receipt);
                    detail.setProduct(product);
                    detail.setSoLuongNhap(line.getSoLuongNhap());
                    detail.setGiaNhap(unitPrice);
                    detail.setSoLuongTonTruocNhap(Objects.requireNonNullElse(product.getStock(), 0));
                    detail.setGhiChu(line.getGhiChu());
                    return detail;
                })
                .toList();

        receipt.setChiTietList(details);
        receipt.calculateTongSoLuong();
        receipt.calculateTongTien();

        ImportReceipt saved = phieuNhapKhoRepository.save(receipt);
        return toImportResponse(saved);
    }

    @Override
    @Transactional
    public ImportReceiptResponse confirmImportReceipt(Long receiptId, String userEmail) {
        User approver = findUserByEmail(userEmail);
        Long requiredReceiptId = Objects.requireNonNull(receiptId, "receiptId is required");
        inventoryService.confirmImportReceipt(requiredReceiptId, approver);
        ImportReceipt saved = phieuNhapKhoRepository.findById(requiredReceiptId)
                .orElseThrow(() -> new ResourceNotFoundException("Import receipt not found"));
        return toImportResponse(saved);
    }

    @Override
    @Transactional
    public ImportReceiptResponse cancelImportReceipt(Long receiptId, String userEmail) {
        User user = findUserByEmail(userEmail);
        Long requiredReceiptId = Objects.requireNonNull(receiptId, "receiptId is required");
        inventoryService.cancelImportReceipt(requiredReceiptId, user);
        ImportReceipt saved = phieuNhapKhoRepository.findById(requiredReceiptId)
                .orElseThrow(() -> new ResourceNotFoundException("Import receipt not found"));
        return toImportResponse(saved);
    }

    @Override
    public Page<ExportReceiptResponse> getExportReceipts(ReceiptStatus status, int page, int size) {
        Pageable pageable = PageRequest.of(Math.max(page, 0), Math.max(size, 1));
        Page<ExportReceipt> data = status == null
                ? phieuXuatKhoRepository.findAllByOrderByNgayXuatDesc(pageable)
                : phieuXuatKhoRepository.findByTrangThaiOrderByNgayXuatDesc(status, pageable);
        return data.map(this::toExportResponse);
    }

    @Override
    @Transactional
    public ExportReceiptResponse createExportReceipt(ExportReceiptRequest request, String userEmail) {
        User creator = findUserByEmail(userEmail);

        ExportReceipt receipt = new ExportReceipt();
        receipt.setMaPhieuXuat(generateExportCode(request.getMaPhieuXuat()));
        receipt.setNgayXuat(request.getNgayXuat() != null ? request.getNgayXuat() : LocalDateTime.now());
        receipt.setLyDoXuat(request.getLyDoXuat());
        receipt.setTrangThai(ReceiptStatus.DRAFT);
        receipt.setGhiChu(request.getGhiChu());
        receipt.setNguoiTao(creator);

        if (request.getOrderId() != null) {
            Long orderId = Objects.requireNonNull(request.getOrderId(), "orderId is required");
            Order order = orderRepository.findById(orderId)
                    .orElseThrow(() -> new ResourceNotFoundException("Order not found"));
            receipt.setOrder(order);
        }

        List<ExportReceiptDetail> details = request.getChiTietList().stream()
                .map(line -> {
                    Product product = productRepository.findById(line.getProductId())
                            .orElseThrow(
                                    () -> new ResourceNotFoundException("Product not found: " + line.getProductId()));

                    ExportReceiptDetail detail = new ExportReceiptDetail();
                    detail.setPhieuXuat(receipt);
                    detail.setProduct(product);
                    detail.setSoLuongXuat(line.getSoLuongXuat());
                    detail.setSoLuongTonTruocXuat(Objects.requireNonNullElse(product.getStock(), 0));
                    detail.setGhiChu(line.getGhiChu());
                    return detail;
                })
                .toList();

        receipt.setChiTietList(details);
        receipt.calculateTongSoLuong();

        ExportReceipt saved = phieuXuatKhoRepository.save(receipt);
        return toExportResponse(saved);
    }

    @Override
    @Transactional
    public ExportReceiptResponse confirmExportReceipt(Long receiptId, String userEmail) {
        User approver = findUserByEmail(userEmail);
        Long requiredReceiptId = Objects.requireNonNull(receiptId, "receiptId is required");
        inventoryService.confirmExportReceipt(requiredReceiptId, approver);
        ExportReceipt saved = phieuXuatKhoRepository.findById(requiredReceiptId)
                .orElseThrow(() -> new ResourceNotFoundException("Export receipt not found"));
        return toExportResponse(saved);
    }

    @Override
    @Transactional
    public ExportReceiptResponse cancelExportReceipt(Long receiptId, String userEmail) {
        User user = findUserByEmail(userEmail);
        Long requiredReceiptId = Objects.requireNonNull(receiptId, "receiptId is required");
        inventoryService.cancelExportReceipt(requiredReceiptId, user);
        ExportReceipt saved = phieuXuatKhoRepository.findById(requiredReceiptId)
                .orElseThrow(() -> new ResourceNotFoundException("Export receipt not found"));
        return toExportResponse(saved);
    }

    private User findUserByEmail(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + email));
    }

    private String generateImportCode(String preferred) {
        if (preferred != null && !preferred.isBlank()) {
            return preferred.trim();
        }

        String base = "PNK-" + LocalDateTime.now().format(CODE_DATE_FORMAT);
        String code = base + "-001";
        int index = 1;
        while (phieuNhapKhoRepository.existsByMaPhieuNhap(code)) {
            index++;
            code = String.format("%s-%03d", base, index);
        }
        return code;
    }

    private String generateExportCode(String preferred) {
        if (preferred != null && !preferred.isBlank()) {
            return preferred.trim();
        }

        String base = "PXK-" + LocalDateTime.now().format(CODE_DATE_FORMAT);
        String code = base + "-001";
        int index = 1;
        while (phieuXuatKhoRepository.existsByMaPhieuXuat(code)) {
            index++;
            code = String.format("%s-%03d", base, index);
        }
        return code;
    }

    private ImportReceiptResponse toImportResponse(ImportReceipt receipt) {
        ImportReceiptResponse response = new ImportReceiptResponse();
        response.setId(receipt.getId());
        response.setMaPhieuNhap(receipt.getMaPhieuNhap());
        response.setNgayNhap(receipt.getNgayNhap());
        response.setTrangThai(receipt.getTrangThai());
        response.setTongSoLuong(receipt.getTongSoLuong());
        response.setTongTien(receipt.getTongTien());
        response.setGhiChu(receipt.getGhiChu());
        response.setNgayDuyet(receipt.getNgayDuyet());
        response.setCreatedAt(receipt.getCreatedAt());
        response.setUpdatedAt(receipt.getUpdatedAt());

        Supplier supplier = receipt.getNhaCungCap();
        if (supplier != null) {
            response.setNhaCungCap(SupplierResponse.builder()
                    .id(supplier.getId())
                    .maNcc(supplier.getMaNcc())
                    .tenNcc(supplier.getTenNcc())
                    .diaChi(supplier.getDiaChi())
                    .soDienThoai(supplier.getSoDienThoai())
                    .email(supplier.getEmail())
                    .nguoiLienHe(supplier.getNguoiLienHe())
                    .ghiChu(supplier.getGhiChu())
                    .trangThai(supplier.getTrangThai())
                    .createdAt(supplier.getCreatedAt())
                    .updatedAt(supplier.getUpdatedAt())
                    .build());
        }

        if (receipt.getNguoiTao() != null) {
            response.setNguoiTao(new UserSimpleResponse(
                    receipt.getNguoiTao().getId(),
                    receipt.getNguoiTao().getEmail(),
                    receipt.getNguoiTao().getFullName()));
        }

        if (receipt.getNguoiDuyet() != null) {
            response.setNguoiDuyet(new UserSimpleResponse(
                    receipt.getNguoiDuyet().getId(),
                    receipt.getNguoiDuyet().getEmail(),
                    receipt.getNguoiDuyet().getFullName()));
        }

        response.setChiTietList(receipt.getChiTietList().stream().map(detail -> new ImportReceiptDetailResponse(
                detail.getId(),
                new ProductSimpleResponse(
                        detail.getProduct().getId(),
                        detail.getProduct().getCode(),
                        detail.getProduct().getName(),
                        detail.getProduct().getStock()),
                detail.getSoLuongNhap(),
                detail.getGiaNhap(),
                detail.getThanhTien(),
                detail.getSoLuongTonTruocNhap(),
                detail.getGhiChu())).toList());

        return response;
    }

    private ExportReceiptResponse toExportResponse(ExportReceipt receipt) {
        ExportReceiptResponse response = new ExportReceiptResponse();
        response.setId(receipt.getId());
        response.setMaPhieuXuat(receipt.getMaPhieuXuat());
        response.setNgayXuat(receipt.getNgayXuat());
        response.setLyDoXuat(receipt.getLyDoXuat());
        response.setTrangThai(receipt.getTrangThai());
        response.setTongSoLuong(receipt.getTongSoLuong());
        response.setGhiChu(receipt.getGhiChu());
        response.setNgayDuyet(receipt.getNgayDuyet());
        response.setCreatedAt(receipt.getCreatedAt());
        response.setUpdatedAt(receipt.getUpdatedAt());

        if (receipt.getOrder() != null) {
            response.setOrderId(receipt.getOrder().getId());
            response.setOrderNumber(receipt.getOrder().getOrderNumber());
        }

        if (receipt.getNguoiTao() != null) {
            response.setNguoiTao(new UserSimpleResponse(
                    receipt.getNguoiTao().getId(),
                    receipt.getNguoiTao().getEmail(),
                    receipt.getNguoiTao().getFullName()));
        }

        if (receipt.getNguoiDuyet() != null) {
            response.setNguoiDuyet(new UserSimpleResponse(
                    receipt.getNguoiDuyet().getId(),
                    receipt.getNguoiDuyet().getEmail(),
                    receipt.getNguoiDuyet().getFullName()));
        }

        response.setChiTietList(receipt.getChiTietList().stream().map(detail -> new ExportReceiptDetailResponse(
                detail.getId(),
                new ProductSimpleResponse(
                        detail.getProduct().getId(),
                        detail.getProduct().getCode(),
                        detail.getProduct().getName(),
                        detail.getProduct().getStock()),
                detail.getSoLuongXuat(),
                detail.getSoLuongTonTruocXuat(),
                detail.getGhiChu())).toList());

        return response;
    }
}
