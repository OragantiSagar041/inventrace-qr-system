import { useState } from 'react';
import { scanQR } from '../../api/client';
import { 
  HiOutlineQrcode, 
  HiOutlineCheckCircle, 
  HiOutlineDeviceMobile,
  HiOutlineTerminal
} from 'react-icons/hi';

export default function ShopScanner() {
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
      setToken('');
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
          <h1>Process Sale</h1>
          <p>Mark product units as sold by verifying their unique QR tokens.</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        {/* Scanner Input */}
        <div className="card animate-in">
          <div className="card-header">
            <h3 className="card-title">Token Entry</h3>
          </div>

          <div style={{ padding: 24 }}>
            <div style={{ 
              width: 56, height: 56, background: 'var(--clr-primary-light)', color: 'var(--clr-primary)',
              borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center',
              marginBottom: 16, fontSize: 28
            }}>
              <HiOutlineTerminal />
            </div>
            <p style={{ fontSize: 13, color: 'var(--text-light)', marginBottom: 24 }}>
              Enter the unique token printed on the product sticker to authorize the transaction.
            </p>

            <form onSubmit={handleScan}>
              <div className="form-group">
                <input
                  className="form-input"
                  autofocus
                  placeholder="Paste or type token…"
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  style={{ fontFamily: 'var(--font-mono)', fontSize: 13 }}
                />
              </div>
              <button
                className="btn btn-primary"
                type="submit"
                disabled={scanning || !token.trim()}
                style={{ width: '100%', padding: '12px' }}
              >
                {scanning ? 'Processing…' : 'Finalize Sale'}
              </button>
            </form>
            {error && (
              <p style={{ marginTop: 12, color: 'var(--danger)', fontSize: 12, textAlign: 'center' }}>
                {error}
              </p>
            )}
          </div>
        </div>

        {/* Result */}
        <div className="card animate-in stagger-2">
          <div className="card-header">
            <h3 className="card-title">Last Scan Details</h3>
          </div>

          {!result ? (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-light)' }}>
              <HiOutlineDeviceMobile style={{ fontSize: 40, marginBottom: 12, opacity: 0.3 }} />
              <p style={{ fontSize: 13 }}>Waiting for active scan…</p>
            </div>
          ) : (
            <div style={{ padding: 24 }}>
              <div style={{
                textAlign: 'center', padding: 20, background: 'var(--success-bg)',
                borderRadius: 12, border: '1px solid var(--success-border)', marginBottom: 24,
              }}>
                <HiOutlineCheckCircle style={{ fontSize: 32, color: 'var(--success)', marginBottom: 8 }} />
                <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--success)' }}>Transaction Successful</div>
              </div>

              <div style={{ border: '1px solid var(--border-main)', borderRadius: 12, overflow: 'hidden' }}>
                {[
                  { label: 'Product Name', value: result.product_id },
                  { label: 'Serial No', value: result.inventory_id?.slice(-12).toUpperCase(), m: true },
                  { label: 'Status', value: result.status, b: 'badge-success' },
                  { label: 'Timestamp', value: result.sold_at ? new Date(result.sold_at).toLocaleString() : 'Just now' },
                ].map(({ label, value, m, b }, i) => (
                  <div key={i} style={{
                    display: 'flex', justifyContent: 'space-between', padding: '12px 16px',
                    borderBottom: i < 3 ? '1px solid var(--border-main)' : 'none',
                    fontSize: 13
                  }}>
                    <span style={{ color: 'var(--text-light)' }}>{label}</span>
                    {b ? (
                      <span className={`badge ${b}`}>{value}</span>
                    ) : ( 
                      <span style={{ fontWeight: 600, fontFamily: m ? 'var(--font-mono)' : 'inherit' }}>
                        {value}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
