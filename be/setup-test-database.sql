-- ========================================
-- Routine E-commerce Test Database Setup
-- ========================================
-- Database chuyên dùng để testing
-- Sẽ tự động reset dữ liệu, không ảnh hưởng database gốc

-- Create test database with UTF-8 support
CREATE DATABASE IF NOT EXISTS routine_test_db 
CHARACTER SET utf8mb4 
COLLATE utf8mb4_unicode_ci;

-- Create dedicated user for testing (same as production)
CREATE USER IF NOT EXISTS 'routine_user'@'localhost' IDENTIFIED BY 'Routine@2026!';

-- Grant all privileges on test database to the user
GRANT ALL PRIVILEGES ON routine_test_db.* TO 'routine_user'@'localhost';

-- Apply privilege changes
FLUSH PRIVILEGES;

-- Verify setup
SELECT 'Test database created successfully!' AS status;
SHOW DATABASES LIKE 'routine_test_db';
