import { useState } from 'react';
import { scanQR } from '../api/client';
import { HiOutlineQrcode, HiOutlineSearch, HiOutlineCheckCircle, HiOutlineXCircle } from 'react-icons/hi';

export default function QRScanner() {
  const [token, setToken] = useState('');
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  async function handleScan(e) {
    e.preventDefault();
    if (!token.trim()) return;
    setScanning(true);
    setResult(null);
    setError('');
    try {
      const res = await scanQR(token.trim());
      setResult(res.data);
    } catch (err) {
      setError(err.response?.data?.detail || 'Scan failed');
    } finally {
      setScanning(false);
    }
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>QR Scanner</h1>
          <p>Verify and complete product sales manually via token entry.</p>
        </div>
      </div>

      <div style={{ maxWidth: 480, margin: '40px auto 0' }}>
        <div className="card animate-in">
          <div style={{ padding: 40, textAlign: 'center' }}>
            <div style={{ 
              width: 80, height: 80, background: 'var(--clr-primary-light)', color: 'var(--clr-primary)',
              borderRadius: 20, display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 20px', fontSize: 40
            }}>
              <HiOutlineQrcode />
            </div>
            <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>Manual Verification</h2>
            <p style={{ fontSize: 13, color: 'var(--text-light)', marginBottom: 32 }}>
              Enter the unique 16-character QR token provided on the product label.
            </p>

            <form onSubmit={handleScan}>
              <div className="form-group">
                <input
                  className="form-input"
                  placeholder="e.g. a1b2c3d4e5f6g7h8"
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  autoFocus
                  style={{ 
                    textAlign: 'center', fontSize: 18, fontWeight: 600, 
                    letterSpacing: '0.1em', fontFamily: 'var(--font-mono)', padding: '14px' 
                  }}
                />
              </div>
              <button
                className="btn btn-primary"
                type="submit"
                disabled={scanning}
                style={{ width: '100%', padding: '14px' }}
              >
                {scanning ? (
                  <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span className="spinner-sm" style={{ borderColor: 'rgba(255,255,255,0.3)', borderTopColor: 'white' }} /> Verifying…
                  </span>
                ) : (
                  <>Process Sale</>
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Success Result */}
        {result && (
          <div className="card animate-in" style={{ marginTop: 24, borderLeft: '4px solid var(--success)' }}>
            <div style={{ padding: 24 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
                <HiOutlineCheckCircle style={{ fontSize: 24, color: 'var(--success)' }} />
                <div>
                  <div style={{ fontWeight: 700, color: 'var(--success)' }}>Sale Successfully Processed</div>
                  <div style={{ fontSize: 12, color: 'var(--text-light)' }}>{result.message}</div>
                </div>
              </div>

              <div style={{ border: '1px solid var(--border-main)', borderRadius: 8, overflow: 'hidden' }}>
                {[
                  { l: 'Product', v: result.product_id },
                  { l: 'Serial', v: result.inventory_id?.slice(-12).toUpperCase(), m: true },
                  { l: 'Status', v: result.status, b: 'badge-success' },
                  { l: 'Processed At', v: new Date(result.sold_at).toLocaleString() }
                ].map((row, i) => (
                  <div key={i} style={{ 
                    display: 'flex', justifyContent: 'space-between', padding: '12px 16px',
                    borderBottom: i < 3 ? '1px solid var(--border-main)' : 'none',
                    fontSize: 13
                  }}>
                    <span style={{ color: 'var(--text-light)' }}>{row.l}</span>
                    {row.b ? (
                      <span className={`badge ${row.b}`}>{row.v}</span>
                    ) : (
                      <span style={{ fontWeight: 600, fontFamily: row.m ? 'var(--font-mono)' : 'inherit' }}>{row.v}</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Error Result */}
        {error && !result && (
          <div className="card animate-in" style={{ marginTop: 24, borderLeft: '4px solid var(--danger)' }}>
            <div style={{ padding: 20, display: 'flex', alignItems: 'center', gap: 12 }}>
              <HiOutlineXCircle style={{ fontSize: 24, color: 'var(--danger)' }} />
              <div>
                <div style={{ fontWeight: 700, color: 'var(--danger)' }}>Process Failed</div>
                <div style={{ fontSize: 13, color: 'var(--text-light)' }}>{error}</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
