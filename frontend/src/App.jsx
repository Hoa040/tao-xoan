import { useState, useEffect } from 'react';
import { Routes, Route, NavLink } from 'react-router-dom';
import { LayoutGrid, AlertTriangle, Database, LogIn, LogOut, ShieldCheck } from 'lucide-react';
import Dashboard from './components/Dashboard';
import ClusterDetail from './components/ClusterDetail';
import AlertsPage from './components/AlertsPage';
import DefinitionsPage from './components/DefinitionsPage';
import LoginModal from './components/LoginModal';
import './App.css';

function App() {
  const [showLogin, setShowLogin] = useState(false);
  const [token, setToken] = useState(() => localStorage.getItem('jwt_token') || null);

  const handleLogout = () => {
    localStorage.removeItem('jwt_token');
    setToken(null);
  };

  return (
    <div className="app-container">
      <header className="header">
        <div className="header-brand">
          <h1>
             <LayoutGrid className="text-primary" size={24} color="#3b82f6" /> 
             Spirulina Monitor
          </h1>
        </div>
        
        <nav className="top-nav">
            <NavLink to="/" end className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
            Dashboard
            </NavLink>
            <NavLink to="/alerts" className={({ isActive }) => isActive ? 'nav-item danger active' : 'nav-item danger'}>
            Cảnh báo
            </NavLink>
            <NavLink to="/definitions" className={({ isActive }) => isActive ? 'nav-item purple active' : 'nav-item purple'}>
            Cấu hình
            </NavLink>
        </nav>

        {/* Nút Admin ở góc phải Header */}
        <div className="header-auth">
            {token ? (
              <div className="admin-badge">
                <ShieldCheck size={16} />
                <span>Admin</span>
                <button className="logout-btn" onClick={handleLogout} title="Đăng xuất">
                  <LogOut size={16} />
                </button>
              </div>
            ) : (
              <button className="login-trigger-btn" onClick={() => setShowLogin(true)}>
                <LogIn size={18} /> Đăng nhập
              </button>
            )}
        </div>
      </header>

      <main className="main-content">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/cluster/:id" element={<ClusterDetail />} />
          <Route path="/alerts" element={<AlertsPage />} />
          <Route path="/definitions" element={<DefinitionsPage token={token} />} />
        </Routes>
      </main>

      <footer className="footer">
        <p>&copy; 2024 Hệ thống nuôi trồng Tảo Xoắn Thông Minh</p>
      </footer>

      {/* Modal đăng nhập */}
      {showLogin && (
        <LoginModal
          onLoginSuccess={(t) => setToken(t)}
          onClose={() => setShowLogin(false)}
        />
      )}
    </div>
  );
}

export default App;
