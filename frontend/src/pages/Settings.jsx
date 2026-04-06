import { useState } from 'react';
import { HiOutlineKey, HiOutlineGlobeAlt, HiOutlineInformationCircle } from 'react-icons/hi';

export default function Settings() {
  const [token, setToken] = useState(localStorage.getItem('admin_token') || '');

  function handleSave() {
    if (token.trim()) {
      localStorage.setItem('admin_token', token.trim());
      alert('Admin token updated');
    } else {
      localStorage.removeItem('admin_token');
      alert('Admin token cleared');
    }
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>System Settings</h1>
          <p>Configure backend connectivity and authentication overrides.</p>
        </div>
      </div>

      <div style={{ maxWidth: 560 }}>
        <div className="card animate-in">
          <div className="card-header" style={{ padding: '16px 20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <HiOutlineKey style={{ color: 'var(--clr-primary)' }} />
              <h3 className="card-title">Admin Authorization</h3>
            </div>
          </div>
          <div style={{ padding: 20 }}>
            <p style={{ fontSize: 13, color: 'var(--text-light)', marginBottom: 20 }}>
              Secure operations like product creation require a validated admin token. 
              The system uses <code style={{ color: 'var(--clr-primary)', fontWeight: 700 }}>X-Admin-Token</code> for these requests.
            </p>
            <div className="form-group">
              <label className="form-label">Active Admin Token</label>
              <input
                className="form-input"
                type="password"
                placeholder="Enter validation token"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                style={{ fontFamily: 'var(--font-mono)', fontSize: 13 }}
              />
            </div>
            <button className="btn btn-primary" onClick={handleSave} style={{ width: '100%' }}>
              Sync Authentication
            </button>
          </div>
        </div>

        <div className="card animate-in stagger-2" style={{ marginTop: 24 }}>
          <div className="card-header" style={{ padding: '16px 20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <HiOutlineGlobeAlt style={{ color: 'var(--clr-primary)' }} />
              <h3 className="card-title">Network Interface</h3>
            </div>
          </div>
          <div style={{ padding: 20 }}>
            <div style={{ 
              display: 'flex', gap: 12, padding: 16, background: '#f8fafc', 
              borderRadius: 12, border: '1px solid var(--border-main)', marginBottom: 20 
            }}>
              <HiOutlineInformationCircle style={{ fontSize: 20, color: 'var(--clr-primary)', flexShrink: 0 }} />
              <div>
                <div style={{ fontSize: 12, color: 'var(--text-light)', marginBottom: 4 }}>Connected API Endpoint</div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 14, fontWeight: 700, color: 'var(--text-main)' }}>
                  {import.meta.env.VITE_API_URL || 'http://localhost:8000'}
                </div>
              </div>
            </div>
            <p style={{ fontSize: 11, color: 'var(--text-light)', lineHeight: 1.5 }}>
              To update this endpoint, modify the <code style={{ fontWeight: 700 }}>VITE_API_URL</code> environment variable in your production deployment configuration.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
