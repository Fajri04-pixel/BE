const BASE_URL = () => process.env.BASE_URL || `http://localhost:${process.env.PORT || 5000}`;

const withImageUrl = (item) => ({
    ...item,
    image_url: item.image_url
        ? (item.image_url.startsWith('http') ? item.image_url : `${BASE_URL()}/uploads/${item.image_url}`)
        : null,
});

// ─── GET /api/cart ─────────────────────────────────────────────────────────
exports.index = async (req, res) => {
    try {
        const [cart] = await req.db.query(
            `SELECT c.id, c.user_id, c.product_id, c.quantity,
                    p.product_name, p.brand, p.price, p.stock, p.image_url
             FROM carts c JOIN products p ON c.product_id = p.id
             WHERE c.user_id = ?`,
            [req.user.id]
        );
        res.json({ success: true, data: cart.map(withImageUrl) });
    } catch (err) {
        console.error('CartController.index:', err.message);
        res.status(500).json({ success: false, message: err.message });
    }
};

// ─── POST /api/cart ────────────────────────────────────────────────────────
exports.store = async (req, res) => {
    const { product_id, quantity } = req.body;
    if (!product_id) return res.status(400).json({ success: false, message: 'product_id wajib diisi.' });

    try {
        const [prod] = await req.db.query('SELECT stock, product_name FROM products WHERE id = ?', [product_id]);
        if (!prod.length) return res.status(404).json({ success: false, message: 'Produk tidak ditemukan.' });

        const [exist] = await req.db.query(
            'SELECT id, quantity FROM carts WHERE user_id = ? AND product_id = ?',
            [req.user.id, product_id]
        );

        if (exist.length) {
            await req.db.query('UPDATE carts SET quantity = ? WHERE id = ?', [exist[0].quantity + (parseInt(quantity) || 1), exist[0].id]);
        } else {
            await req.db.query('INSERT INTO carts (user_id, product_id, quantity) VALUES (?,?,?)', [req.user.id, product_id, parseInt(quantity) || 1]);
        }

        res.json({ success: true, message: 'Produk ditambahkan ke keranjang.' });
    } catch (err) {
        console.error('CartController.store:', err.message);
        res.status(500).json({ success: false, message: err.message });
    }
};

// ─── PUT /api/cart/:id ─────────────────────────────────────────────────────
exports.update = async (req, res) => {
    try {
        await req.db.query(
            'UPDATE carts SET quantity = ? WHERE id = ? AND user_id = ?',
            [req.body.quantity, req.params.id, req.user.id]
        );
        res.json({ success: true, message: 'Keranjang diperbarui.' });
    } catch (err) {
        console.error('CartController.update:', err.message);
        res.status(500).json({ success: false, message: err.message });
    }
};

// ─── DELETE /api/cart/:id ──────────────────────────────────────────────────
exports.destroy = async (req, res) => {
    try {
        await req.db.query('DELETE FROM carts WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);
        res.json({ success: true, message: 'Item dihapus.' });
    } catch (err) {
        console.error('CartController.destroy:', err.message);
        res.status(500).json({ success: false, message: err.message });
    }
};
