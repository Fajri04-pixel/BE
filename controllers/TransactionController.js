const BASE_URL = () => process.env.BASE_URL || `http://localhost:${process.env.PORT || 5000}`;

const withImageUrl = (item) => ({
    ...item,
    image_url: item.image_url
        ? (item.image_url.startsWith('http') ? item.image_url : `${BASE_URL()}/uploads/${item.image_url}`)
        : null,
});

// ─── Helper: ambil items + gambar untuk satu transaksi ─────────────────────
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

// ─── GET /api/transactions ─────────────────────────────────────────────────
exports.index = async (req, res) => {
    try {
        const [transactions] = await req.db.query(
            'SELECT * FROM transactions WHERE user_id = ? ORDER BY created_at DESC',
            [req.user.id]
        );
        for (const t of transactions) {
            t.items = await fetchItems(req.db, t.id);
        }
        res.json({ success: true, data: transactions });
    } catch (err) {
        console.error('TransactionController.index:', err.message);
        res.status(500).json({ success: false, message: err.message });
    }
};

// ─── POST /api/transactions/checkout ──────────────────────────────────────
exports.checkout = async (req, res) => {
    try {
        const [cart] = await req.db.query(
            `SELECT c.*, p.product_name, p.price, p.stock
             FROM carts c JOIN products p ON c.product_id = p.id
             WHERE c.user_id = ?`,
            [req.user.id]
        );

        if (!cart.length) return res.status(400).json({ success: false, message: 'Keranjang kosong.' });

        let total = 0;
        for (const item of cart) {
            if (item.stock < item.quantity) {
                return res.status(400).json({ success: false, message: `Stok ${item.product_name} tidak mencukupi.` });
            }
            total += item.price * item.quantity;
        }

        const now = new Date();
        const inv = `INV/${now.getFullYear()}${String(now.getMonth()+1).padStart(2,'0')}${String(now.getDate()).padStart(2,'0')}/${String(Math.floor(Math.random()*10000)).padStart(4,'0')}`;

        const [trx] = await req.db.query(
            'INSERT INTO transactions (invoice_number, user_id, total_amount, status, created_at) VALUES (?,?,?,?,NOW())',
            [inv, req.user.id, total, 'pending']
        );

        for (const item of cart) {
            await req.db.query(
                'INSERT INTO transaction_items (transaction_id, product_id, product_name, price, quantity, subtotal) VALUES (?,?,?,?,?,?)',
                [trx.insertId, item.product_id, item.product_name, item.price, item.quantity, item.price * item.quantity]
            );
            await req.db.query('UPDATE products SET stock = stock - ? WHERE id = ?', [item.quantity, item.product_id]);
        }

        await req.db.query('DELETE FROM carts WHERE user_id = ?', [req.user.id]);

        console.log(`✅ Checkout: ${inv} total Rp${total}`);
        res.json({ success: true, message: 'Checkout berhasil!', data: { id: trx.insertId, invoice_number: inv, total_amount: total } });
    } catch (err) {
        console.error('TransactionController.checkout:', err.message);
        res.status(500).json({ success: false, message: 'Gagal checkout: ' + err.message });
    }
};

// ─── POST /api/transactions/:id/payment-proof ─────────────────────────────
// Upload bukti transfer — field foto bebas: bukti, image, foto, file, dll
exports.uploadProof = async (req, res) => {
    const trxId        = req.params.id;
    const uploadedFile = req.files && req.files.length > 0 ? req.files[0] : null;

    if (!uploadedFile) {
        return res.status(400).json({ success: false, message: 'File bukti pembayaran tidak ditemukan.' });
    }

    try {
        const [rows] = await req.db.query(
            'SELECT * FROM transactions WHERE id = ? AND user_id = ?',
            [trxId, req.user.id]
        );

        if (!rows.length) {
            return res.status(404).json({ success: false, message: 'Transaksi tidak ditemukan.' });
        }

        if (rows[0].status !== 'pending') {
            return res.status(400).json({
                success: false,
                message: `Bukti hanya bisa dikirim saat status pending. Status sekarang: ${rows[0].status}`
            });
        }

        // Jika ada bukti lama, hapus file-nya
        const path = require('path');
        const fs   = require('fs');
        if (rows[0].payment_proof) {
            const oldPath = path.join(__dirname, '..', 'uploads', rows[0].payment_proof);
            if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
        }

        await req.db.query(
            'UPDATE transactions SET payment_proof = ?, updated_at = NOW() WHERE id = ?',
            [uploadedFile.filename, trxId]
        );

        const baseUrl = process.env.BASE_URL || `http://localhost:${process.env.PORT || 5000}`;
        console.log(`Bukti pembayaran: ${uploadedFile.filename} → transaksi #${trxId}`);

        res.json({
            success: true,
            message: 'Bukti pembayaran berhasil dikirim! Admin akan memverifikasi segera.',
            data: {
                filename:       uploadedFile.filename,
                url:            `${baseUrl}/uploads/${uploadedFile.filename}`,
                transaction_id: trxId,
            },
        });
    } catch (err) {
        console.error('TransactionController.uploadProof:', err.message);
        res.status(500).json({ success: false, message: 'Gagal upload bukti: ' + err.message });
    }
};
