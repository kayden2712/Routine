-- ========================================
-- PROMOTION MODULE - DATABASE MIGRATION
-- ========================================
-- Description: Tạo bảng quản lý khuyến mãi và liên kết sản phẩm
-- Version: V001
-- Date: 2026-04-06
-- ========================================

-- 1. Tạo bảng promotions (Chương trình khuyến mãi)
CREATE TABLE IF NOT EXISTS promotions (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    
    -- Thông tin cơ bản
    code VARCHAR(50) NOT NULL UNIQUE COMMENT 'Mã khuyến mãi (unique)',
    name VARCHAR(255) NOT NULL COMMENT 'Tên chương trình',
    description TEXT COMMENT 'Mô tả chi tiết',
    
    -- Loại và giá trị khuyến mãi
    type VARCHAR(50) NOT NULL COMMENT 'GIAM_PHAN_TRAM | GIAM_TIEN | TANG_QUA',
    discount_value DECIMAL(15,2) NOT NULL COMMENT 'Giá trị ưu đãi (% hoặc tiền)',
    max_discount_amount DECIMAL(15,2) COMMENT 'Số tiền giảm tối đa (áp dụng cho % giảm)',
    
    -- Thời gian áp dụng
    start_date DATETIME NOT NULL COMMENT 'Thời gian bắt đầu',
    end_date DATETIME NOT NULL COMMENT 'Thời gian kết thúc',
    
    -- Điều kiện áp dụng
    min_order_amount DECIMAL(15,2) DEFAULT 0 COMMENT 'Giá trị đơn hàng tối thiểu',
    apply_to_all_products BOOLEAN DEFAULT TRUE COMMENT 'Áp dụng cho tất cả sản phẩm',
    usage_limit INT COMMENT 'Số lần sử dụng tối đa (NULL = không giới hạn)',
    usage_count INT DEFAULT 0 COMMENT 'Số lần đã sử dụng',
    
    -- Trạng thái
    status VARCHAR(50) NOT NULL DEFAULT 'DRAFT' COMMENT 'DRAFT | ACTIVE | EXPIRED | CANCELLED',
    
    -- Audit fields (inherited from BaseEntity concept)
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by BIGINT COMMENT 'FK to users/staff',
    
    -- Indexes
    INDEX idx_code (code),
    INDEX idx_status (status),
    INDEX idx_dates (start_date, end_date),
    INDEX idx_type (type),
    
    -- Constraints
    CONSTRAINT chk_discount_value CHECK (discount_value >= 0),
    CONSTRAINT chk_dates CHECK (end_date > start_date),
    CONSTRAINT chk_min_order CHECK (min_order_amount >= 0),
    CONSTRAINT chk_usage CHECK (usage_count >= 0),
    CONSTRAINT chk_status CHECK (status IN ('DRAFT', 'ACTIVE', 'EXPIRED', 'CANCELLED')),
    CONSTRAINT chk_type CHECK (type IN ('GIAM_PHAN_TRAM', 'GIAM_TIEN', 'TANG_QUA'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Tạo bảng promotion_products (Liên kết khuyến mãi - sản phẩm)
CREATE TABLE IF NOT EXISTS promotion_products (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    promotion_id BIGINT NOT NULL,
    product_id BIGINT NOT NULL,
    
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    -- Foreign Keys
    CONSTRAINT fk_promotion_products_promotion 
        FOREIGN KEY (promotion_id) REFERENCES promotions(id) ON DELETE CASCADE,
    CONSTRAINT fk_promotion_products_product 
        FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    
    -- Unique constraint để tránh duplicate
    UNIQUE KEY uk_promotion_product (promotion_id, product_id),
    
    -- Indexes
    INDEX idx_promotion_id (promotion_id),
    INDEX idx_product_id (product_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Tạo bảng promotion_usage_log (Log lịch sử áp dụng khuyến mãi)
CREATE TABLE IF NOT EXISTS promotion_usage_log (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    promotion_id BIGINT NOT NULL,
    order_id BIGINT NOT NULL COMMENT 'FK to orders table',
    customer_id BIGINT COMMENT 'FK to users/customers',
    discount_amount DECIMAL(15,2) NOT NULL COMMENT 'Số tiền đã giảm',
    applied_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    applied_by BIGINT COMMENT 'Staff ID who applied (for manual application)',
    
    -- Foreign Keys
    CONSTRAINT fk_promotion_usage_promotion 
        FOREIGN KEY (promotion_id) REFERENCES promotions(id) ON DELETE CASCADE,
    
    -- Indexes
    INDEX idx_promotion_usage_promotion (promotion_id),
    INDEX idx_promotion_usage_order (order_id),
    INDEX idx_promotion_usage_customer (customer_id),
    INDEX idx_promotion_usage_date (applied_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Thêm comment cho tables
ALTER TABLE promotions COMMENT = 'Bảng quản lý chương trình khuyến mãi';
ALTER TABLE promotion_products COMMENT = 'Bảng liên kết nhiều-nhiều giữa khuyến mãi và sản phẩm';
ALTER TABLE promotion_usage_log COMMENT = 'Bảng log lịch sử áp dụng khuyến mãi';

-- ========================================
-- SAMPLE DATA (Optional - for development)
-- ========================================
-- Uncomment below to insert sample promotions

/*
INSERT INTO promotions (code, name, description, type, discount_value, max_discount_amount, 
                        start_date, end_date, min_order_amount, apply_to_all_products, status) 
VALUES 
('SUMMER2026', 'Khuyến mãi mùa hè 2026', 'Giảm 20% cho tất cả sản phẩm', 
 'GIAM_PHAN_TRAM', 20.00, 500000.00, 
 '2026-06-01 00:00:00', '2026-08-31 23:59:59', 0.00, TRUE, 'DRAFT'),

('NEWCUST50K', 'Khách hàng mới - Giảm 50K', 'Giảm 50.000đ cho đơn hàng đầu tiên từ 500K', 
 'GIAM_TIEN', 50000.00, NULL, 
 '2026-04-01 00:00:00', '2026-12-31 23:59:59', 500000.00, TRUE, 'ACTIVE'),

('FLASH15', 'Flash Sale 15%', 'Giảm 15% áp dụng cho sản phẩm được chọn', 
 'GIAM_PHAN_TRAM', 15.00, 300000.00, 
 '2026-04-06 00:00:00', '2026-04-10 23:59:59', 0.00, FALSE, 'ACTIVE');
*/
