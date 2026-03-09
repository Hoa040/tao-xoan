import jwt from 'jsonwebtoken';

/**
 * Middleware xác thực JWT Token cho các route được bảo vệ (POST).
 * Client phải gửi header: Authorization: Bearer <token>
 */
const authMiddleware = (req, res, next) => {
    const authHeader = req.headers['authorization'];

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({
            success: false,
            message: 'Truy cập bị từ chối. Không có token xác thực.',
        });
    }

    const token = authHeader.split(' ')[1];

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'spirulina_secret_key');
        req.user = decoded; // ép thêm thông tin user vào request để dùng ở route sau
        next();
    } catch (err) {
        return res.status(403).json({
            success: false,
            message: 'Token không hợp lệ hoặc đã hết hạn.',
        });
    }
};

export default authMiddleware;
