CREATE TABLE IF NOT EXISTS inventory_checks (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,

    stocktake_id BIGINT NOT NULL,
    item_id BIGINT NOT NULL,

    system_qty INT NOT NULL,
    actual_qty INT,
    discrepancy INT,
    status VARCHAR(30) NOT NULL,

    checked_by BIGINT NOT NULL,
    checked_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    note TEXT,

    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_inventory_checks_stocktake FOREIGN KEY (stocktake_id) REFERENCES kiem_ke(id) ON DELETE CASCADE,
    CONSTRAINT fk_inventory_checks_item FOREIGN KEY (item_id) REFERENCES products(id),
    CONSTRAINT fk_inventory_checks_checked_by FOREIGN KEY (checked_by) REFERENCES users(id),

    INDEX idx_inventory_checks_stocktake (stocktake_id),
    INDEX idx_inventory_checks_item (item_id),
    INDEX idx_inventory_checks_checked_at (checked_at),
    INDEX idx_inventory_checks_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE OR REPLACE VIEW inventory_items AS
SELECT
    p.id AS id,
    p.name AS name,
    COALESCE(NULLIF(p.sku, ''), p.code) AS sku,
    p.stock AS current_qty,
    'pcs' AS unit
FROM products p;
