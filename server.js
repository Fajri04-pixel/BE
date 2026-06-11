const express = require('express');
const cors    = require('cors');
const dotenv  = require('dotenv');
const mysql   = require('mysql2/promise');
const multer  = require('multer');
const path    = require('path');
const fs      = require('fs');

dotenv.config();

const app = express();

// ─── Folder uploads ──────────────────────────────────────────────────────────
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

// ─── CORS ────────────────────────────────────────────────────────────────────
app.use(cors({
    origin:       '*',
    methods:      ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ─── Static files (foto produk) ──────────────────────────────────────────────
app.use('/uploads', express.static(uploadsDir));

// ─── Database pool ───────────────────────────────────────────────────────────
const db = mysql.createPool({
    host:               process.env.DB_HOST     || 'localhost',
    port:               parseInt(process.env.DB_PORT) || 3308,
    user:               process.env.DB_USER     || 'root',
    password:           process.env.DB_PASSWORD || '',
    database:           process.env.DB_NAME     || 'hp_market',
    waitForConnections: true,
    connectionLimit:    10,
});

// Inject db ke setiap request
app.use((req, _res, next) => { req.db = db; next(); });

// ─── Multer (upload foto — field name bebas) ─────────────────────────────────
const fileFilter = (_req, file, cb) => {
    const ok = /jpeg|jpg|png|gif|webp/.test(path.extname(file.originalname).toLowerCase())
            && /jpeg|jpg|png|gif|webp/.test(file.mimetype);
    ok ? cb(null, true) : cb(new Error('Hanya gambar yang diizinkan (jpg, png, webp, gif)'));
};

// Storage untuk foto PRODUK → prefix: product-
const storageProduct = multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, uploadsDir),
    filename:    (_req, file, cb) => {
        const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
        cb(null, 'product-' + unique + path.extname(file.originalname).toLowerCase());
    },
});

// Storage untuk BUKTI PEMBAYARAN → prefix: payment-
const storagePayment = multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, uploadsDir),
    filename:    (_req, file, cb) => {
        const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
        cb(null, 'payment-' + unique + path.extname(file.originalname).toLowerCase());
    },
});

const uploadProduct = multer({ storage: storageProduct, fileFilter, limits: { fileSize: 5 * 1024 * 1024 } }).any();
const uploadPayment = multer({ storage: storagePayment, fileFilter, limits: { fileSize: 5 * 1024 * 1024 } }).any();

// Pasang middleware upload sesuai jenis route
app.use((req, res, next) => {
    // Bukti pembayaran → pakai storagePayment (prefix payment-)
    if (req.path.match(/^\/api\/transactions\/\d+\/payment-proof$/) && req.method === 'POST') {
        return uploadPayment(req, res, (err) => {
            if (err instanceof multer.MulterError) {
                return res.status(400).json({ success: false, message: err.code === 'LIMIT_FILE_SIZE' ? 'File maksimal 5 MB.' : err.message });
            }
            if (err) return res.status(400).json({ success: false, message: err.message });
            next();
        });
    }

    // Foto produk & upload umum → pakai storageProduct (prefix product-)
    const isProductUpload =
        (req.path.startsWith('/api/products') && ['POST', 'PUT'].includes(req.method)) ||
        req.path.startsWith('/api/upload');

    if (isProductUpload) {
        return uploadProduct(req, res, (err) => {
            if (err instanceof multer.MulterError) {
                return res.status(400).json({ success: false, message: err.code === 'LIMIT_FILE_SIZE' ? 'File maksimal 5 MB.' : err.message });
            }
            if (err) return res.status(400).json({ success: false, message: err.message });
            next();
        });
    }

    next();
});

// ─── Routes ──────────────────────────────────────────────────────────────────
app.use('/api/auth',         require('./routes/auth'));
app.use('/api/products',     require('./routes/products'));
app.use('/api/cart',         require('./routes/cart'));
app.use('/api/transactions', require('./routes/transactions'));
app.use('/api/admin',        require('./routes/admin'));

