package com.example.be.service;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.stream.Collectors;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.be.dto.request.SupplierRequest;
import com.example.be.dto.request.SupplierSearchRequest;
import com.example.be.dto.response.SupplierListResponse;
import com.example.be.dto.response.SupplierResponse;
import com.example.be.entity.Supplier;
import com.example.be.entity.enums.SupplierStatus;
import com.example.be.exception.BadRequestException;
import com.example.be.exception.ResourceNotFoundException;
import com.example.be.mapper.SupplierMapper;
import com.example.be.repository.SupplierRepository;

import lombok.RequiredArgsConstructor;

/**
 * Service implementation for Supplier Management
 */
@Service
@RequiredArgsConstructor
@SuppressWarnings("null")
public class SupplierServiceImpl implements SupplierService {

    private static final Logger logger = LoggerFactory.getLogger(SupplierServiceImpl.class);

    private final SupplierRepository repository;
    private final SupplierMapper mapper;

    @Override
    public List<SupplierListResponse> getAllSuppliers() {
        logger.info("Getting all suppliers");
        return repository.findAll(Sort.by(Sort.Direction.DESC, "createdAt")).stream()
                .map(this::mapToListResponseWithStats)
                .collect(Collectors.toList());
    }

    @Override
    public List<SupplierListResponse> getActiveSuppliers() {
        logger.info("Getting active suppliers");
        return repository.findAllActive().stream()
                .map(mapper::toListResponse)
                .collect(Collectors.toList());
    }

    @Override
    public Page<SupplierListResponse> searchSuppliers(SupplierSearchRequest searchRequest) {
        logger.info("Searching suppliers with keyword: {}, status: {}",
                searchRequest.getKeyword(), searchRequest.getTrangThai());

        Pageable pageable = createPageable(searchRequest);
        Page<Supplier> page;

        String keyword = searchRequest.getKeyword();
        SupplierStatus trangThai = searchRequest.getTrangThai();

        if (keyword != null && !keyword.trim().isEmpty() && trangThai != null) {
            // Tìm kiếm với keyword và filter trạng thái
            page = repository.searchByKeywordAndStatus(keyword.trim(), trangThai, pageable);
        } else if (keyword != null && !keyword.trim().isEmpty()) {
            // Chỉ tìm kiếm với keyword
            page = repository.searchByKeyword(keyword.trim(), pageable);
        } else if (trangThai != null) {
            // Chỉ filter theo trạng thái
            page = repository.findByTrangThai(trangThai, pageable);
        } else {
            // Không có filter, lấy tất cả
            page = repository.findAll(pageable);
        }

        return page.map(this::mapToListResponseWithStats);
    }

    @Override
    public SupplierResponse getSupplierById(Long id) {
        logger.info("Getting supplier by id: {}", id);
        Supplier supplier = findById(id);
        return mapToResponseWithStats(supplier);
    }

    @Override
    public SupplierResponse getSupplierByCode(String maNcc) {
        logger.info("Getting supplier by code: {}", maNcc);
        Supplier supplier = repository.findByMaNcc(maNcc)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy nhà cung cấp với mã: " + maNcc));
        return mapToResponseWithStats(supplier);
    }

    @Override
    @Transactional
    public SupplierResponse createSupplier(SupplierRequest request) {
        logger.info("Creating new supplier: {}", request.getTenNcc());

        validateRequiredFields(request);

        // Validate dữ liệu trùng
        validateDuplicateOnCreate(request);

        // Convert request to entity
        Supplier supplier = mapper.toEntity(request);

        // Auto-generate mã nhà cung cấp nếu chưa có
        if (supplier.getMaNcc() == null || supplier.getMaNcc().trim().isEmpty()) {
            supplier.setMaNcc(generateSupplierCode());
        } else {
            // Kiểm tra mã đã tồn tại chưa
            if (repository.existsByMaNcc(supplier.getMaNcc())) {
                throw new BadRequestException("Mã nhà cung cấp đã tồn tại: " + supplier.getMaNcc());
            }
        }

        // Đảm bảo trạng thái mặc định là ACTIVE
        if (supplier.getTrangThai() == null) {
            supplier.setTrangThai(SupplierStatus.ACTIVE);
        }

        Supplier saved = repository.save(supplier);
        logger.info("Created supplier successfully with id: {}, code: {}", saved.getId(), saved.getMaNcc());

        return mapToResponseWithStats(saved);
    }

    @Override
    @Transactional
    public SupplierResponse updateSupplier(Long id, SupplierRequest request) {
        logger.info("Updating supplier id: {}", id);

        Supplier existing = findById(id);

        validateRequiredFields(request);

        // Validate dữ liệu trùng (loại trừ chính nó)
        validateDuplicateOnUpdate(id, request);

        // Update entity
        mapper.updateEntity(existing, request);

        Supplier updated = repository.save(existing);
        logger.info("Updated supplier successfully: {}", id);

        return mapToResponseWithStats(updated);
    }

    @Override
    @Transactional
    public SupplierResponse updateSupplierStatus(Long id, SupplierStatus trangThai) {
        logger.info("Updating supplier status: {} -> {}", id, trangThai);

        Supplier supplier = findById(id);
        supplier.setTrangThai(trangThai);

        Supplier updated = repository.save(supplier);
        logger.info("Updated supplier status successfully");

        return mapToResponseWithStats(updated);
    }

