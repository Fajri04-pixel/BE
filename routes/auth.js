const express    = require('express');
const router     = express.Router();
const AuthCtrl   = require('../controllers/AuthController');
const verifyToken = require('../middleware/auth');

// POST /api/auth/register
router.post('/register', AuthCtrl.register);

// POST /api/auth/login
router.post('/login', AuthCtrl.login);

// GET /api/auth/me  (butuh token)
router.get('/me', verifyToken, AuthCtrl.me);

module.exports = router;
