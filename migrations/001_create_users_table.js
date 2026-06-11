

const up = async (db) => {
    await db.query(`
        CREATE TABLE IF NOT EXISTS users (
            id         INT          NOT NULL AUTO_INCREMENT,
            username   VARCHAR(100) NOT NULL,
            email      VARCHAR(100) NOT NULL UNIQUE,
            password   VARCHAR(255) NOT NULL,
            role       VARCHAR(10)  NOT NULL DEFAULT 'user' COMMENT 'admin | user',
            phone      VARCHAR(20)  DEFAULT '',
            address    TEXT,
            created_at DATETIME     DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (id),
            INDEX idx_email (email),
            INDEX idx_role  (role)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // Seed akun admin default jika belum ada
    const [exist] = await db.query("SELECT id FROM users WHERE email = 'admin@hpmarket.com'");
    if (!exist.length) {
        await db.query(`
            INSERT INTO users (username, email, password, role, phone, address, created_at)
            VALUES ('Administrator', 'admin@hpmarket.com', 'admin123', 'admin', '081234567890', 'Jakarta', NOW())
        `);
        console.log('  ✅ Seed admin: admin@hpmarket.com / admin123');
    }
};

const down = async (db) => {
    await db.query('DROP TABLE IF EXISTS users');
};

module.exports = { up, down };
