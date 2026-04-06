import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { getShop, getShopInventory, scanQR } from '../api/client';

/* ─────────────────────────────────────────────────────────
   Tiny helper: group items by section
───────────────────────────────────────────────────────── */
function groupBySection(sections) {
  return sections || [];
}

export default function ShopPortal() {
  const { shopId } = useParams();

  const [shop, setShop] = useState(null);
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // QR scanner
  const [token, setToken] = useState('');
  const [scanning, setScanning] = useState(false);
  const [scanResult, setScanResult] = useState(null);
  const [scanError, setScanError] = useState('');

  // product modal
  const [activeProduct, setActiveProduct] = useState(null);

  const load = useCallback(async () => {
    try {
      const [shopRes, invRes] = await Promise.all([
        getShop(shopId),
        getShopInventory(shopId),
      ]);
      setShop(shopRes.data);
      setSections(groupBySection(invRes.data.sections));
    } catch (e) {
      setError(e.response?.data?.detail || 'Shop not found');
    } finally {
      setLoading(false);
    }
  }, [shopId]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleScan(e) {
    e.preventDefault();
    if (!token.trim()) return;
    setScanning(true);
    setScanResult(null);
    setScanError('');
    try {
      const res = await scanQR(token.trim());
      setScanResult(res.data);
      setToken('');
      // Refresh inventory to reflect the sale
      const invRes = await getShopInventory(shopId);
      setSections(groupBySection(invRes.data.sections));
    } catch (err) {
      setScanError(err.response?.data?.detail || 'Invalid or already-sold token');
    } finally {
      setScanning(false);
    }
  }

  /* ── Stats ── */
  const allItems = sections.flatMap((s) => s.items || []);
  const totalUnits = allItems.length;
  const pendingUnits = allItems.filter((i) => i.status === 'pending').length;
  const soldUnits = allItems.filter((i) => i.status === 'sold').length;

  /* ── Unique products in pending stock ── */
  const productMap = {};
  allItems.filter((i) => i.status === 'pending').forEach((i) => {
    if (!productMap[i.product_id]) {
      productMap[i.product_id] = {
        product_id: i.product_id,
        product_name: i.product_name,
        total_price: i.total_price,
        count: 0,
      };
    }
    productMap[i.product_id].count += 1;
  });
  const products = Object.values(productMap);

  /* ── Loading / Error ── */
  if (loading) return <ShopLoader />;
  if (error) return <ShopError error={error} shopId={shopId} />;

  return (
    <div className="shop-portal">
      {/* ── HEADER ── */}
      <header className="shop-header">
        <div className="shop-header-inner">
          <div className="shop-brand">
            <div className="shop-brand-icon">🏪</div>
            <div>
              <h1 className="shop-brand-name">{shop.name}</h1>
              <p className="shop-brand-location">📍 {shop.location}</p>
            </div>
          </div>
          <div className="shop-header-stats">
            <div className="shop-stat">
              <span className="shop-stat-value">{pendingUnits}</span>
              <span className="shop-stat-label">In Stock</span>
            </div>
            <div className="shop-stat">
              <span className="shop-stat-value sold-color">{soldUnits}</span>
              <span className="shop-stat-label">Sold Today</span>
            </div>
            <div className="shop-stat">
              <span className="shop-stat-value">{totalUnits}</span>
              <span className="shop-stat-label">Total Units</span>
            </div>
          </div>
        </div>
        {/* Stock bar */}
        <div className="shop-stock-bar-wrap">
          <div
            className="shop-stock-bar-fill"
            style={{ width: totalUnits ? `${(soldUnits / totalUnits) * 100}%` : '0%' }}
          />
        </div>
        <p className="shop-stock-bar-label">
          {totalUnits ? Math.round((soldUnits / totalUnits) * 100) : 0}% sold
        </p>
      </header>

      <div className="shop-body">
        {/* ── LEFT: Product Catalogue ── */}
        <div className="shop-catalogue">
          <h2 className="shop-section-title">📦 Available Products</h2>

          {products.length === 0 ? (
            <div className="shop-empty">
              <div style={{ fontSize: 48, marginBottom: 12 }}>📭</div>
              <p>No products in stock at the moment.</p>
            </div>
          ) : (
            <div className="shop-product-grid">
              {products.map((p) => (
                <div
                  key={p.product_id}
                  className="shop-product-card"
                  onClick={() => setActiveProduct(p)}
                >
                  <div className="shop-product-icon">📦</div>
                  <div className="shop-product-info">
                    <div className="shop-product-name">{p.product_name}</div>
                    <div className="shop-product-id">{p.product_id}</div>
                  </div>
                  <div className="shop-product-right">
                    <div className="shop-product-price">
                      ₹{parseFloat(p.total_price).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                    <div className="shop-product-stock">
                      <span className="shop-stock-pill">{p.count} left</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ── Section breakdown ── */}
          {sections.length > 0 && (
            <div style={{ marginTop: 32 }}>
              <h2 className="shop-section-title">🗂️ Inventory by Section</h2>
              {sections.map((sec) => {
                const pending = (sec.items || []).filter((i) => i.status === 'pending').length;
                const sold = (sec.items || []).filter((i) => i.status === 'sold').length;
                const total = (sec.items || []).length;
                return (
                  <div key={sec.section_id} className="shop-section-row">
                    <div className="shop-section-row-left">
                      <span className="shop-section-row-name">{sec.section_name}</span>
                      <span className="shop-section-row-id">{sec.section_id}</span>
                    </div>
                    <div className="shop-section-row-right">
                      <span className="shop-stock-pill">{pending} pending</span>
                      <span className="shop-sold-pill">{sold} sold</span>
                    </div>
                    {total > 0 && (
                      <div className="shop-mini-bar">
                        <div
                          className="shop-mini-bar-fill"
                          style={{ width: `${(sold / total) * 100}%` }}
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ── RIGHT: QR Scanner Panel ── */}
        <div className="shop-scanner-panel">
          <div className="shop-scanner-card">
            <div className="shop-scanner-icon">📱</div>
            <h3 className="shop-scanner-title">Scan & Sell</h3>
            <p className="shop-scanner-subtitle">
              Enter the QR token from a product unit to complete the sale
            </p>

            <form onSubmit={handleScan} className="shop-scanner-form">
              <input
                className="shop-scanner-input"
                placeholder="Paste QR token here…"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                autoFocus
              />
              <button
                className="shop-scanner-btn"
                type="submit"
                disabled={scanning || !token.trim()}
              >
                {scanning ? (
                  <span className="shop-scanning-pulse">Scanning…</span>
                ) : (
                  '✓ Complete Sale'
                )}
              </button>
            </form>

            {/* Scan Success */}
            {scanResult && (
              <div className="shop-scan-result success">
                <div className="shop-result-icon">✅</div>
                <div className="shop-result-title">Sale Completed!</div>
                <div className="shop-result-rows">
                  <div className="shop-result-row">
                    <span>Product</span>
                    <span>{scanResult.product_id}</span>
                  </div>
                  <div className="shop-result-row">
                    <span>Token</span>
                    <span className="mono">{scanResult.token?.slice(0, 16)}…</span>
                  </div>
                  <div className="shop-result-row">
                    <span>Status</span>
                    <span className="sold-color" style={{ fontWeight: 700 }}>
                      {scanResult.status}
                    </span>
                  </div>
                  {scanResult.sold_at && (
                    <div className="shop-result-row">
                      <span>Time</span>
                      <span>{new Date(scanResult.sold_at).toLocaleTimeString()}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Scan Error */}
            {scanError && (
              <div className="shop-scan-result error">
                <div className="shop-result-icon">❌</div>
                <div className="shop-result-title">Scan Failed</div>
                <p className="shop-result-msg">{scanError}</p>
              </div>
            )}
          </div>

          {/* Contact */}
          {shop.contact_email && (
            <div className="shop-contact-card">
              <span style={{ opacity: 0.6 }}>📧</span>
              <a href={`mailto:${shop.contact_email}`} className="shop-contact-email">
                {shop.contact_email}
              </a>
            </div>
          )}

          {/* Admin link */}
          <a href="/" className="shop-admin-link" target="_blank" rel="noopener noreferrer">
            🔒 Admin Portal →
          </a>
        </div>
      </div>

      {/* ── Product Modal ── */}
      {activeProduct && (
        <div className="shop-modal-overlay" onClick={() => setActiveProduct(null)}>
          <div className="shop-modal" onClick={(e) => e.stopPropagation()}>
            <button className="shop-modal-close" onClick={() => setActiveProduct(null)}>
              ✕
            </button>
            <div style={{ fontSize: 52, textAlign: 'center', marginBottom: 16 }}>📦</div>
            <h2 className="shop-modal-title">{activeProduct.product_name}</h2>
            <p className="shop-modal-id">{activeProduct.product_id}</p>
            <div className="shop-modal-price">
              ₹{parseFloat(activeProduct.total_price).toLocaleString('en-IN', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </div>
            <div className="shop-modal-stock">
              <span className="shop-stock-pill" style={{ fontSize: 14, padding: '6px 16px' }}>
                {activeProduct.count} units available
              </span>
            </div>
            <button
              className="shop-scanner-btn"
              style={{ marginTop: 20 }}
              onClick={() => {
                setActiveProduct(null);
                setTimeout(() => document.querySelector('.shop-scanner-input')?.focus(), 200);
              }}
            >
              📱 Scan to Sell This Product
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Sub-components ── */
function ShopLoader() {
  return (
    <div className="shop-portal" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
      <div style={{ textAlign: 'center' }}>
        <div className="spinner" style={{ margin: '0 auto 16px' }} />
        <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>Loading shop…</p>
      </div>
    </div>
  );
}

function ShopError({ error, shopId }) {
  return (
    <div className="shop-portal" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
      <div style={{ textAlign: 'center', maxWidth: 360 }}>
        <div style={{ fontSize: 52, marginBottom: 16 }}>🏪</div>
        <h2 style={{ color: 'var(--text-primary)', marginBottom: 8 }}>Shop Not Found</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 20 }}>
          No shop found with ID <code style={{ color: 'var(--accent-primary)', fontFamily: 'var(--font-mono)' }}>{shopId}</code>
        </p>
        <p style={{ color: 'var(--danger)', fontSize: 12 }}>{error}</p>
      </div>
    </div>
  );
}
