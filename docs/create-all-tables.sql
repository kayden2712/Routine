-- Routine DB full schema (MySQL 8)
-- Generated from current JPA entities + migration scripts

CREATE DATABASE IF NOT EXISTS routine_db
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE routine_db;

SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS chi_tiet_kiem_ke;
DROP TABLE IF EXISTS kiem_ke;
DROP TABLE IF EXISTS lich_su_ton_kho;
DROP TABLE IF EXISTS chi_tiet_phieu_xuat;
DROP TABLE IF EXISTS phieu_xuat_kho;
DROP TABLE IF EXISTS chi_tiet_phieu_nhap;
DROP TABLE IF EXISTS phieu_nhap_kho;
DROP TABLE IF EXISTS nha_cung_cap;
DROP TABLE IF EXISTS promotion_usage_log;
DROP TABLE IF EXISTS promotion_products;
DROP TABLE IF EXISTS promotions;
DROP TABLE IF EXISTS discount_codes;
DROP TABLE IF EXISTS shipments;
DROP TABLE IF EXISTS order_status_history;
DROP TABLE IF EXISTS order_items;
DROP TABLE IF EXISTS orders;
DROP TABLE IF EXISTS product_review_images;
DROP TABLE IF EXISTS product_reviews;
DROP TABLE IF EXISTS wishlist_items;
DROP TABLE IF EXISTS cart_items;
DROP TABLE IF EXISTS product_images;
DROP TABLE IF EXISTS product_variants;
DROP TABLE IF EXISTS products;
DROP TABLE IF EXISTS categories;
DROP TABLE IF EXISTS customers;
DROP TABLE IF EXISTS users;

SET FOREIGN_KEY_CHECKS = 1;

