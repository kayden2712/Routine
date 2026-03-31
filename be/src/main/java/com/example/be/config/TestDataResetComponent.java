package com.example.be.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.dao.DataAccessException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

import lombok.RequiredArgsConstructor;

/**
 * Component để tự động reset dữ liệu khi chạy ở dev/test environment
 * Sẽ xóa hết dữ liệu và có thể seeding sample data
 * 
 * Chỉ active khi:
 * - Profile "dev" hoặc "test" được activate
 * - app.test.reset-data.enabled=true trong properties
 */
@Component
@Profile({ "dev", "test" })
@RequiredArgsConstructor
public class TestDataResetComponent implements ApplicationRunner {

    private static final Logger logger = LoggerFactory.getLogger(TestDataResetComponent.class);

    private final JdbcTemplate jdbcTemplate;

    @Value("${app.test.reset-data.enabled:false}")
    private boolean resetDataEnabled;

    @Value("${app.test.data.seed:false}")
    private boolean seedTestData;

    @Override
    public void run(ApplicationArguments args) {
        if (!resetDataEnabled) {
            logger.info("Test data reset is disabled");
            return;
        }

        try {
            logger.warn("========================================");
            logger.warn("RESET TEST DATABASE - Clearing all data");
            logger.warn("========================================");

            // Disable foreign key checks
            jdbcTemplate.execute("SET FOREIGN_KEY_CHECKS=0");

            // Truncate all tables (in correct order to avoid FK constraints)
            String[] tablesToTruncate = {
                    "order_items",
                    "orders",
                    "product_images",
                    "products",
                    "categories",
                    "customers",
                    "users",
                    "admin_users"
            };

            for (String table : tablesToTruncate) {
                try {
                    jdbcTemplate.execute("TRUNCATE TABLE " + table);
                    logger.info("Truncated table: {}", table);
                } catch (DataAccessException e) {
                    logger.warn("Table {} does not exist or cannot be truncated: {}", table, e.getMessage());
                }
            }

            // Re-enable foreign key checks
            jdbcTemplate.execute("SET FOREIGN_KEY_CHECKS=1");

            logger.info("Database reset completed successfully");

            // Seed sample data if enabled
            if (seedTestData) {
                seedSampleData();
            }

        } catch (Exception e) {
            logger.error("Error during database reset", e);
            throw new RuntimeException("Failed to reset test database", e);
        }
    }

    /**
     * Seed sample test data vào database
     */
    private void seedSampleData() {
        try {
            logger.info("========================================");
            logger.info("SEEDING TEST DATA");
            logger.info("========================================");

            // Insert admin user
            String adminInsert = "INSERT INTO admin_users (full_name, email, password, role, created_at) VALUES " +
                    "('Admin', 'admin@routine.com', '$2a$10$xyz...', 'manager', NOW())";
            try {
                jdbcTemplate.execute(adminInsert);
                logger.info("Inserted test admin user");
            } catch (Exception e) {
                logger.warn("Admin user may already exist: {}", e.getMessage());
            }

            logger.info("Test data seeding completed");

        } catch (Exception e) {
            logger.error("Error during test data seeding", e);
        }
    }
}
