const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
        return res.status(401).json({ 
            success: false, 
            message: 'Akses ditolak. Silakan login terlebih dahulu.' 
        });
    }
    
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (error) {
        res.status(401).json({ 
            success: false, 
            message: 'Token tidak valid. Silakan login kembali.' 
        });
    }
};