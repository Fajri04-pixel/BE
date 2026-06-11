const express      = require('express');
const router       = express.Router();
const ProductCtrl  = require('../controllers/ProductController');
const verifyToken  = require('../middleware/auth');
const adminOnly    = require('../middleware/roleCheck');

// GET  /api/products        (public)
router.get('/',    ProductCtrl.index);

// GET  /api/products/:id    (public)
router.get('/:id', ProductCtrl.show);

// POST /api/products        (admin + multipart upload)
// Field foto: bebas (image, foto, file, photo, dll)
router.post('/',    verifyToken, adminOnly('admin'), ProductCtrl.store);

// PUT  /api/products/:id    (admin + multipart upload)
router.put('/:id',  verifyToken, adminOnly('admin'), ProductCtrl.update);

// DELETE /api/products/:id  (admin)
router.delete('/:id', verifyToken, adminOnly('admin'), ProductCtrl.destroy);

module.exports = router;
