

const up = async (db) => {
    await db.query(`
        CREATE TABLE IF NOT EXISTS carts (
            id         INT  NOT NULL AUTO_INCREMENT,
            user_id    INT  NOT NULL,
            product_id INT  NOT NULL,
            quantity   INT  NOT NULL DEFAULT 1,
            PRIMARY KEY (id),
            UNIQUE KEY uq_user_product (user_id, product_id),
            CONSTRAINT fk_cart_user    FOREIGN KEY (user_id)    REFERENCES users(id)    ON DELETE CASCADE,
            CONSTRAINT fk_cart_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
            INDEX idx_cart_user (user_id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
};

const down = async (db) => {
    await db.query('DROP TABLE IF EXISTS carts');
};

module.exports = { up, down };
