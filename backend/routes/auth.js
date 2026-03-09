import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const router = express.Router();

// Tài khoản admin mẫu (trong dự án thực tế nên lưu vào DB và mã hoá password)
const ADMIN_USER = {
    username: 'admin',
    // password: "spirulina123" đã được mã hoá bằng bcrypt
    passwordHash: bcrypt.hashSync('spirulina123', 10),
};

/**
 * POST /api/auth/login
 * Đăng nhập và nhận JWT token để gọi các API POST được bảo vệ.
 * Body: { "username": "admin", "password": "spirulina123" }
 */
router.post('/login', async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ success: false, message: 'Vui lòng cung cấp username và password.' });
    }

    if (username !== ADMIN_USER.username) {
        return res.status(401).json({ success: false, message: 'Tài khoản không tồn tại.' });
    }

    const isMatch = await bcrypt.compare(password, ADMIN_USER.passwordHash);
    if (!isMatch) {
        return res.status(401).json({ success: false, message: 'Sai mật khẩu.' });
    }

    const token = jwt.sign(
        { username: ADMIN_USER.username, role: 'admin' },
        process.env.JWT_SECRET || 'spirulina_secret_key',
        { expiresIn: '2h' }   // Token hết hạn sau 2 tiếng
    );

    res.json({
        success: true,
        message: 'Đăng nhập thành công!',
        token,
        expiresIn: '2h',
    });
});

export default router;
