const bcrypt  = require('bcryptjs');
const jwt     = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'hpmarket_secret_key_2024';
const JWT_EXPIRE = process.env.JWT_EXPIRE  || '7d';

// ─── Helper: format user response ──────────────────────────────────────────
const formatUser = (u) => ({
    id:      u.id,
    name:    u.username,
    email:   u.email,
    role:    u.role,
    phone:   u.phone   || '',
    address: u.address || '',
});

// ─── POST /api/auth/register ───────────────────────────────────────────────
exports.register = async (req, res) => {
    const { username, email, password, phone, address } = req.body;

    if (!username || !email || !password) {
        return res.status(400).json({ success: false, message: 'Username, email, dan password wajib diisi.' });
    }

    try {
        const [exist] = await req.db.query('SELECT id FROM users WHERE email = ?', [email]);
        if (exist.length > 0) {
            return res.status(400).json({ success: false, message: 'Email sudah terdaftar.' });
        }

        // Simpan plain text (sesuai behaviour server.js saat ini)
        const [result] = await req.db.query(
            'INSERT INTO users (username, email, password, role, phone, address, created_at) VALUES (?,?,?,?,?,?,NOW())',
            [username, email, password, 'user', phone || '', address || '']
        );

        const token = jwt.sign({ id: result.insertId, email, role: 'user' }, JWT_SECRET, { expiresIn: JWT_EXPIRE });

        res.status(201).json({
            success: true,
            message: 'Registrasi berhasil!',
            token,
            user: { id: result.insertId, name: username, email, role: 'user', phone: phone || '', address: address || '' },
        });
    } catch (err) {
        console.error('AuthController.register:', err.message);
        res.status(500).json({ success: false, message: 'Server error.' });
    }
};

// ─── POST /api/auth/login ──────────────────────────────────────────────────
exports.login = async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ success: false, message: 'Email dan password wajib diisi.' });
    }

    try {
        const [users] = await req.db.query('SELECT * FROM users WHERE email = ?', [email]);

        if (!users.length) {
            return res.status(401).json({ success: false, message: 'Email atau password salah!' });
        }

        const user = users[0];

        // Support plain text (data lama) dan bcrypt (data baru)
        let valid = false;
        if (user.password.startsWith('$2')) {
            valid = await bcrypt.compare(password, user.password);
        } else {
            valid = password === user.password;
        }

        if (!valid) {
            return res.status(401).json({ success: false, message: 'Email atau password salah!' });
        }

        const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: JWT_EXPIRE });

        console.log(`Login: ${user.username} (${user.role})`);

        res.json({ success: true, message: 'Login berhasil!', token, user: formatUser(user) });
    } catch (err) {
        console.error('AuthController.login:', err.message);
        res.status(500).json({ success: false, message: 'Server error.' });
    }
};

// ─── GET /api/auth/me ──────────────────────────────────────────────────────
exports.me = async (req, res) => {
    try {
        const [users] = await req.db.query(
            'SELECT id, username, email, role, phone, address FROM users WHERE id = ?',
            [req.user.id]
        );
        if (!users.length) return res.status(404).json({ success: false, message: 'User tidak ditemukan.' });
        res.json({ success: true, user: formatUser(users[0]) });
    } catch (err) {
        console.error('AuthController.me:', err.message);
        res.status(500).json({ success: false, message: 'Server error.' });
    }
};
