import { useState } from 'react';
import { X, Lock, LogIn } from 'lucide-react';
import './LoginModal.css';

function LoginModal({ onLoginSuccess, onClose }) {
    const [username, setUsername] = useState('admin');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const res = await fetch('http://localhost:5000/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password }),
            });
            const data = await res.json();

            if (data.success) {
                // Lưu token vào localStorage để dùng xuyên suốt phiên làm việc
                localStorage.setItem('jwt_token', data.token);
                onLoginSuccess(data.token);
                onClose();
            } else {
                setError(data.message || 'Đăng nhập thất bại.');
            }
        } catch {
            setError('Không thể kết nối tới server.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="modal-backdrop" onClick={onClose}>
            <div className="modal-box" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <div className="modal-icon"><Lock size={24} /></div>
                    <h2>Đăng nhập Quản trị</h2>
                    <button className="modal-close-btn" onClick={onClose}><X size={20} /></button>
                </div>
                <p className="modal-subtitle">Đăng nhập để sử dụng các chức năng quản lý (Xóa, Cập nhật dữ liệu)</p>

                <form onSubmit={handleLogin} className="login-form">
                    <div className="form-group">
                        <label>Tên đăng nhập</label>
                        <input type="text" value={username} onChange={e => setUsername(e.target.value)} placeholder="admin" required />
                    </div>
                    <div className="form-group">
                        <label>Mật khẩu</label>
                        <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" required />
                    </div>

                    {error && <div className="login-error">{error}</div>}

                    <button type="submit" className="login-btn" disabled={loading}>
                        <LogIn size={18} />
                        {loading ? 'Đang xác thực...' : 'Đăng nhập'}
                    </button>
                </form>

                <p className="login-hint">Tài khoản mặc định: <code>admin</code> / <code>spirulina123</code></p>
            </div>
        </div>
    );
}

export default LoginModal;