CREATE TABLE users (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  phone VARCHAR(20) UNIQUE,
  branch VARCHAR(100),
  role VARCHAR(50) NOT NULL,
  avatar_url VARCHAR(500),
  is_active BOOLEAN DEFAULT TRUE,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_user_email (email),
  INDEX idx_user_phone (phone),
  INDEX idx_user_role (role)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE customers (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(255) UNIQUE,
  password_hash VARCHAR(255),
  full_name VARCHAR(255) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  address VARCHAR(500),
  district VARCHAR(100),
  city VARCHAR(100),
  tier VARCHAR(50) NOT NULL DEFAULT 'REGULAR',
  total_orders INT DEFAULT 0,
  total_spent DECIMAL(15,2) DEFAULT 0,
  last_order_at DATETIME,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_email (email),
  INDEX idx_phone (phone),
  INDEX idx_tier (tier)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE categories (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE,
  slug VARCHAR(255) NOT NULL UNIQUE,
  description TEXT,
  icon VARCHAR(100),
  display_order INT DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_slug (slug)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE products (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  code VARCHAR(50) NOT NULL UNIQUE,
  name VARCHAR(255) NOT NULL,
  category_id BIGINT NOT NULL,
  description TEXT,
  price DECIMAL(15,2) NOT NULL,
  cost_price DECIMAL(15,2),
  old_price DECIMAL(15,2),
  stock INT NOT NULL DEFAULT 0,
  min_stock INT DEFAULT 10,
  status VARCHAR(50) NOT NULL DEFAULT 'ACTIVE',
  image_url LONGTEXT,
  sku VARCHAR(100),
  material VARCHAR(255),
  fit VARCHAR(100),
  season VARCHAR(100),
  care_instructions TEXT,
  rating DECIMAL(3,2) DEFAULT 0,
  review_count INT DEFAULT 0,
  badge VARCHAR(50),
  target_gender VARCHAR(20),
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_products_category FOREIGN KEY (category_id) REFERENCES categories(id),
  INDEX idx_product_code (code),
  INDEX idx_product_category (category_id),
  INDEX idx_product_status (status),
  INDEX idx_product_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE product_images (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  product_id BIGINT NOT NULL,
  image_url LONGTEXT NOT NULL,
  display_order INT DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_product_images_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  INDEX idx_product_image_product (product_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE product_variants (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  product_id BIGINT NOT NULL,
  size VARCHAR(20),
  color VARCHAR(50),
  stock INT NOT NULL DEFAULT 0,
  sku VARCHAR(100),
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_product_variants_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  UNIQUE KEY uk_product_variant (product_id, size, color),
  INDEX idx_product_variant_product (product_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE cart_items (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  customer_id BIGINT NOT NULL,
  product_id BIGINT NOT NULL,
  quantity INT NOT NULL DEFAULT 1,
  size VARCHAR(20),
  color VARCHAR(50),
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_cart_items_customer FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
  CONSTRAINT fk_cart_items_product FOREIGN KEY (product_id) REFERENCES products(id),
  UNIQUE KEY uk_cart_item (customer_id, product_id, size, color),
  INDEX idx_cart_item_customer (customer_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE wishlist_items (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  customer_id BIGINT NOT NULL,
  product_id BIGINT NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_wishlist_items_customer FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
  CONSTRAINT fk_wishlist_items_product FOREIGN KEY (product_id) REFERENCES products(id),
  UNIQUE KEY uk_wishlist_item (customer_id, product_id),
  INDEX idx_wishlist_item_customer (customer_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE product_reviews (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  product_id BIGINT NOT NULL,
  customer_id BIGINT NOT NULL,
  rating INT NOT NULL,
  comment TEXT,
  is_verified BOOLEAN DEFAULT FALSE,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_product_reviews_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  CONSTRAINT fk_product_reviews_customer FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
  INDEX idx_product_review_product (product_id),
  INDEX idx_product_review_customer (customer_id),
  CONSTRAINT chk_product_review_rating CHECK (rating BETWEEN 1 AND 5)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE product_review_images (
  review_id BIGINT NOT NULL,
  image_url LONGTEXT,
  CONSTRAINT fk_product_review_images_review FOREIGN KEY (review_id) REFERENCES product_reviews(id) ON DELETE CASCADE,
  INDEX idx_product_review_images_review (review_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE orders (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  order_number VARCHAR(50) NOT NULL UNIQUE,
  customer_id BIGINT,
  subtotal DECIMAL(15,2) NOT NULL,
  discount DECIMAL(15,2) DEFAULT 0,
  total DECIMAL(15,2) NOT NULL,
  payment_method VARCHAR(50) NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'PENDING',
  channel VARCHAR(50) NOT NULL DEFAULT 'OFFLINE',
  created_by BIGINT NOT NULL,
  notes TEXT,
  delivered_at DATETIME,
  stock_deducted BOOLEAN NOT NULL DEFAULT FALSE,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_orders_customer FOREIGN KEY (customer_id) REFERENCES customers(id),
  CONSTRAINT fk_orders_created_by FOREIGN KEY (created_by) REFERENCES users(id),
  INDEX idx_order_order_number (order_number),
  INDEX idx_order_customer (customer_id),
  INDEX idx_order_status (status),
  INDEX idx_order_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE order_items (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  order_id BIGINT NOT NULL,
  product_id BIGINT NOT NULL,
  product_code VARCHAR(50) NOT NULL,
  product_name VARCHAR(255) NOT NULL,
  price DECIMAL(15,2) NOT NULL,
  quantity INT NOT NULL,
  subtotal DECIMAL(15,2) NOT NULL,
  size VARCHAR(20),
  color VARCHAR(50),
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_order_items_order FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  CONSTRAINT fk_order_items_product FOREIGN KEY (product_id) REFERENCES products(id),
  INDEX idx_order_item_order (order_id),
  INDEX idx_order_item_product (product_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE order_status_history (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  order_id BIGINT NOT NULL,
  from_status VARCHAR(32),
  to_status VARCHAR(32) NOT NULL,
  reason VARCHAR(500),
  actor_type VARCHAR(20) NOT NULL,
  actor_id BIGINT,
  metadata_json TEXT,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_order_status_history_order FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  INDEX idx_order_status_history_order (order_id),
  INDEX idx_order_status_history_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE shipments (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  order_id BIGINT NOT NULL UNIQUE,
  provider VARCHAR(30) NOT NULL,
  tracking_code VARCHAR(80) NOT NULL UNIQUE,
  shipment_status VARCHAR(32) NOT NULL DEFAULT 'PENDING_PICKUP',
  raw_payload_json TEXT,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_shipments_order FOREIGN KEY (order_id) REFERENCES orders(id),
  INDEX idx_shipment_order (order_id),
  INDEX idx_shipment_tracking (tracking_code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE discount_codes (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  code VARCHAR(50) NOT NULL UNIQUE,
  discount_type VARCHAR(50) NOT NULL,
  discount_value DECIMAL(15,2) NOT NULL,
  min_order_value DECIMAL(15,2) DEFAULT 0,
  max_uses INT,
  current_uses INT DEFAULT 0,
  valid_from DATETIME,
  valid_to DATETIME,
  is_active BOOLEAN DEFAULT TRUE,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_discount_code_code (code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE promotions (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  code VARCHAR(50) NOT NULL UNIQUE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  type VARCHAR(50) NOT NULL,
  discount_value DECIMAL(15,2) NOT NULL,
  max_discount_amount DECIMAL(15,2),
  start_date DATETIME NOT NULL,
  end_date DATETIME NOT NULL,
  min_order_amount DECIMAL(15,2) DEFAULT 0,
  apply_to_all_products BOOLEAN DEFAULT TRUE,
  usage_limit INT,
  usage_count INT DEFAULT 0,
  status VARCHAR(50) NOT NULL DEFAULT 'DRAFT',
  created_by BIGINT,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_code (code),
  INDEX idx_status (status),
  INDEX idx_dates (start_date, end_date),
  INDEX idx_type (type),
  CONSTRAINT chk_promotion_dates CHECK (end_date > start_date),
  CONSTRAINT chk_promotion_discount_value CHECK (discount_value >= 0),
  CONSTRAINT chk_promotion_usage_count CHECK (usage_count >= 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE promotion_products (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  promotion_id BIGINT NOT NULL,
  product_id BIGINT NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_promotion_products_promotion FOREIGN KEY (promotion_id) REFERENCES promotions(id) ON DELETE CASCADE,
  CONSTRAINT fk_promotion_products_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  UNIQUE KEY uk_promotion_product (promotion_id, product_id),
  INDEX idx_promotion_id (promotion_id),
  INDEX idx_product_id (product_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE promotion_usage_log (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  promotion_id BIGINT NOT NULL,
  order_id BIGINT NOT NULL,
  customer_id BIGINT,
  discount_amount DECIMAL(15,2) NOT NULL,
  applied_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  applied_by BIGINT,
  CONSTRAINT fk_promotion_usage_promotion FOREIGN KEY (promotion_id) REFERENCES promotions(id) ON DELETE CASCADE,
  INDEX idx_promotion_usage_promotion (promotion_id),
  INDEX idx_promotion_usage_order (order_id),
  INDEX idx_promotion_usage_customer (customer_id),
  INDEX idx_promotion_usage_date (applied_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE nha_cung_cap (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  ma_ncc VARCHAR(50) NOT NULL UNIQUE,
  ten_ncc VARCHAR(200) NOT NULL,
  dia_chi TEXT,
  so_dien_thoai VARCHAR(20),
  email VARCHAR(100),
  nguoi_lien_he VARCHAR(100),
  ghi_chu TEXT,
  trang_thai VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_ma_ncc (ma_ncc),
  INDEX idx_ten_ncc (ten_ncc),
  INDEX idx_trang_thai (trang_thai)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE phieu_nhap_kho (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  ma_phieu_nhap VARCHAR(50) NOT NULL UNIQUE,
  ngay_nhap DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  nha_cung_cap_id BIGINT NOT NULL,
  trang_thai VARCHAR(20) NOT NULL DEFAULT 'DRAFT',
  tong_so_luong INT DEFAULT 0,
  tong_tien DECIMAL(15,2) DEFAULT 0,
  ghi_chu TEXT,
  nguoi_tao_id BIGINT NOT NULL,
  nguoi_duyet_id BIGINT,
  ngay_duyet DATETIME,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_phieu_nhap_ncc FOREIGN KEY (nha_cung_cap_id) REFERENCES nha_cung_cap(id),
  CONSTRAINT fk_phieu_nhap_nguoi_tao FOREIGN KEY (nguoi_tao_id) REFERENCES users(id),
  CONSTRAINT fk_phieu_nhap_nguoi_duyet FOREIGN KEY (nguoi_duyet_id) REFERENCES users(id),
  INDEX idx_ma_phieu_nhap (ma_phieu_nhap),
  INDEX idx_ngay_nhap (ngay_nhap),
  INDEX idx_trang_thai (trang_thai),
  INDEX idx_nha_cung_cap (nha_cung_cap_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE chi_tiet_phieu_nhap (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  phieu_nhap_id BIGINT NOT NULL,
  product_id BIGINT NOT NULL,
  so_luong_nhap INT NOT NULL,
  gia_nhap DECIMAL(15,2) NOT NULL,
  thanh_tien DECIMAL(15,2),
  so_luong_ton_truoc_nhap INT NOT NULL DEFAULT 0,
  ghi_chu TEXT,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_ct_phieu_nhap_phieu FOREIGN KEY (phieu_nhap_id) REFERENCES phieu_nhap_kho(id) ON DELETE CASCADE,
  CONSTRAINT fk_ct_phieu_nhap_product FOREIGN KEY (product_id) REFERENCES products(id),
  INDEX idx_ct_phieu_nhap (phieu_nhap_id),
  INDEX idx_ct_product (product_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE phieu_xuat_kho (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  ma_phieu_xuat VARCHAR(50) NOT NULL UNIQUE,
  ngay_xuat DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ly_do_xuat VARCHAR(30) NOT NULL,
  trang_thai VARCHAR(20) NOT NULL DEFAULT 'DRAFT',
  order_id BIGINT,
  tong_so_luong INT DEFAULT 0,
  ghi_chu TEXT,
  nguoi_tao_id BIGINT NOT NULL,
  nguoi_duyet_id BIGINT,
  ngay_duyet DATETIME,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_phieu_xuat_order FOREIGN KEY (order_id) REFERENCES orders(id),
  CONSTRAINT fk_phieu_xuat_nguoi_tao FOREIGN KEY (nguoi_tao_id) REFERENCES users(id),
  CONSTRAINT fk_phieu_xuat_nguoi_duyet FOREIGN KEY (nguoi_duyet_id) REFERENCES users(id),
  INDEX idx_ma_phieu_xuat (ma_phieu_xuat),
  INDEX idx_ngay_xuat (ngay_xuat),
  INDEX idx_trang_thai_xuat (trang_thai),
  INDEX idx_order (order_id),
  INDEX idx_ly_do_xuat (ly_do_xuat)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE chi_tiet_phieu_xuat (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  phieu_xuat_id BIGINT NOT NULL,
  product_id BIGINT NOT NULL,
  so_luong_xuat INT NOT NULL,
  so_luong_ton_truoc_xuat INT NOT NULL DEFAULT 0,
  ghi_chu TEXT,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_ct_phieu_xuat_phieu FOREIGN KEY (phieu_xuat_id) REFERENCES phieu_xuat_kho(id) ON DELETE CASCADE,
  CONSTRAINT fk_ct_phieu_xuat_product FOREIGN KEY (product_id) REFERENCES products(id),
  INDEX idx_ct_phieu_xuat (phieu_xuat_id),
  INDEX idx_ct_xuat_product (product_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE lich_su_ton_kho (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  product_id BIGINT NOT NULL,
  loai_thay_doi VARCHAR(30) NOT NULL,
  so_luong_truoc INT NOT NULL,
  so_luong_thay_doi INT NOT NULL,
  so_luong_sau INT NOT NULL,
  ma_chung_tu VARCHAR(50),
  chung_tu_type VARCHAR(30),
  nguoi_thuc_hien_id BIGINT NOT NULL,
  ghi_chu TEXT,
  thoi_gian DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_lich_su_product FOREIGN KEY (product_id) REFERENCES products(id),
  CONSTRAINT fk_lich_su_nguoi_thuc_hien FOREIGN KEY (nguoi_thuc_hien_id) REFERENCES users(id),
  INDEX idx_lich_su_product (product_id),
  INDEX idx_lich_su_loai (loai_thay_doi),
  INDEX idx_lich_su_thoi_gian (thoi_gian),
  INDEX idx_lich_su_chung_tu (ma_chung_tu, chung_tu_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE kiem_ke (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  ma_kiem_ke VARCHAR(50) NOT NULL UNIQUE,
  ngay_kiem_ke DATE NOT NULL,
  trang_thai VARCHAR(20) NOT NULL DEFAULT 'DANG_KIEM',
  nguoi_kiem_id BIGINT NOT NULL,
  ghi_chu TEXT,
  ngay_hoan_thanh DATETIME,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_kiem_ke_nguoi_kiem FOREIGN KEY (nguoi_kiem_id) REFERENCES users(id),
  INDEX idx_ma_kiem_ke (ma_kiem_ke),
  INDEX idx_ngay_kiem_ke (ngay_kiem_ke),
  INDEX idx_trang_thai_kiem_ke (trang_thai)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE chi_tiet_kiem_ke (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  kiem_ke_id BIGINT NOT NULL,
  product_id BIGINT NOT NULL,
  so_luong_he_thong INT NOT NULL,
  so_luong_thuc_te INT,
  chenh_lech INT,
  ghi_chu TEXT,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_ct_kiem_ke_kiem_ke FOREIGN KEY (kiem_ke_id) REFERENCES kiem_ke(id) ON DELETE CASCADE,
  CONSTRAINT fk_ct_kiem_ke_product FOREIGN KEY (product_id) REFERENCES products(id),
  UNIQUE KEY uk_kiem_ke_product (kiem_ke_id, product_id),
  INDEX idx_ct_kiem_ke (kiem_ke_id),
  INDEX idx_ct_kiem_ke_product (product_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
