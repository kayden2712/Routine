package com.example.be.config;

import java.util.Collections;
import java.util.List;

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

            boolean foreignKeyDisabled = disableForeignKeyChecks();
            List<String> tablesToTruncate = resolveTablesToTruncate();

            if (tablesToTruncate.isEmpty()) {
                logger.warn("No tables found for reset");
            } else {
                for (String table : tablesToTruncate) {
                    try {
                        jdbcTemplate.execute("TRUNCATE TABLE " + table);
                        logger.info("Truncated table: {}", table);
                    } catch (DataAccessException e) {
                        logger.warn("Table {} cannot be truncated: {}", table, e.getMessage());
                    }
                }
            }

            if (foreignKeyDisabled) {
                enableForeignKeyChecks();
            }

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

    private boolean disableForeignKeyChecks() {
        String dialect = resolveDatabaseDialect();
        try {
            if ("mysql".equals(dialect)) {
                jdbcTemplate.execute("SET FOREIGN_KEY_CHECKS=0");
                return true;
            }
            if ("h2".equals(dialect)) {
                jdbcTemplate.execute("SET REFERENTIAL_INTEGRITY FALSE");
                return true;
            }
            logger.warn("Unsupported database dialect for FK disable: {}", dialect);
            return false;
        } catch (DataAccessException e) {
            logger.warn("Could not disable FK checks ({}): {}", dialect, e.getMessage());
            return false;
        }
    }

    private void enableForeignKeyChecks() {
        String dialect = resolveDatabaseDialect();
        try {
            if ("mysql".equals(dialect)) {
                jdbcTemplate.execute("SET FOREIGN_KEY_CHECKS=1");
                return;
            }
            if ("h2".equals(dialect)) {
                jdbcTemplate.execute("SET REFERENTIAL_INTEGRITY TRUE");
                return;
            }
            logger.warn("Unsupported database dialect for FK enable: {}", dialect);
        } catch (DataAccessException e) {
            logger.warn("Could not enable FK checks ({}): {}", dialect, e.getMessage());
        }
    }

    private String resolveDatabaseDialect() {
        try {
            String productName = jdbcTemplate.queryForObject("SELECT DATABASE()", String.class);
            if (productName != null) {
                return "mysql";
            }
        } catch (DataAccessException ignored) {
            // H2 doesn't support SELECT DATABASE(), fall through to H2 probe.
        }

        try {
            String h2Marker = jdbcTemplate.queryForObject("SELECT H2VERSION()", String.class);
            if (h2Marker != null) {
                return "h2";
            }
        } catch (DataAccessException ignored) {
            // ignore and mark unknown
        }

        return "unknown";
    }

    private List<String> resolveTablesToTruncate() {
        String dialect = resolveDatabaseDialect();
        try {
            if ("mysql".equals(dialect)) {
                return jdbcTemplate.queryForList(
                        "SELECT table_name FROM information_schema.tables " +
                                "WHERE table_schema = DATABASE() AND table_type = 'BASE TABLE' " +
                                "AND table_name <> 'flyway_schema_history'",
                        String.class);
            }

            if ("h2".equals(dialect)) {
                return jdbcTemplate.queryForList(
                        "SELECT table_name FROM information_schema.tables " +
                                "WHERE table_schema = 'PUBLIC' AND table_type = 'BASE TABLE'",
                        String.class);
            }
        } catch (DataAccessException e) {
            logger.warn("Could not resolve tables to truncate: {}", e.getMessage());
        }

        return Collections.emptyList();
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
            } catch (DataAccessException e) {
                logger.warn("Admin user may already exist: {}", e.getMessage());
            }

            logger.info("Test data seeding completed");

        } catch (Exception e) {
            logger.error("Error during test data seeding", e);
        }
    }
}
