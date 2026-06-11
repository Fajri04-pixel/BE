const express     = require('express');
const router      = express.Router();
const AdminCtrl   = require('../controllers/AdminController');
const verifyToken = require('../middleware/auth');
const adminOnly   = require('../middleware/roleCheck');

// Semua route admin butuh login + role admin
router.use(verifyToken, adminOnly('admin'));

// GET  /api/admin/dashboard
router.get('/dashboard', AdminCtrl.dashboard);

// GET  /api/users                     — daftar semua user
router.get('/users', AdminCtrl.users);

// DELETE /api/admin/users/:id         — hapus user
router.delete('/users/:id', AdminCtrl.destroyUser);

// GET  /api/admin/transactions        — semua transaksi
router.get('/transactions', AdminCtrl.transactions);

// PUT  /api/admin/transactions/:id/status — update status
router.put('/transactions/:id/status', AdminCtrl.updateStatus);

module.exports = router;
