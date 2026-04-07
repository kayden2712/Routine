-- ========================================
-- WAREHOUSE MODULE - DATABASE MIGRATION
-- ========================================
-- Description: Module Quản Lý Kho - Phiếu nhập/xuất, Kiểm kê, Lịch sử tồn kho
-- Version: V002
-- Date: 2026-04-06
-- ========================================

-- ========================================
-- 1. NHÀ CUNG CẤP (Suppliers)
-- ========================================
CREATE TABLE IF NOT EXISTS nha_cung_cap (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    
    -- Thông tin cơ bản
    ma_ncc VARCHAR(50) NOT NULL UNIQUE COMMENT 'Mã nhà cung cấp',
    ten_ncc VARCHAR(255) NOT NULL COMMENT 'Tên nhà cung cấp',
    dia_chi TEXT COMMENT 'Địa chỉ',
    so_dien_thoai VARCHAR(20) COMMENT 'Số điện thoại',
    email VARCHAR(100) COMMENT 'Email liên hệ',
    
    -- Thông tin khác
    nguoi_lien_he VARCHAR(100) COMMENT 'Tên người liên hệ',
    ghi_chu TEXT COMMENT 'Ghi chú',
    trang_thai VARCHAR(20) NOT NULL DEFAULT 'ACTIVE' COMMENT 'ACTIVE | INACTIVE',
    
    -- Audit
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Indexes
    INDEX idx_ma_ncc (ma_ncc),
    INDEX idx_ten_ncc (ten_ncc),
    INDEX idx_trang_thai (trang_thai),
    
    -- Constraints
    CONSTRAINT chk_ncc_trang_thai CHECK (trang_thai IN ('ACTIVE', 'INACTIVE'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT = 'Bảng quản lý nhà cung cấp';

-- ========================================
-- 2. PHIẾU NHẬP KHO (Import Receipts)
-- ========================================
CREATE TABLE IF NOT EXISTS phieu_nhap_kho (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    
    -- Mã phiếu
    ma_phieu_nhap VARCHAR(50) NOT NULL UNIQUE COMMENT 'Mã phiếu nhập (auto-generated)',
    
    -- Thông tin nhập
    ngay_nhap DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Ngày nhập hàng',
    nha_cung_cap_id BIGINT NOT NULL COMMENT 'FK -> nha_cung_cap',
    
    -- Trạng thái
    trang_thai VARCHAR(20) NOT NULL DEFAULT 'DRAFT' COMMENT 'DRAFT | CONFIRMED | CANCELLED',
    
    -- Tổng số liệu
    tong_so_luong INT DEFAULT 0 COMMENT 'Tổng số lượng sản phẩm nhập',
    tong_tien DECIMAL(15,2) DEFAULT 0 COMMENT 'Tổng tiền nhập',
    
    -- Metadata
    ghi_chu TEXT COMMENT 'Ghi chú',
    nguoi_tao_id BIGINT NOT NULL COMMENT 'FK -> users (NV Kho tạo phiếu)',
    nguoi_duyet_id BIGINT COMMENT 'FK -> users (Người confirm phiếu)',
    ngay_duyet DATETIME COMMENT 'Thời gian confirm',
    
    -- Audit
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Foreign Keys
    CONSTRAINT fk_phieu_nhap_ncc 
        FOREIGN KEY (nha_cung_cap_id) REFERENCES nha_cung_cap(id),
    CONSTRAINT fk_phieu_nhap_nguoi_tao 
        FOREIGN KEY (nguoi_tao_id) REFERENCES users(id),
    CONSTRAINT fk_phieu_nhap_nguoi_duyet 
        FOREIGN KEY (nguoi_duyet_id) REFERENCES users(id),
    
    -- Indexes
    INDEX idx_ma_phieu_nhap (ma_phieu_nhap),
    INDEX idx_ngay_nhap (ngay_nhap),
    INDEX idx_trang_thai (trang_thai),
    INDEX idx_nha_cung_cap (nha_cung_cap_id),
    
    -- Constraints
    CONSTRAINT chk_phieu_nhap_trang_thai 
        CHECK (trang_thai IN ('DRAFT', 'CONFIRMED', 'CANCELLED')),
    CONSTRAINT chk_phieu_nhap_so_luong 
        CHECK (tong_so_luong >= 0),
    CONSTRAINT chk_phieu_nhap_tong_tien 
        CHECK (tong_tien >= 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT = 'Bảng phiếu nhập kho';

-- ========================================
-- 3. CHI TIẾT PHIẾU NHẬP (Import Receipt Details)
-- ========================================
CREATE TABLE IF NOT EXISTS chi_tiet_phieu_nhap (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    
    phieu_nhap_id BIGINT NOT NULL COMMENT 'FK -> phieu_nhap_kho',
    product_id BIGINT NOT NULL COMMENT 'FK -> products',
    
    so_luong_nhap INT NOT NULL COMMENT 'Số lượng nhập',
    gia_nhap DECIMAL(15,2) NOT NULL COMMENT 'Giá nhập/đơn vị',
    thanh_tien DECIMAL(15,2) GENERATED ALWAYS AS (so_luong_nhap * gia_nhap) STORED COMMENT 'Thành tiền',
    
    so_luong_ton_truoc_nhap INT NOT NULL COMMENT 'Snapshot tồn kho trước nhập',
    ghi_chu TEXT COMMENT 'Ghi chú',
    
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    -- Foreign Keys
    CONSTRAINT fk_ct_phieu_nhap_phieu 
        FOREIGN KEY (phieu_nhap_id) REFERENCES phieu_nhap_kho(id) ON DELETE CASCADE,
    CONSTRAINT fk_ct_phieu_nhap_product 
        FOREIGN KEY (product_id) REFERENCES products(id),
    
    -- Indexes
    INDEX idx_ct_phieu_nhap (phieu_nhap_id),
    INDEX idx_ct_product (product_id),
    
    -- Constraints
    CONSTRAINT chk_ct_nhap_so_luong CHECK (so_luong_nhap > 0),
    CONSTRAINT chk_ct_nhap_gia CHECK (gia_nhap > 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT = 'Bảng chi tiết phiếu nhập kho';

-- ========================================
-- 4. PHIẾU XUẤT KHO (Export Receipts) - THIẾU TRONG SPEC
-- ========================================
CREATE TABLE IF NOT EXISTS phieu_xuat_kho (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    
    -- Mã phiếu
    ma_phieu_xuat VARCHAR(50) NOT NULL UNIQUE COMMENT 'Mã phiếu xuất (auto-generated)',
    
    -- Thông tin xuất
    ngay_xuat DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Ngày xuất hàng',
    ly_do_xuat VARCHAR(30) NOT NULL COMMENT 'BAN_HANG | CHUYEN_KHO | HONG_THAT_THOAT | KHAC',
    
    -- Trạng thái
    trang_thai VARCHAR(20) NOT NULL DEFAULT 'DRAFT' COMMENT 'DRAFT | CONFIRMED | CANCELLED',
    
    -- Liên kết Order (nếu xuất do bán hàng)
    order_id BIGINT COMMENT 'FK -> orders (NULL nếu không phải bán hàng)',
    
    -- Tổng số liệu
    tong_so_luong INT DEFAULT 0 COMMENT 'Tổng số lượng xuất',
    
    -- Metadata
    ghi_chu TEXT COMMENT 'Ghi chú',
    nguoi_tao_id BIGINT NOT NULL COMMENT 'FK -> users (NV Kho)',
    nguoi_duyet_id BIGINT COMMENT 'FK -> users',
    ngay_duyet DATETIME COMMENT 'Thời gian confirm',
    
    -- Audit
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Foreign Keys
    CONSTRAINT fk_phieu_xuat_order 
        FOREIGN KEY (order_id) REFERENCES orders(id),
    CONSTRAINT fk_phieu_xuat_nguoi_tao 
        FOREIGN KEY (nguoi_tao_id) REFERENCES users(id),
    CONSTRAINT fk_phieu_xuat_nguoi_duyet 
        FOREIGN KEY (nguoi_duyet_id) REFERENCES users(id),
    
    -- Indexes
    INDEX idx_ma_phieu_xuat (ma_phieu_xuat),
    INDEX idx_ngay_xuat (ngay_xuat),
    INDEX idx_trang_thai_xuat (trang_thai),
    INDEX idx_order (order_id),
    INDEX idx_ly_do_xuat (ly_do_xuat),
    
    -- Constraints
    CONSTRAINT chk_phieu_xuat_trang_thai 
        CHECK (trang_thai IN ('DRAFT', 'CONFIRMED', 'CANCELLED')),
    CONSTRAINT chk_phieu_xuat_ly_do 
        CHECK (ly_do_xuat IN ('BAN_HANG', 'CHUYEN_KHO', 'HONG_THAT_THOAT', 'KHAC')),
    CONSTRAINT chk_phieu_xuat_so_luong 
        CHECK (tong_so_luong >= 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT = 'Bảng phiếu xuất kho';

-- ========================================
-- 5. CHI TIẾT PHIẾU XUẤT (Export Receipt Details)
-- ========================================
CREATE TABLE IF NOT EXISTS chi_tiet_phieu_xuat (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    
    phieu_xuat_id BIGINT NOT NULL COMMENT 'FK -> phieu_xuat_kho',
    product_id BIGINT NOT NULL COMMENT 'FK -> products',
    
    so_luong_xuat INT NOT NULL COMMENT 'Số lượng xuất',
    so_luong_ton_truoc_xuat INT NOT NULL COMMENT 'Snapshot tồn kho trước xuất',
    
    ghi_chu TEXT COMMENT 'Ghi chú',
    
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    -- Foreign Keys
    CONSTRAINT fk_ct_phieu_xuat_phieu 
        FOREIGN KEY (phieu_xuat_id) REFERENCES phieu_xuat_kho(id) ON DELETE CASCADE,
    CONSTRAINT fk_ct_phieu_xuat_product 
        FOREIGN KEY (product_id) REFERENCES products(id),
    
    -- Indexes
    INDEX idx_ct_phieu_xuat (phieu_xuat_id),
    INDEX idx_ct_xuat_product (product_id),
    
    -- Constraints
    CONSTRAINT chk_ct_xuat_so_luong CHECK (so_luong_xuat > 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT = 'Bảng chi tiết phiếu xuất kho';

-- ========================================
-- 6. LỊCH SỬ TỒN KHO (Inventory History / Audit Trail) - THIẾU
-- ========================================
CREATE TABLE IF NOT EXISTS lich_su_ton_kho (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    
    product_id BIGINT NOT NULL COMMENT 'FK -> products',
    
    -- Loại thay đổi
    loai_thay_doi VARCHAR(30) NOT NULL COMMENT 'NHAP_KHO | XUAT_KHO | DIEU_CHINH_KIEM_KE',
    
    -- Snapshot số lượng
    so_luong_truoc INT NOT NULL COMMENT 'Tồn kho trước khi thay đổi',
    so_luong_thay_doi INT NOT NULL COMMENT 'Số lượng thay đổi (+ hoặc -)',
    so_luong_sau INT NOT NULL COMMENT 'Tồn kho sau khi thay đổi',
    
    -- Chứng từ liên quan
    ma_chung_tu VARCHAR(50) COMMENT 'MaPhieuNhap | MaPhieuXuat | MaKiemKe',
    chung_tu_type VARCHAR(30) COMMENT 'PHIEU_NHAP | PHIEU_XUAT | KIEM_KE',
    
    -- Metadata
    nguoi_thuc_hien_id BIGINT NOT NULL COMMENT 'FK -> users',
    ghi_chu TEXT COMMENT 'Ghi chú',
    
    thoi_gian DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT 'Thời gian thay đổi',
    
    -- Foreign Keys
    CONSTRAINT fk_lich_su_product 
        FOREIGN KEY (product_id) REFERENCES products(id),
    CONSTRAINT fk_lich_su_nguoi_thuc_hien 
        FOREIGN KEY (nguoi_thuc_hien_id) REFERENCES users(id),
    
    -- Indexes
    INDEX idx_lich_su_product (product_id),
    INDEX idx_lich_su_loai (loai_thay_doi),
    INDEX idx_lich_su_thoi_gian (thoi_gian),
    INDEX idx_lich_su_chung_tu (ma_chung_tu, chung_tu_type),
    
    -- Constraints
    CONSTRAINT chk_lich_su_loai 
        CHECK (loai_thay_doi IN ('NHAP_KHO', 'XUAT_KHO', 'DIEU_CHINH_KIEM_KE')),
    CONSTRAINT chk_lich_su_chung_tu_type 
        CHECK (chung_tu_type IN ('PHIEU_NHAP', 'PHIEU_XUAT', 'KIEM_KE'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT = 'Bảng lịch sử thay đổi tồn kho (audit trail)';

-- ========================================
-- 7. KIỂM KÊ KHO (Stock Taking) - THIẾU SPEC ĐẦY ĐỦ
-- ========================================
CREATE TABLE IF NOT EXISTS kiem_ke (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    
    ma_kiem_ke VARCHAR(50) NOT NULL UNIQUE COMMENT 'Mã phiên kiểm kê',
    ngay_kiem_ke DATE NOT NULL COMMENT 'Ngày thực hiện kiểm kê',
    
    trang_thai VARCHAR(20) NOT NULL DEFAULT 'DANG_KIEM' COMMENT 'DANG_KIEM | HOAN_THANH | HUY',
    
    nguoi_kiem_id BIGINT NOT NULL COMMENT 'FK -> users (NV Kho thực hiện)',
    ghi_chu TEXT COMMENT 'Ghi chú',
    
    -- Audit
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    ngay_hoan_thanh DATETIME COMMENT 'Thời gian hoàn thành',
    
    -- Foreign Keys
    CONSTRAINT fk_kiem_ke_nguoi_kiem 
        FOREIGN KEY (nguoi_kiem_id) REFERENCES users(id),
    
    -- Indexes
    INDEX idx_ma_kiem_ke (ma_kiem_ke),
    INDEX idx_ngay_kiem_ke (ngay_kiem_ke),
    INDEX idx_trang_thai_kiem_ke (trang_thai),
    
    -- Constraints
    CONSTRAINT chk_kiem_ke_trang_thai 
        CHECK (trang_thai IN ('DANG_KIEM', 'HOAN_THANH', 'HUY'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT = 'Bảng quản lý phiên kiểm kê kho';

-- ========================================
-- 8. CHI TIẾT KIỂM KÊ (Stock Taking Details)
-- ========================================
CREATE TABLE IF NOT EXISTS chi_tiet_kiem_ke (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    
    kiem_ke_id BIGINT NOT NULL COMMENT 'FK -> kiem_ke',
    product_id BIGINT NOT NULL COMMENT 'FK -> products',
    
    -- Số lượng
    so_luong_he_thong INT NOT NULL COMMENT 'Snapshot từ products.stock khi bắt đầu',
    so_luong_thuc_te INT COMMENT 'NV nhập vào sau khi đếm',
    chenh_lech INT GENERATED ALWAYS AS (COALESCE(so_luong_thuc_te, 0) - so_luong_he_thong) STORED COMMENT 'Chênh lệch = thực tế - hệ thống',
    
    ghi_chu TEXT COMMENT 'Ghi chú (lý do chênh lệch nếu có)',
    
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Foreign Keys
    CONSTRAINT fk_ct_kiem_ke_kiem_ke 
        FOREIGN KEY (kiem_ke_id) REFERENCES kiem_ke(id) ON DELETE CASCADE,
    CONSTRAINT fk_ct_kiem_ke_product 
        FOREIGN KEY (product_id) REFERENCES products(id),
    
    -- Indexes
    INDEX idx_ct_kiem_ke (kiem_ke_id),
    INDEX idx_ct_kiem_ke_product (product_id),
    
    -- Unique constraint để tránh duplicate
    UNIQUE KEY uk_kiem_ke_product (kiem_ke_id, product_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT = 'Bảng chi tiết kiểm kê từng sản phẩm';

-- ========================================
-- SAMPLE DATA (Optional - for development)
-- ========================================
-- Thêm nhà cung cấp mẫu
INSERT INTO nha_cung_cap (ma_ncc, ten_ncc, dia_chi, so_dien_thoai, email, nguoi_lien_he, trang_thai) 
VALUES 
('NCC001', 'Công ty TNHH May Mặc Việt Nam', '123 Đường Lê Lợi, Q1, TP.HCM', '0901234567', 'contact@maymac.vn', 'Nguyễn Văn A', 'ACTIVE'),
('NCC002', 'Xưởng Dệt Thành Công', '456 Đường Trần Hưng Đạo, Q5, TP.HCM', '0907654321', 'info@dettc.com', 'Trần Thị B', 'ACTIVE'),
('NCC003', 'Nhà máy Thời Trang Đồng Nai', 'KCN Biên Hòa 2, Đồng Nai', '0251234567', 'sales@fashiondn.vn', 'Lê Văn C', 'ACTIVE')
ON DUPLICATE KEY UPDATE ten_ncc=VALUES(ten_ncc);

-- ========================================
-- END OF MIGRATION
-- ========================================
