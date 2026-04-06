import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  HiOutlineOfficeBuilding, 
  HiOutlineShieldCheck, 
  HiOutlineCube, 
  HiOutlineExclamation 
} from 'react-icons/hi';

export default function Login() {
  const { loginAdmin, loginShop, isAuthenticated, isAdmin, isShop } = useAuth();
  const navigate = useNavigate();

  const [mode, setMode] = useState('admin'); // 'admin' | 'shop'
  const [adminToken, setAdminToken] = useState('');
  const [shopUsername, setShopUsername] = useState('');
  const [shopPassword, setShopPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Individual role redirects inside the form or as status indicators
  const handleAlreadyLoggedIn = (role) => {
    if (role === 'admin') navigate('/admin');
    if (role === 'shop') navigate('/portal');
  };

  async function handleAdminLogin(e) {
    e.preventDefault();
    if (!adminToken.trim()) return setError('Please enter the admin token');
    setLoading(true);
    setError('');
    try {
      await loginAdmin(adminToken.trim());
      navigate('/admin', { replace: true });
    } catch (err) {
      setError(err.response?.data?.detail || 'Invalid admin token');
    } finally {
      setLoading(false);
    }
  }

  async function handleShopLogin(e) {
    e.preventDefault();
    if (!shopUsername.trim() || !shopPassword.trim()) {
      return setError('Please enter username and password');
    }
    setLoading(true);
    setError('');
    try {
      await loginShop(shopUsername.trim(), shopPassword.trim());
      navigate('/portal', { replace: true });
    } catch (err) {
      setError(err.response?.data?.detail || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-page">
      <div className="login-container animate-in">
        {/* Brand Header */}
        <div className="login-brand">
          <div className="login-brand-icon">
            <HiOutlineCube />
          </div>
          <h1>Manufacturing</h1>
          <p>Inventory Management</p>
        </div>

        {/* Role Toggle */}
        <div className="login-toggle">
          <button
            className={`login-toggle-btn ${mode === 'admin' ? 'active' : ''}`}
            onClick={() => { setMode('admin'); setError(''); }}
          >
            <HiOutlineShieldCheck />
            <span>Admin</span>
          </button>
          <button
            className={`login-toggle-btn ${mode === 'shop' ? 'active' : ''}`}
            onClick={() => { setMode('shop'); setError(''); }}
          >
            <HiOutlineOfficeBuilding />
            <span>Shop Owner</span>
          </button>
          <div
            className="login-toggle-indicator"
            style={{ transform: mode === 'shop' ? 'translateX(100%)' : 'translateX(0)' }}
          />
        </div>

        {/* Error */}
        {error && (
          <div className="login-error animate-in">
            <HiOutlineExclamation /> {error}
          </div>
        )}

        {/* Admin Login Form */}
        {mode === 'admin' && (
          <form onSubmit={handleAdminLogin} className="login-form animate-in">
            <div className="login-form-header">
              <div className="login-form-icon admin-icon">
                <HiOutlineShieldCheck />
              </div>
              <h2>Admin Login</h2>
              <p>Enter your admin authentication token to access the management portal</p>
              {isAdmin && (
                <div style={{ marginTop: 12 }}>
                  <span className="badge badge-success" style={{ padding: '6px 12px', fontSize: 11 }}>✓ You are currently logged in as Admin</span>
                  <button type="button" className="btn btn-secondary btn-sm" style={{ display: 'block', margin: '8px auto 0', fontSize: 11 }} onClick={() => navigate('/admin')}>Go to Admin Panel</button>
                </div>
              )}
            </div>

            <div className="form-group">
              <label className="form-label">Admin Token</label>
              <input
                id="admin-token-input"
                className="form-input login-input"
                type="password"
                placeholder="Enter your admin token…"
                value={adminToken}
                onChange={(e) => setAdminToken(e.target.value)}
                autoFocus
              />
            </div>

            <button
              id="admin-login-btn"
              className="btn btn-primary login-submit"
              type="submit"
              disabled={loading}
            >
              {loading ? (
                <span className="login-loading">
                  <span className="spinner-sm" /> Loading…
                </span>
              ) : (
                <>Sign in as Admin</>
              )}
            </button>
          </form>
        )}

        {/* Shop Login Form */}
        {mode === 'shop' && (
          <form onSubmit={handleShopLogin} className="login-form animate-in">
            <div className="login-form-header">
              <div className="login-form-icon shop-icon">
                <HiOutlineOfficeBuilding />
              </div>
              <h2>Shop Login</h2>
              <p>Use the credentials provided by your admin to access the shop portal</p>
              {isShop && (
                <div style={{ marginTop: 12 }}>
                  <span className="badge badge-success" style={{ padding: '6px 12px', fontSize: 11 }}>✓ You are currently logged in as Shop Owner</span>
                  <button type="button" className="btn btn-secondary btn-sm" style={{ display: 'block', margin: '8px auto 0', fontSize: 11 }} onClick={() => navigate('/portal')}>Go to Shop Portal</button>
                </div>
              )}
            </div>

            <div className="form-group">
              <label className="form-label">Username</label>
              <input
                id="shop-username-input"
                className="form-input login-input"
                type="text"
                placeholder="e.g. downtown_electronics"
                value={shopUsername}
                onChange={(e) => setShopUsername(e.target.value)}
                autoFocus
              />
            </div>

            <div className="form-group">
              <label className="form-label">Password</label>
              <input
                id="shop-password-input"
                className="form-input login-input"
                type="password"
                placeholder="Enter your password…"
                value={shopPassword}
                onChange={(e) => setShopPassword(e.target.value)}
              />
            </div>

            <button
              id="shop-login-btn"
              className="btn btn-primary login-submit"
              type="submit"
              disabled={loading}
            >
              {loading ? (
                <span className="login-loading">
                  <span className="spinner-sm" /> Loading…
                </span>
              ) : (
                <>Sign in as Shop Owner</>
              )}
            </button>
          </form>
        )}

        <div className="login-footer">
          <p>© 2026 Manufacturing QR Inventory • v1.0</p>
        </div>
      </div>
    </div>
  );
}
