const express      = require('express');
const router       = express.Router();
const CartCtrl     = require('../controllers/CartController');
const verifyToken  = require('../middleware/auth');

// Semua cart route butuh login
router.use(verifyToken);

// GET    /api/cart        — ambil isi keranjang
router.get('/',    CartCtrl.index);

// POST   /api/cart        — tambah produk ke keranjang
router.post('/',   CartCtrl.store);

// PUT    /api/cart/:id    — update quantity
router.put('/:id', CartCtrl.update);

// DELETE /api/cart/:id    — hapus item
router.delete('/:id', CartCtrl.destroy);

module.exports = router;
