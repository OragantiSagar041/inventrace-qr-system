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
  HiOutlineTrendingUp,
} from 'react-icons/hi';

import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';

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

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Dashboard</h1>
          <p>Welcome, {data.shop_name} — {data.location}</p>
        </div>
      </div>

      {/* Out of Stock Alerts */}
      {data.alerts && data.alerts.length > 0 && (
        <div className="card animate-in" style={{ 
          marginBottom: 24, 
          background: 'var(--danger-bg)', 
          borderColor: 'var(--danger)', 
          padding: '16px 20px', 
          display: 'flex', 
          flexDirection: 'column',
          gap: 12
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ 
              width: 36, 
              height: 36, 
              borderRadius: '50%', 
              background: 'var(--danger)', 
              color: 'white', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              fontSize: 20,
              flexShrink: 0
            }}>
              <HiOutlineExclamation />
            </div>
            <h4 style={{ color: 'var(--danger)', fontWeight: 700, fontSize: 15 }}>Inventory Alert: Action Required</h4>
          </div>
          
          <div style={{ paddingLeft: 52 }}>
            <p style={{ color: '#b91c1c', fontSize: 13, marginBottom: 8 }}>
              The following products are currently <strong>Out of Stock</strong> at your location:
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {data.alerts.map((a, i) => (
                <div key={i} style={{ 
                  background: 'rgba(239, 68, 68, 0.05)', 
                  padding: '10px 14px', 
                  borderRadius: 8, 
                  border: '1px dashed rgba(239, 68, 68, 0.3)' 
                }}>
                  <div style={{ fontWeight: 700, color: 'var(--danger)', fontSize: 14 }}>
                    {a.product_name}
                  </div>
                  {a.available_at && a.available_at.length > 0 ? (
                    <div style={{ fontSize: 11, color: '#7f1d1d', marginTop: 4, display: 'flex', gap: 6, alignItems: 'center' }}>
                      <span style={{ opacity: 0.7 }}>Available at:</span>
                      <span style={{ fontWeight: 600 }}>{a.available_at.join(' • ')}</span>
                    </div>
                  ) : (
                    <div style={{ fontSize: 11, color: '#7f1d1d', marginTop: 4, opacity: 0.7 }}>
                      Not available at any locations.
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Stats Grid */}
      <div className="stats-grid">
        {stats.map((stat, i) => (
          <div className={`stat-card animate-in stagger-${i + 1}`} key={stat.label}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
              <div>
                <div className="stat-value" style={{ fontSize: 20 }}>{typeof stat.value === 'number' ? stat.value.toLocaleString() : stat.value}</div>
                <div className="stat-label">{stat.label}</div>
              </div>
              <div className="stat-icon" style={{ background: 'var(--clr-primary-light)', color: 'var(--clr-primary)' }}>
                <stat.icon />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Chart + Recent Sales */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 24 }}>
        {/* Sales Chart */}
        <div className="card animate-in" style={{ animationDelay: '350ms', display: 'flex', flexDirection: 'column' }}>
          <div className="card-header">
            <h3 className="card-title">Daily Sales Performance</h3>
            <span className="badge badge-info">Last 7 Days</span>
          </div>
          <div style={{ padding: '24px 16px 16px', flex: 1, minHeight: 300 }}>
            {data.daily_sales.length === 0 ? (
              <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyItems: 'center', flexDirection: 'column', padding: 40, opacity: 0.5 }}>
                 <HiOutlineTrendingUp style={{ fontSize: 40, marginBottom: 12 }} />
                 <p>No sales data to visualize yet</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={data.daily_sales}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis 
                    dataKey="date" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 12, fill: 'var(--text-light)' }} 
                    dy={10}
                    tickFormatter={(val) => new Date(val).toLocaleDateString(undefined, { weekday: 'short' })}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 12, fill: 'var(--text-light)' }} 
                  />
                  <Tooltip 
                    contentStyle={{ 
                      borderRadius: '8px', 
                      border: '1px solid var(--border-main)', 
                      boxShadow: 'var(--shadow)',
                      fontSize: '13px'
                    }} 
                  />
                  <Line 
                    type="monotone" 
                    dataKey="count" 
                    name="Orders"
                    stroke="var(--clr-primary)" 
                    strokeWidth={3} 
                    dot={{ r: 4, strokeWidth: 2, fill: 'white' }}
                    activeDot={{ r: 6, strokeWidth: 0 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Recent Transactions */}
        <div className="card animate-in" style={{ animationDelay: '400ms' }}>
          <div className="card-header">
            <h3 className="card-title">Recent Transactions</h3>
            {data.recent_sales.length > 0 && (
              <span className="badge badge-success">{data.recent_sales.length}</span>
            )}
          </div>
          <div style={{ padding: '8px 20px' }}>
            {data.recent_sales.length === 0 ? (
              <div style={{ color: 'var(--text-light)', fontSize: 13, textAlign: 'center', padding: 40 }}>
                <HiOutlineInbox style={{ fontSize: 32, marginBottom: 8, opacity: 0.5 }} />
                <p>No transactions yet</p>
              </div>
            ) : (
              <div style={{ maxHeight: 310, overflowY: 'auto' }}>
                {data.recent_sales.map((sale, i) => (
                  <div key={sale.inventory_id || i} style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '12px 0', borderBottom: '1px solid var(--border-main)',
                  }}>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: 6 }}>
                        <HiOutlineShoppingCart style={{ color: 'var(--clr-primary)' }} />
                        {sale.product_name}
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--text-light)', fontFamily: 'var(--font-mono)', marginTop: 2 }}>
                        #{sale.serial_number?.slice(-8)}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--success)' }}>
                        ₹{sale.total_price?.toLocaleString('en-IN')}
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
