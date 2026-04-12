package com.example.be.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;

@Component
@RequiredArgsConstructor
public class OrderSchemaMigration {

    private static final Logger logger = LoggerFactory.getLogger(OrderSchemaMigration.class);

    private final JdbcTemplate jdbcTemplate;

    @PostConstruct
    public void migrateOrderStatusColumnIfNeeded() {
        try {
            String dataType = jdbcTemplate.queryForObject(
                    "SELECT DATA_TYPE FROM information_schema.COLUMNS "
                            + "WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'orders' AND COLUMN_NAME = 'status'",
                    String.class);

            if (dataType != null && "enum".equalsIgnoreCase(dataType)) {
                jdbcTemplate.execute("ALTER TABLE orders MODIFY COLUMN status VARCHAR(32) NOT NULL");
                logger.info("Migrated orders.status from ENUM to VARCHAR(32)");
            }
        } catch (Exception ex) {
            logger.warn("Order schema migration skipped or failed", ex);
        }
    }
}