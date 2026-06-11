
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const mysql = require('mysql2/promise');
const path  = require('path');
const fs    = require('fs');

const dbConfig = {
    host:     process.env.DB_HOST     || 'localhost',
    port:     parseInt(process.env.DB_PORT) || 3308,
    user:     process.env.DB_USER     || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME     || 'hp_market',
    multipleStatements: true,
};

// File migrasi dijalankan sesuai urutan angka di depan nama file
const migrationFiles = fs
    .readdirSync(__dirname)
    .filter(f => /^\d+_.+\.js$/.test(f))
    .sort();

async function run() {
    const isRollback = process.argv[2] === 'rollback';
    let db;

    try {
        db = await mysql.createConnection(dbConfig);
        console.log('Database connected\n');

        if (isRollback) {
            // Rollback: jalankan terbalik
            const reversed = [...migrationFiles].reverse();
            for (const file of reversed) {
                const migration = require(path.join(__dirname, file));
                console.log(`⬇  Rolling back: ${file}`);
                await migration.down(db);
                console.log(`Done\n`);
            }
            console.log('All migrations rolled back');
        } else {
            // Up: jalankan urutan normal
            for (const file of migrationFiles) {
                const migration = require(path.join(__dirname, file));
                console.log(`⬆  Running: ${file}`);
                await migration.up(db);
                console.log(`Done\n`);
            }
            console.log(' All migrations completed');
        }
    } catch (err) {
        console.error(' Migration error:', err.message);
        process.exit(1);
    } finally {
        if (db) await db.end();
    }
}

run();
