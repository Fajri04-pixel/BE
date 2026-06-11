const BASE_URL = () => process.env.BASE_URL || `http://localhost:${process.env.PORT || 5000}`;

const withImageUrl = (item) => ({
    ...item,
    image_url: item.image_url
        ? (item.image_url.startsWith('http') ? item.image_url : `${BASE_URL()}/uploads/${item.image_url}`)
        : null,
});

async function fetchItems(db, transactionId) {
    const [items] = await db.query(
        `SELECT ti.*, p.image_url, p.brand
         FROM transaction_items ti
         LEFT JOIN products p ON ti.product_id = p.id
         WHERE ti.transaction_id = ?`,
        [transactionId]
    );
    return items.map(withImageUrl);
}

// ─── GET /api/admin/dashboard ──────────────────────────────────────────────
exports.dashboard = async (req, res) => {
    try {
        const [[{ total: totalProducts }]]   = await req.db.query('SELECT COUNT(*) as total FROM products');
        const [[{ total: totalUsers }]]      = await req.db.query('SELECT COUNT(*) as total FROM users WHERE role="user"');
        const [[{ total: totalTransactions }]] = await req.db.query('SELECT COUNT(*) as total FROM transactions');
        const [[{ total: totalRevenue }]]    = await req.db.query('SELECT COALESCE(SUM(total_amount),0) as total FROM transactions WHERE status != "cancelled"');

        res.json({ success: true, data: { totalProducts, totalUsers, totalTransactions, totalRevenue } });
    } catch (err) {
        console.error('AdminController.dashboard:', err.message);
        res.status(500).json({ success: false, message: err.message });
    }
};

// ─── GET /api/users ────────────────────────────────────────────────────────
exports.users = async (req, res) => {
    try {
        const [users] = await req.db.query('SELECT id, username, email, role, phone, address, created_at FROM users ORDER BY id ASC');
        res.json({ success: true, data: users });
    } catch (err) {
        console.error('AdminController.users:', err.message);
        res.status(500).json({ success: false, message: err.message });
    }
};

// ─── DELETE /api/admin/users/:id ──────────────────────────────────────────
exports.destroyUser = async (req, res) => {
    try {
        const [exist] = await req.db.query('SELECT id, role FROM users WHERE id = ?', [req.params.id]);
        if (!exist.length) return res.status(404).json({ success: false, message: 'User tidak ditemukan.' });
        if (exist[0].role === 'admin') return res.status(403).json({ success: false, message: 'Admin tidak bisa dihapus.' });

        await req.db.query('DELETE FROM users WHERE id = ?', [req.params.id]);
        res.json({ success: true, message: 'User berhasil dihapus.' });
    } catch (err) {
        console.error('AdminController.destroyUser:', err.message);
        res.status(500).json({ success: false, message: err.message });
    }
};

// ─── GET /api/admin/transactions ──────────────────────────────────────────
exports.transactions = async (req, res) => {
    try {
        const [transactions] = await req.db.query(
            `SELECT t.*, u.username as user_name, u.email as user_email, u.phone as user_phone, u.address as user_address
             FROM transactions t JOIN users u ON t.user_id = u.id
             ORDER BY t.created_at DESC`
        );
        for (const t of transactions) {
            t.items = await fetchItems(req.db, t.id);
        }
        res.json({ success: true, data: transactions });
    } catch (err) {
        console.error('AdminController.transactions:', err.message);
        res.status(500).json({ success: false, message: err.message });
    }
};

// ─── PUT /api/admin/transactions/:id/status ───────────────────────────────
exports.updateStatus = async (req, res) => {
    const { status } = req.body;
    const valid = ['pending', 'paid', 'shipped', 'completed', 'cancelled'];
    if (!valid.includes(status)) return res.status(400).json({ success: false, message: 'Status tidak valid.' });

    try {
        await req.db.query('UPDATE transactions SET status = ? WHERE id = ?', [status, req.params.id]);
        res.json({ success: true, message: 'Status transaksi diperbarui.' });
    } catch (err) {
        console.error('AdminController.updateStatus:', err.message);
        res.status(500).json({ success: false, message: err.message });
    }
};
