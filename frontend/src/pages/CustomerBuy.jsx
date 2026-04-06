import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { getCustomerProduct, customerBuy } from '../api/client';
import { 
  HiOutlineCube, 
  HiOutlineShoppingBag, 
  HiOutlineCheckCircle, 
  HiOutlineXCircle, 
  HiOutlineSparkles 
} from 'react-icons/hi';

export default function CustomerBuy() {
  const { token } = useParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [buying, setBuying] = useState(false);
  const [bought, setBought] = useState(null);

  useEffect(() => {
    fetchProduct();
  }, [token]);

  async function fetchProduct() {
    setLoading(true);
    setError('');
    try {
      const res = await getCustomerProduct(token);
      setProduct(res.data);
    } catch (err) {
      setError(err.response?.data?.detail || 'Product not found');
    } finally {
      setLoading(false);
    }
  }

  async function handleBuy() {
    setBuying(true);
    try {
      const res = await customerBuy(token);
      setBought(res.data);
    } catch (err) {
      setError(err.response?.data?.detail || 'Purchase failed');
    } finally {
      setBuying(false);
    }
  }

  return (
    <div className="customer-page">
      <div className="customer-container animate-in">
        {/* Brand */}
        <div className="customer-brand">
          Manufacturing
        </div>

        {loading && (
          <div className="customer-card">
            <div style={{ textAlign: 'center', padding: 40 }}>
              <div className="spinner" style={{ margin: '0 auto 16px' }} />
              <p>Fetching details…</p>
            </div>
          </div>
        )}

        {error && !bought && (
          <div className="customer-card">
            <div style={{ textAlign: 'center', padding: 40 }}>
              <HiOutlineXCircle style={{ fontSize: 48, color: 'var(--danger)', marginBottom: 16 }} />
              <h2 style={{ marginBottom: 8 }}>Unable to find product</h2>
              <p style={{ color: 'var(--text-light)' }}>{error}</p>
            </div>
          </div>
        )}

        {/* Product Details */}
        {product && !bought && !error && (
          <div className="customer-card">
            <div style={{ textAlign: 'center', marginBottom: 24 }}>
              <div style={{ 
                width: 64, height: 64, background: 'var(--clr-primary-light)', color: 'var(--clr-primary)',
                borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 16px', fontSize: 32
              }}>
                <HiOutlineCube />
              </div>
              <h1 className="customer-product-name">{product.product_name}</h1>
              <p className="customer-product-id">ID: {product.product_id}</p>
            </div>

            <div className="customer-price">
              ₹{product.total_price.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </div>

            <div style={{ paddingBottom: 24, marginBottom: 24, borderBottom: '1px solid var(--border-main)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, justifyContent: 'center' }}>
                <HiOutlineShoppingBag style={{ color: 'var(--clr-primary)', fontSize: 20 }} />
                <div style={{ textAlign: 'left' }}>
                  <div style={{ fontSize: 13, fontWeight: 700 }}>{product.shop_name}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-light)' }}>{product.shop_location}</div>
                </div>
              </div>
            </div>

            {product.status === 'available' ? (
              <button
                id="buy-now-btn"
                className="customer-buy-btn"
                onClick={handleBuy}
                disabled={buying}
              >
                {buying ? (
                  <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                    <span className="spinner-sm" style={{ borderColor: 'rgba(255,255,255,0.3)', borderTopColor: 'white' }} /> Processing…
                  </span>
                ) : (
                  <>Confirm Purchase</>
                )}
              </button>
            ) : (
              <div style={{ 
                background: 'var(--warning-bg)', color: 'var(--warning)', padding: 16, 
                borderRadius: 8, fontSize: 13, fontWeight: 600, display: 'flex', gap: 8, alignItems: 'center', justifyContent: 'center'
              }}>
                <HiOutlineCheckCircle /> Product Already Sold
              </div>
            )}
          </div>
        )}

        {/* Success Screen */}
        {bought && (
          <div className="customer-card">
            <div style={{ textAlign: 'center' }}>
              <HiOutlineSparkles style={{ fontSize: 56, color: 'var(--clr-primary)', marginBottom: 16 }} />
              <h1 style={{ fontSize: 24, fontWeight: 800, color: 'var(--success)', marginBottom: 8 }}>
                Congratulations!
              </h1>
              <p style={{ color: 'var(--text-light)', marginBottom: 24 }}>
                {bought.message || 'The product has been successfully purchased.'}
              </p>

              <div style={{ border: '1px solid var(--border-main)', borderRadius: 12, overflow: 'hidden', textAlign: 'left' }}>
                {[
                  { l: 'Product', v: bought.product_name },
                  { l: 'Serial', v: bought.serial_number?.slice(-12).toUpperCase(), m: true },
                  { l: 'Shop', v: bought.shop_name },
                  { l: 'Amount', v: `₹${bought.total_price?.toLocaleString('en-IN')}`, s: true }
                ].map((row, i) => (
                  <div key={i} style={{ 
                    display: 'flex', justifyContent: 'space-between', padding: '12px 16px',
                    borderBottom: i < 3 ? '1px solid var(--border-main)' : 'none',
                    fontSize: 13
                  }}>
                    <span style={{ color: 'var(--text-light)' }}>{row.l}</span>
                    <span style={{ 
                      fontWeight: row.s ? 700 : 600, 
                      color: row.s ? 'var(--success)' : 'var(--text-main)',
                      fontFamily: row.m ? 'var(--font-mono)' : 'inherit'
                    }}>
                      {row.v}
                    </span>
                  </div>
                ))}
              </div>
              <p style={{ fontSize: 11, color: 'var(--text-light)', marginTop: 20 }}>
                Transaction ID: #{Math.random().toString(36).substr(2, 9).toUpperCase()}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