// Alias: GET /api/users  → admin users (kompatibilitas dengan frontend lama)
app.get('/api/users', require('./middleware/auth'), require('./middleware/roleCheck')('admin'),
    require('./controllers/AdminController').users);

// ─── Upload endpoint standalone ──────────────────────────────────────────────
const verifyToken = require('./middleware/auth');

app.post('/api/upload', verifyToken, (req, res) => {
    const file = req.files && req.files.length > 0 ? req.files[0] : null;
    if (!file) return res.status(400).json({ success: false, message: 'File tidak ditemukan.' });
    const baseUrl = process.env.BASE_URL || `http://localhost:${process.env.PORT || 5000}`;
    res.status(201).json({
        success: true,
        message: 'File berhasil diupload',
        data: {
            filename:     file.filename,
            originalname: file.originalname,
            size:         file.size,
            url:          `${baseUrl}/uploads/${file.filename}`,
            mimetype:     file.mimetype,
        },
    });
});

// ─── Root ────────────────────────────────────────────────────────────────────
app.get('/', (_req, res) => {
    res.json({
        success: true,
        message: '🚀 HP Market API Running',
        version: '3.0.0',
        note:    'Upload foto: gunakan form-data, field name bebas (image/foto/file/photo)',
        endpoints: {
            auth:         'POST /api/auth/register | POST /api/auth/login | GET /api/auth/me',
            products:     'GET /api/products | GET /api/products/:id',
            products_adm: 'POST|PUT /api/products (form-data) | DELETE /api/products/:id',
            cart:         'GET|POST /api/cart | PUT|DELETE /api/cart/:id',
            transactions: 'GET /api/transactions | POST /api/transactions/checkout',
            admin:        'GET /api/admin/dashboard | GET /api/admin/users | DELETE /api/admin/users/:id',
            admin_trx:    'GET /api/admin/transactions | PUT /api/admin/transactions/:id/status',
            upload:       'POST /api/upload (form-data)',
            static:       'GET /uploads/<filename>',
        },
    });
});

// ─── Global error handler ─────────────────────────────────────────────────────
app.use((err, _req, res, _next) => {
    console.error('Unhandled error:', err.message);
    res.status(500).json({ success: false, message: err.message });
});

// ─── Start server ─────────────────────────────────────────────────────────────
const PORT   = process.env.PORT || 5000;
const net    = require('net');
const server = net.createServer();

server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
        console.error(`\n❌ PORT ${PORT} MASIH DIGUNAKAN!\n`);
        console.error('   Jalankan di PowerShell:\n');
        console.error('   Get-Process node | Stop-Process -Force\n');
        process.exit(1);
    }
});

server.listen({ port: PORT, reuseAddr: true }, () => {
    server.close(() => startExpress());
});

function startExpress() {
    const http = app.listen(PORT, async () => {
        console.log('\n');
        console.log('🚀 HP MARKET API  v3.0');
        console.log(`http://localhost:${PORT}`);
        console.log('');
        try {
            const conn = await db.getConnection();
            conn.release();
            console.log('Database  : CONNECTED');
        } catch (e) {
            console.log(' Database  : FAILED');
            console.log('' + e.message.substring(0, 37).padEnd(37) + '');
        }
        console.log('  Uploads   : /uploads/*');
        console.log(' CORS      : * (all origins)');
        console.log('');
        console.log('\n📋 Routes aktif:');
        console.log('   /api/auth/*         → AuthController');
        console.log('   /api/products/*     → ProductController');
        console.log('   /api/cart/*         → CartController');
        console.log('   /api/transactions/* → TransactionController');
        console.log('   /api/admin/*        → AdminController\n');
    });

    http.on('error', (err) => {
        if (err.code === 'EADDRINUSE') {
            console.error(`\n PORT ${PORT} masih digunakan. Jalankan: Get-Process node | Stop-Process -Force\n`);
            process.exit(1);
        }
    });

    process.on('SIGINT', () => {
        console.log('\n Server dimatikan...');
        http.close(() => {
            console.log(` Port ${PORT} bebas.\n`);
            process.exit(0);
        });
    });
}