    @Override
    @Transactional
    public void deleteSupplier(Long id) {
        logger.info("Deleting supplier id: {}", id);

        Supplier supplier = findById(id);

        // Kiểm tra nhà cung cấp có phát sinh dữ liệu không
        if (hasRelatedData(id)) {
            // Nếu đã có phiếu nhập -> soft delete (chuyển trạng thái INACTIVE)
            logger.warn("Supplier {} has related data, performing soft delete", id);
            supplier.setTrangThai(SupplierStatus.INACTIVE);
            repository.save(supplier);
            logger.info("Soft deleted supplier (set to INACTIVE): {}", id);
        } else {
            // Chưa có phiếu nhập -> có thể hard delete
            repository.delete(supplier);
            logger.info("Hard deleted supplier: {}", id);
        }
    }

    @Override
    public boolean hasRelatedData(Long id) {
        Long count = repository.countPurchaseReceiptsBySupplierId(id);
        return count != null && count > 0;
    }

    // ============ PRIVATE HELPER METHODS ============

    /**
     * Tìm nhà cung cấp theo ID hoặc throw exception
     */
    private Supplier findById(Long id) {
        return repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy nhà cung cấp với ID: " + id));
    }

    /**
     * Validate các trường bắt buộc khi tạo/cập nhật
     */
    private void validateRequiredFields(SupplierRequest request) {
        if (request == null) {
            throw new BadRequestException("Dữ liệu nhà cung cấp không hợp lệ");
        }

        if (isBlank(request.getTenNcc())) {
            throw new BadRequestException("Tên nhà cung cấp là bắt buộc");
        }

        if (isBlank(request.getSoDienThoai())) {
            throw new BadRequestException("Số điện thoại là bắt buộc");
        }

        if (isBlank(request.getEmail())) {
            throw new BadRequestException("Email là bắt buộc");
        }

        if (isBlank(request.getNguoiLienHe())) {
            throw new BadRequestException("Người liên hệ là bắt buộc");
        }
    }

    private boolean isBlank(String value) {
        return value == null || value.trim().isEmpty();
    }

    /**
     * Validate trùng dữ liệu khi tạo mới
     */
    private void validateDuplicateOnCreate(SupplierRequest request) {
        // Kiểm tra trùng: tên + số điện thoại
        if (request.getTenNcc() != null && request.getSoDienThoai() != null) {
            if (repository.existsByNameAndPhone(
                    request.getTenNcc(), request.getSoDienThoai())) {
                throw new BadRequestException(
                        "Nhà cung cấp với tên '" + request.getTenNcc() +
                                "' và số điện thoại '" + request.getSoDienThoai() + "' đã tồn tại");
            }
        }

        // Kiểm tra trùng email
        if (request.getEmail() != null && !request.getEmail().trim().isEmpty()) {
            if (repository.existsByEmail(request.getEmail())) {
                throw new BadRequestException("Email đã được sử dụng: " + request.getEmail());
            }
        }
    }

    /**
     * Validate trùng dữ liệu khi cập nhật (loại trừ chính nó)
     */
    private void validateDuplicateOnUpdate(Long id, SupplierRequest request) {
        // Kiểm tra trùng: tên + số điện thoại
        if (request.getTenNcc() != null && request.getSoDienThoai() != null) {
            if (repository.existsByNameAndPhoneAndIdNot(
                    request.getTenNcc(), request.getSoDienThoai(), id)) {
                throw new BadRequestException(
                        "Nhà cung cấp với tên '" + request.getTenNcc() +
                                "' và số điện thoại '" + request.getSoDienThoai() + "' đã tồn tại");
            }
        }

        // Kiểm tra trùng email
        if (request.getEmail() != null && !request.getEmail().trim().isEmpty()) {
            if (repository.existsByEmailAndIdNot(request.getEmail(), id)) {
                throw new BadRequestException("Email đã được sử dụng: " + request.getEmail());
            }
        }
    }

    /**
     * Auto-generate mã nhà cung cấp
     * Format: NCC-YYYYMMDD-XXX
     * Ví dụ: NCC-20260407-001, NCC-20260407-002
     */
    private String generateSupplierCode() {
        String datePrefix = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd"));
        String baseCode = "NCC-" + datePrefix;

        // Đếm số nhà cung cấp đã có trong ngày
        List<Supplier> suppliersToday = repository.findAll().stream()
                .filter(s -> s.getMaNcc().startsWith(baseCode))
                .collect(Collectors.toList());

        int nextSequence = suppliersToday.size() + 1;

        return String.format("%s-%03d", baseCode, nextSequence);
    }

    /**
     * Tạo Pageable từ SearchRequest
     */
    private Pageable createPageable(SupplierSearchRequest request) {
        int page = request.getPage() == null ? 0 : request.getPage();
        int size = request.getSize() == null ? 10 : request.getSize();

        Sort sort = Sort.by(
                "DESC".equalsIgnoreCase(request.getSortDirection())
                        ? Sort.Direction.DESC
                        : Sort.Direction.ASC,
                request.getSortBy());

        return PageRequest.of(
                page,
                size,
                sort);
    }

    /**
     * Map Entity -> ListResponse với thống kê
     */
    private SupplierListResponse mapToListResponseWithStats(Supplier entity) {
        Long soPhieuNhap = repository.countPurchaseReceiptsBySupplierId(entity.getId());
        Double tongGiaTriNhap = repository.sumTotalPurchaseValueBySupplierId(entity.getId());
        return mapper.toListResponse(entity, soPhieuNhap, tongGiaTriNhap);
    }

    /**
     * Map Entity -> Response với thống kê
     */
    private SupplierResponse mapToResponseWithStats(Supplier entity) {
        Long soPhieuNhap = repository.countPurchaseReceiptsBySupplierId(entity.getId());
        Double tongGiaTriNhap = repository.sumTotalPurchaseValueBySupplierId(entity.getId());
        return mapper.toResponse(entity, soPhieuNhap, tongGiaTriNhap);
    }
}
