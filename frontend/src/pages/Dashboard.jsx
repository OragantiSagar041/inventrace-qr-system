import { useEffect, useState } from 'react';
import { getDashboard } from '../api/client';
import { Loader } from '../components/Shared';
import {
  HiOutlineCube,
  HiOutlineCollection,
  HiOutlineOfficeBuilding,
  HiOutlineClipboardList,
  HiOutlineCheckCircle,
  HiOutlineClock,
} from 'react-icons/hi';

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchDashboard();
  }, []);

  async function fetchDashboard() {
    setLoading(true);
    try {
      const res = await getDashboard();
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
          <h1>Dashboard</h1>
          <p>Admin overview of your manufacturing inventory</p>
        </div>
        <div className="card">
          <div className="empty-state" style={{ padding: 40, textAlign: 'center' }}>
            <HiOutlineExclamation style={{ fontSize: 40, color: 'var(--danger)', marginBottom: 16 }} />
            <h3>Connection Error</h3>
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
      label: 'Total Products',
      value: data.total_products,
      icon: HiOutlineCube,
      gradient: 'var(--gradient-primary)',
      bg: 'rgba(99,102,241,0.12)',
      color: '#818cf8',
    },
    {
      label: 'Sections',
      value: data.total_sections,
      icon: HiOutlineCollection,
      gradient: 'var(--gradient-cyan)',
      bg: 'var(--cyan-bg)',
      color: 'var(--cyan)',
    },
    {
      label: 'Shops',
      value: data.total_shops,
      icon: HiOutlineOfficeBuilding,
      gradient: 'var(--gradient-warning)',
      bg: 'var(--warning-bg)',
      color: 'var(--warning)',
    },
    {
      label: 'Total Inventory',
      value: data.total_inventory_units,
      icon: HiOutlineClipboardList,
      gradient: 'var(--gradient-info)',
      bg: 'var(--info-bg)',
      color: 'var(--info)',
    },
    {
      label: 'Sold Units',
      value: data.sold_units,
      icon: HiOutlineCheckCircle,
      gradient: 'var(--gradient-success)',
      bg: 'var(--success-bg)',
      color: 'var(--success)',
    },
    {
      label: 'Pending Units',
      value: data.pending_units,
      icon: HiOutlineClock,
      gradient: 'var(--gradient-danger)',
      bg: 'var(--danger-bg)',
      color: 'var(--danger)',
    },
  ];

  const soldPercent =
    data.total_inventory_units > 0
      ? Math.round((data.sold_units / data.total_inventory_units) * 100)
      : 0;

  return (
    <div>
      <div className="page-header">
        <h1>Dashboard</h1>
        <p>Admin overview of your manufacturing inventory</p>
      </div>

      {/* Stats Grid */}
      <div className="stats-grid">
        {stats.map((stat, i) => (
          <div
            className={`stat-card animate-in stagger-${i + 1}`}
            key={stat.label}
          >
            <div className="stat-card-header">
              <div>
                <div className="stat-value">{stat.value.toLocaleString()}</div>
                <div className="stat-label">{stat.label}</div>
              </div>
              <div className="stat-icon" style={{ background: 'var(--clr-primary-light)', color: 'var(--clr-primary)' }}>
                <stat.icon />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Two Column Layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        {/* Stock Per Shop */}
        <div className="card animate-in" style={{ animationDelay: '350ms' }}>
          <div className="card-header">
            <h3 className="card-title">Stock Per Shop</h3>
          </div>
          {data.stock_per_shop.length === 0 ? (
            <div style={{ color: 'var(--text-muted)', fontSize: 13, textAlign: 'center', padding: 20 }}>
              No shops registered yet
            </div>
          ) : (
            data.stock_per_shop.map((shop) => {
              const total = shop.pending_stock + shop.sold_stock;
              const pct = total > 0 ? Math.round((shop.sold_stock / total) * 100) : 0;
              return (
                <div key={shop.shop_id} style={{ marginBottom: 16 }}>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      marginBottom: 6,
                      fontSize: 13,
                    }}
                  >
                    <span style={{ fontWeight: 600-0, color: 'var(--text-primary)' }}>
                      {shop.shop_name}
                    </span>
                    <span style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontSize: 12 }}>
                      {shop.sold_stock}/{total} sold
                    </span>
                  </div>
                  <div
                    style={{
                      height: 6,
                      background: 'var(--bg-glass)',
                      borderRadius: 'var(--radius-full)',
                      overflow: 'hidden',
                    }}
                  >
                    <div
                      style={{
                        height: '100%',
                        width: `${pct}%`,
                        background: 'var(--gradient-success)',
                        borderRadius: 'var(--radius-full)',
                        transition: 'width 1s ease',
                      }}
                    />
                  </div>
                </div>
              );
            })
          )}
          {data.total_inventory_units > 0 && (
            <div
              style={{
                marginTop: 12,
                padding: '12px 16px',
                background: 'var(--bg-glass)',
                borderRadius: 'var(--radius-md)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Overall Completion</span>
              <span
                style={{
                  fontSize: 18,
                  fontWeight: 800,
                  fontFamily: 'var(--font-mono)',
                  color: 'var(--success)',
                }}
              >
                {soldPercent}%
              </span>
            </div>
          )}
        </div>

        {/* Alerts */}
        <div className="card animate-in" style={{ animationDelay: '400ms' }}>
          <div className="card-header">
            <h3 className="card-title">Stock Alerts</h3>
            {data.alerts.length > 0 && (
              <span className="badge badge-danger">{data.alerts.length}</span>
            )}
          </div>
          {data.alerts.length === 0 ? (
            <div style={{ color: 'var(--text-light)', fontSize: 13, textAlign: 'center', padding: 20 }}>
              <HiOutlineCheckCircle style={{ color: 'var(--success)', fontSize: 24, display: 'block', margin: '0 auto 8px' }} />
              All stock levels healthy
            </div>
          ) : (
            data.alerts.map((alert, i) => (
              <div className="alert-row" key={i}>
                <div className={`alert-dot ${alert.alert_type}`} />
                <div className="alert-info">
                  <div className="alert-shop">{alert.shop_name}</div>
                  <div className="alert-product">{alert.product_name}</div>
                </div>
                <span
                  className={`badge ${alert.alert_type === 'out' ? 'badge-danger' : 'badge-warning'}`}
                >
                  {alert.alert_type === 'out' ? 'Out of Stock' : `Low (${alert.available_stock})`}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
