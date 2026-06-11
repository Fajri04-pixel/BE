
const up = async (db) => {
    // transactions
    await db.query(`
        CREATE TABLE IF NOT EXISTS transactions (
            id             INT            NOT NULL AUTO_INCREMENT,
            invoice_number VARCHAR(50)    NOT NULL UNIQUE,
            user_id        INT            NOT NULL,
            total_amount   DECIMAL(15,2)  NOT NULL DEFAULT 0,
            status         VARCHAR(20)    NOT NULL DEFAULT 'pending'
                           COMMENT 'pending | paid | shipped | completed | cancelled',
            created_at     DATETIME       DEFAULT CURRENT_TIMESTAMP,
            updated_at     DATETIME       DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
            PRIMARY KEY (id),
            UNIQUE KEY uq_invoice (invoice_number),
            CONSTRAINT fk_trx_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
            INDEX idx_trx_user   (user_id),
            INDEX idx_trx_status (status)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // transaction_items
    await db.query(`
        CREATE TABLE IF NOT EXISTS transaction_items (
            id             INT            NOT NULL AUTO_INCREMENT,
            transaction_id INT            NOT NULL,
            product_id     INT            DEFAULT NULL COMMENT 'NULL jika produk sudah dihapus',
            product_name   VARCHAR(200)   NOT NULL COMMENT 'Snapshot nama saat transaksi',
            price          DECIMAL(15,2)  NOT NULL COMMENT 'Snapshot harga saat transaksi',
            quantity       INT            NOT NULL,
            subtotal       DECIMAL(15,2)  NOT NULL,
            PRIMARY KEY (id),
            CONSTRAINT fk_item_trx     FOREIGN KEY (transaction_id) REFERENCES transactions(id) ON DELETE CASCADE,
            CONSTRAINT fk_item_product FOREIGN KEY (product_id)     REFERENCES products(id)    ON DELETE SET NULL,
            INDEX idx_item_trx (transaction_id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
};

const down = async (db) => {
    await db.query('DROP TABLE IF EXISTS transaction_items');
    await db.query('DROP TABLE IF EXISTS transactions');
};

module.exports = { up, down };
