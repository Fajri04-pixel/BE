const express         = require('express');
const router          = express.Router();
const TransactionCtrl = require('../controllers/TransactionController');
const verifyToken     = require('../middleware/auth');

// Semua transaction route butuh login
router.use(verifyToken);

// GET  /api/transactions                       — riwayat transaksi user
router.get('/', TransactionCtrl.index);

// POST /api/transactions/checkout              — checkout keranjang
router.post('/checkout', TransactionCtrl.checkout);

// POST /api/transactions/:id/payment-proof     — upload bukti transfer
// Field file bebas: bukti, image, foto, file, dll
router.post('/:id/payment-proof', TransactionCtrl.uploadProof);

module.exports = router;
