import { useEffect, useState } from 'react';
import { getShopPortalDashboard } from '../../api/client';
import { Loader } from '../../components/Shared';
import {
  HiOutlineCube,
  HiOutlineClipboardList,
  HiOutlineCheckCircle,
  HiOutlineClock,
  HiOutlineCurrencyRupee,
  HiOutlineShoppingCart,
  HiOutlineExclamation,
  HiOutlineInbox,
} from 'react-icons/hi';

export default function ShopDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchDashboard();
  }, []);

  async function fetchDashboard() {
    setLoading(true);
    try {
      const res = await getShopPortalDashboard();
      setData(res.data);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  }

  if (loading) return <Loader />;

  if (error) {
    return (
      <div>
        <div className="page-header">
          <h1>Shop Dashboard</h1>
          <p>Overview of your shop inventory</p>
        </div>
        <div className="card">
          <div style={{ padding: 40, textAlign: 'center' }}>
            <HiOutlineExclamation style={{ fontSize: 40, color: 'var(--danger)', marginBottom: 16 }} />
            <h3>Error</h3>
            <p>{error}</p>
            <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={fetchDashboard}>
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  const stats = [
    {
      label: 'Products',
      value: data.total_products,
      icon: HiOutlineCube,
    },
    {
      label: 'Stock Units',
      value: data.total_stock,
      icon: HiOutlineClipboardList,
    },
    {
      label: 'Units in Sales',
      value: data.pending_units,
      icon: HiOutlineClock,
    },
    {
      label: 'Sold Items',
      value: data.sold_units,
      icon: HiOutlineCheckCircle,
    },
    {
      label: 'Total Revenue',
      value: `₹${data.total_revenue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`,
      icon: HiOutlineCurrencyRupee,
    },
  ];

  const soldPercent =
    data.total_stock > 0 ? Math.round((data.sold_units / data.total_stock) * 100) : 0;

  return (
    <div>
      <div className="page-header">
        <h1>Dashboard</h1>
        <p>Welcome, {data.shop_name} — {data.location}</p>
      </div>

      {/* Stats Grid */}
      <div className="stats-grid">
        {stats.map((stat, i) => (
          <div className={`stat-card animate-in stagger-${i + 1}`} key={stat.label}>
            <div className="stat-card-header">
              <div>
                <div className="stat-value">{typeof stat.value === 'number' ? stat.value.toLocaleString() : stat.value}</div>
                <div className="stat-label">{stat.label}</div>
              </div>
              <div className="stat-icon" style={{ background: 'var(--clr-primary-light)', color: 'var(--clr-primary)' }}>
                <stat.icon />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Progress + Recent Sales */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        {/* Sales Progress */}
        <div className="card animate-in" style={{ animationDelay: '350ms' }}>
          <div className="card-header">
            <h3 className="card-title">Sales Performance</h3>
          </div>
          <div style={{ padding: 24, textAlign: 'center' }}>
            <div style={{ fontSize: 40, fontWeight: 700, color: 'var(--clr-primary)' }}>
              {soldPercent}%
            </div>
            <p style={{ fontSize: 13, color: 'var(--text-light)', marginTop: 4 }}>
              {data.sold_units} / {data.total_stock} Units Sold
            </p>
            <div style={{ height: 8, background: 'var(--bg-muted)', borderRadius: 10, margin: '20px 0', overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${soldPercent}%`, background: 'var(--clr-primary)', borderRadius: 10, transition: 'width 1s ease' }} />
            </div>
          </div>
        </div>

        {/* Recent Sales */}
        <div className="card animate-in" style={{ animationDelay: '400ms' }}>
          <div className="card-header">
            <h3 className="card-title">Recent Transactions</h3>
            {data.recent_sales.length > 0 && (
              <span className="badge badge-success">{data.recent_sales.length}</span>
            )}
          </div>
          <div style={{ padding: '0 20px' }}>
            {data.recent_sales.length === 0 ? (
              <div style={{ color: 'var(--text-light)', fontSize: 13, textAlign: 'center', padding: 40 }}>
                <HiOutlineInbox style={{ fontSize: 32, marginBottom: 8, opacity: 0.5 }} />
                <p>No transactions yet</p>
              </div>
            ) : (
              <div style={{ maxHeight: 300, overflowY: 'auto' }}>
                {data.recent_sales.map((sale, i) => (
                  <div key={sale.inventory_id || i} style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '12px 0', borderBottom: '1px solid var(--border-main)',
                  }}>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-main)' }}>
                        {sale.product_name}
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--text-light)', fontFamily: 'var(--font-mono)' }}>
                        #{sale.serial_number?.slice(-8)}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--success)' }}>
                        ₹{sale.total_price?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </div>
                      <div style={{ fontSize: 10, color: 'var(--text-light)' }}>
                        {sale.sold_at ? new Date(sale.sold_at).toLocaleDateString() : '—'}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
