const path = require('path');
const fs   = require('fs');

const BASE_URL   = () => process.env.BASE_URL || `http://localhost:${process.env.PORT || 5000}`;
const uploadsDir = path.join(__dirname, '..', 'uploads');

// ─── Helper: tambahkan full URL ke image_url ───────────────────────────────
const withImageUrl = (product) => ({
    ...product,
    image_url: product.image_url
        ? (product.image_url.startsWith('http')
            ? product.image_url
            : `${BASE_URL()}/uploads/${product.image_url}`)
        : null,
});

// ─── GET /api/products ─────────────────────────────────────────────────────
exports.index = async (req, res) => {
    const { search } = req.query;
    try {
        let query  = 'SELECT * FROM products';
        let params = [];
        if (search && search.trim()) {
            query  = 'SELECT * FROM products WHERE product_name LIKE ? OR brand LIKE ?';
            params = [`%${search}%`, `%${search}%`];
        }
        query += ' ORDER BY id DESC';

        const [products] = await req.db.query(query, params);
        res.json({ success: true, data: products.map(withImageUrl) });
    } catch (err) {
        console.error('ProductController.index:', err.message);
        res.status(500).json({ success: false, data: [], message: err.message });
    }
};

// ─── GET /api/products/:id ─────────────────────────────────────────────────
exports.show = async (req, res) => {
    try {
        const [rows] = await req.db.query('SELECT * FROM products WHERE id = ?', [req.params.id]);
        if (!rows.length) return res.status(404).json({ success: false, message: 'Produk tidak ditemukan.' });
        res.json({ success: true, data: withImageUrl(rows[0]) });
    } catch (err) {
        console.error('ProductController.show:', err.message);
        res.status(500).json({ success: false, message: err.message });
    }
};

// ─── POST /api/products ────────────────────────────────────────────────────
exports.store = async (req, res) => {
    const { product_name, brand, price, stock, description, specifications } = req.body;

    if (!product_name || !brand || !price) {
        return res.status(400).json({ success: false, message: 'Nama produk, brand, dan harga wajib diisi.' });
    }

    // Ambil file dari field manapun
    const uploadedFile = req.files && req.files.length > 0 ? req.files[0] : null;
    const image_url    = uploadedFile ? uploadedFile.filename : null;

    try {
        const [result] = await req.db.query(
            'INSERT INTO products (product_name, brand, price, stock, description, specifications, image_url, created_at) VALUES (?,?,?,?,?,?,?,NOW())',
            [product_name, brand, parseInt(price), parseInt(stock) || 0, description || '', specifications || '', image_url]
        );
        const [rows] = await req.db.query('SELECT * FROM products WHERE id = ?', [result.insertId]);
        console.log('✅ Product created:', rows[0].product_name);
        res.status(201).json({ success: true, data: withImageUrl(rows[0]), message: 'Produk berhasil ditambahkan!' });
    } catch (err) {
        console.error('ProductController.store:', err.message);
        res.status(500).json({ success: false, message: 'Gagal menambahkan produk: ' + err.message });
    }
};

// ─── PUT /api/products/:id ─────────────────────────────────────────────────
exports.update = async (req, res) => {
    const { product_name, brand, price, stock, description, specifications } = req.body;
    const productId = req.params.id;

    if (!product_name || !brand || !price) {
        return res.status(400).json({ success: false, message: 'Nama produk, brand, dan harga wajib diisi.' });
    }

    try {
        const [exist] = await req.db.query('SELECT * FROM products WHERE id = ?', [productId]);
        if (!exist.length) return res.status(404).json({ success: false, message: 'Produk tidak ditemukan.' });

        // Jika ada file baru, hapus yang lama
        const uploadedFile = req.files && req.files.length > 0 ? req.files[0] : null;
        let image_url = exist[0].image_url;
        if (uploadedFile) {
            if (image_url && !image_url.startsWith('http')) {
                const oldPath = path.join(uploadsDir, image_url);
                if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
            }
            image_url = uploadedFile.filename;
        }

        await req.db.query(
            'UPDATE products SET product_name=?,brand=?,price=?,stock=?,description=?,specifications=?,image_url=?,updated_at=NOW() WHERE id=?',
            [product_name, brand, parseInt(price), parseInt(stock) || 0, description || '', specifications || '', image_url, productId]
        );

        const [rows] = await req.db.query('SELECT * FROM products WHERE id = ?', [productId]);
        console.log('✅ Product updated:', rows[0].product_name);
        res.json({ success: true, data: withImageUrl(rows[0]), message: 'Produk berhasil diupdate!' });
    } catch (err) {
        console.error('ProductController.update:', err.message);
        res.status(500).json({ success: false, message: 'Gagal mengupdate produk: ' + err.message });
    }
};

// ─── DELETE /api/products/:id ──────────────────────────────────────────────
exports.destroy = async (req, res) => {
    try {
        const [exist] = await req.db.query('SELECT * FROM products WHERE id = ?', [req.params.id]);
        if (!exist.length) return res.status(404).json({ success: false, message: 'Produk tidak ditemukan.' });

        const img = exist[0].image_url;
        if (img && !img.startsWith('http')) {
            const filePath = path.join(uploadsDir, img);
            if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
        }

        await req.db.query('DELETE FROM products WHERE id = ?', [req.params.id]);
        console.log('✅ Product deleted id:', req.params.id);
        res.json({ success: true, message: 'Produk berhasil dihapus!' });
    } catch (err) {
        console.error('ProductController.destroy:', err.message);
        res.status(500).json({ success: false, message: 'Gagal menghapus produk: ' + err.message });
    }
};
