-- ========================================
-- Routine E-commerce Database Setup
-- ========================================

-- Create database with UTF-8 support
CREATE DATABASE IF NOT EXISTS routine_db 
CHARACTER SET utf8mb4 
COLLATE utf8mb4_unicode_ci;

-- Create dedicated user for the application
CREATE USER IF NOT EXISTS 'routine_user'@'localhost' IDENTIFIED BY 'Routine@2026!';

-- Grant all privileges on routine_db to the user
GRANT ALL PRIVILEGES ON routine_db.* TO 'routine_user'@'localhost';

-- Apply privilege changes
FLUSH PRIVILEGES;

-- Switch to the database
USE routine_db;

-- Verify setup
SELECT 'Database created successfully!' AS status;

-- Show connection info
SELECT 
    'Use these credentials in application.properties:' AS info,
    'spring.datasource.username=routine_user' AS username,
    'spring.datasource.password=Routine@2026!' AS password,
    'spring.datasource.url=jdbc:mysql://localhost:3306/routine_db' AS url;
