const bcrypt = require('bcryptjs');

// Data users (sudah termasuk admin dan user biasa)
let users = [
    {
        id: 1,
        name: 'Admin HP Market',
        email: 'admin@hpmarket.com',
        password: '$2a$10$rVYkE8XZqKqXKqXqKqXqu', // password: admin123
        role: 'admin',
        phone: '081234567890',
        address: 'Jakarta, Indonesia',
        createdAt: new Date()
    },
];

let nextId = 4;

const hashPassword = async (password) => {
    const salt = await bcrypt.genSalt(10);
    return await bcrypt.hash(password, salt);
};

const verifyPassword = async (password, hash) => {
    return await bcrypt.compare(password, hash);
};

module.exports = { users, nextId, getNextId: () => nextId++, hashPassword, verifyPassword };