

const up = async (db) => {
    await db.query(`
        CREATE TABLE IF NOT EXISTS products (
            id             INT            NOT NULL AUTO_INCREMENT,
            product_name   VARCHAR(200)   NOT NULL,
            brand          VARCHAR(100)   NOT NULL,
            price          DECIMAL(15,2)  NOT NULL DEFAULT 0,
            stock          INT            NOT NULL DEFAULT 0,
            description    TEXT,
            specifications TEXT,
            image_url      VARCHAR(255)   DEFAULT NULL COMMENT 'Filename saja, bukan full URL',
            created_at     DATETIME       DEFAULT CURRENT_TIMESTAMP,
            updated_at     DATETIME       DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
            PRIMARY KEY (id),
            INDEX idx_brand (brand),
            INDEX idx_product_name (product_name)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
};

const down = async (db) => {
    await db.query('DROP TABLE IF EXISTS products');
};

module.exports = { up, down };
