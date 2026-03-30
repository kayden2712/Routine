package com.example.be.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.dao.DataAccessException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

@Component
public class DatabaseSchemaMigration implements ApplicationRunner {

    private static final Logger logger = LoggerFactory.getLogger(DatabaseSchemaMigration.class);

    private final JdbcTemplate jdbcTemplate;

    public DatabaseSchemaMigration(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    @Override
    public void run(ApplicationArguments args) {
        try {
            jdbcTemplate.execute("ALTER TABLE products MODIFY COLUMN image_url LONGTEXT NULL");
            jdbcTemplate.execute("ALTER TABLE product_images MODIFY COLUMN image_url LONGTEXT NOT NULL");
            logger.info("Database schema migration applied for product image columns");
        } catch (DataAccessException ex) {
            logger.warn("Database schema migration skipped or failed: {}", ex.getMessage());
        }
    }
}
