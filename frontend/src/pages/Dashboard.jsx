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
  HiOutlineExclamation,
  HiOutlineShoppingCart,
  HiOutlineInbox,
  HiOutlineTrendingUp,
  HiOutlineDownload,
  HiOutlineFire,
  HiOutlinePresentationChartLine,
} from 'react-icons/hi';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Area,
} from 'recharts';

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [chartFilter, setChartFilter] = useState('overall');
  const [chartMetric, setChartMetric] = useState('count'); // 'count' or 'revenue'

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

  const downloadCSV = () => {
    if (!data || data.recent_sales.length === 0) return;
    const headers = ['Inventory ID', 'Product', 'Serial', 'Sold At', 'Price'];
    const rows = (chartFilter === 'overall' ? data.recent_sales : data.recent_sales.filter(s => String(s.shop_id) === String(chartFilter))).map(s => [
      s.inventory_id,
      s.product_name,
      s.serial_number,
      s.sold_at,
      s.total_price
    ]);
    const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `sales_report_${chartFilter}.csv`);
    link.click();
  };

  if (loading) return <Loader />;

  if (error) {
    return (
      <div style={{ padding: 40, textAlign: 'center' }}>
        <HiOutlineExclamation style={{ fontSize: 40, color: 'var(--danger)', marginBottom: 16 }} />
        <h3>Dashboard Error</h3>
        <p>{error}</p>
        <button className="btn btn-primary" onClick={fetchDashboard}>Retry</button>
      </div>
    );
  }

  const filteredStats = (() => {
    if (chartFilter === 'overall') {
       return [
         { label: 'Total Products', value: data.total_products, icon: HiOutlineCube },
         { label: 'Sections', value: data.total_sections, icon: HiOutlineCollection },
         { label: 'Shops', value: data.total_shops, icon: HiOutlineOfficeBuilding },
         { label: 'Total Inventory', value: data.total_inventory_units, icon: HiOutlineClock },
       ];
    }
    const shop = data.stock_per_shop.find(s => s.shop_id === chartFilter);
    return [
       { label: 'Total Stock', value: (shop?.pending_stock || 0) + (shop?.sold_stock || 0), icon: HiOutlineCube },
       { label: 'Sold Units', value: shop?.sold_stock || 0, icon: HiOutlineCheckCircle },
       { label: 'Pending Units', value: shop?.pending_stock || 0, icon: HiOutlineClock },
       { label: 'Shop Branch', value: 'Active', icon: HiOutlineOfficeBuilding },
    ];
  })();

  const filteredSales = data.recent_sales.filter(s => 
    chartFilter === 'overall' || String(s.shop_id) === String(chartFilter)
  );

  const filteredAlerts = data.alerts.filter(a => 
    chartFilter === 'overall' || String(a.shop_id) === String(chartFilter)
  );

  const metricKey = chartFilter === 'overall' 
    ? (chartMetric === 'count' ? 'overall' : 'overall_revenue')
    : (chartMetric === 'count' ? chartFilter : `${chartFilter}_revenue`);

  return (
    <div className="animate-in">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <HiOutlinePresentationChartLine style={{ color: 'var(--clr-primary)' }} />
            Business Intelligence
          </h1>
          <p style={{ opacity: 0.7 }}>{chartFilter === 'overall' ? 'System-wide predictive analytics' : `Deep-dive branch report : ${data.stock_per_shop.find(s => s.shop_id === chartFilter)?.shop_name}`}</p>
        </div>
        <select 
          className="form-input" 
          style={{ width: '220px', padding: '10px 14px', borderRadius: 12, boxShadow: 'var(--shadow-sm)' }}
          value={chartFilter}
          onChange={(e) => setChartFilter(e.target.value)}
        >
          <option value="overall">All Branches (Global)</option>
          {data.stock_per_shop.map(shop => (
            <option key={shop.shop_id} value={shop.shop_id}>{shop.shop_name}</option>
          ))}
        </select>
      </div>

      {/* Stats Grid */}
      <div className="stats-grid">
        {filteredStats.map((stat, i) => (
          <div className={`stat-card stagger-${i + 1}`} key={stat.label}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
              <div>
                <div className="stat-value">{typeof stat.value === 'number' ? stat.value.toLocaleString() : stat.value}</div>
                <div className="stat-label">{stat.label}</div>
              </div>
              <div className="stat-icon" style={{ background: 'var(--clr-primary-light)', color: 'var(--clr-primary)', borderRadius: '14px' }}>
                <stat.icon />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Primary Insights Split */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 24, marginBottom: 24 }}>
        {/* Sales Trend Card */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
          <div className="card-header" style={{ borderBottom: '1px solid var(--border-main)', paddingBottom: 15 }}>
            <div>
              <h3 className="card-title">Economic Performance</h3>
              <p style={{ fontSize: 11, color: 'var(--text-light)', marginTop: 2 }}>Last 30 days historical trend</p>
            </div>
            <div className="btn-group" style={{ display: 'flex', background: 'var(--bg-app)', padding: 4, borderRadius: 10 }}>
               <button 
                className={`btn btn-sm ${chartMetric === 'count' ? 'btn-primary' : ''}`} 
                style={{ fontSize: 11, padding: '4px 12px' }}
                onClick={() => setChartMetric('count')}
               >Orders</button>
               <button 
                className={`btn btn-sm ${chartMetric === 'revenue' ? 'btn-primary' : ''}`} 
                style={{ fontSize: 11, padding: '4px 12px' }}
                onClick={() => setChartMetric('revenue')}
               >Revenue</button>
            </div>
          </div>
          <div style={{ padding: '24px 16px 16px', flex: 1 }}>
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={data.chart_data}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="date" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fill: 'var(--text-light)' }} 
                  dy={10}
                  tickFormatter={(val) => new Date(val).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: 'var(--text-light)' }} />
                <Tooltip 
                  formatter={(value) => chartMetric === 'revenue' ? `₹${value.toLocaleString()}` : value}
                  contentStyle={{ borderRadius: 12, border: 'none', boxShadow: 'var(--shadow)', fontSize: 12 }} 
                />
                <Area type="monotone" dataKey={metricKey} fill="var(--clr-primary-light)" stroke="var(--clr-primary)" />
                <Line 
                  type="monotone" 
                  dataKey={metricKey} 
                  stroke="var(--clr-primary)" 
                  strokeWidth={3} 
                  dot={{ r: 4, fill: 'white', strokeWidth: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Popularity Heatmap */}
        <div className="card">
           <div className="card-header">
              <h3 className="card-title">Top Product Velocity</h3>
              <HiOutlineFire style={{ color: '#f97316' }} />
           </div>
           <div style={{ padding: '10px 20px 20px' }}>
              {data.popularity.map((prod, i) => (
                <div key={i} style={{ marginBottom: 18 }}>
                   <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 12 }}>
                      <span style={{ fontWeight: 600 }}>{prod.name}</span>
                      <span style={{ opacity: 0.6 }}>{prod.value} units sold</span>
                   </div>
                   <div style={{ height: 10, background: 'var(--bg-app)', borderRadius: 20 }}>
                      <div style={{ 
                        height: '100%', 
                        width: `${(prod.value / data.popularity[0].value) * 100}%`, 
                        background: 'linear-gradient(90deg, var(--clr-primary), #a78bfa)', 
                        borderRadius: 20 
                      }} />
                   </div>
                </div>
              ))}
           </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 24, marginBottom: 24 }}>
        {/* Transactions list */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Real-time Transaction Shield</h3>
            <button className="btn btn-secondary btn-sm" style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11 }} onClick={downloadCSV}>
              <HiOutlineDownload /> Export CSV
            </button>
          </div>
          <div style={{ padding: '0 20px 20px' }}>
             <div style={{ maxHeight: 350, overflowY: 'auto' }}>
                {filteredSales.map((sale, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '14px 0', borderBottom: '1px solid var(--border-main)' }}>
                    <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                       <div style={{ color: 'var(--clr-primary)', background: 'var(--clr-primary-light)', padding: 10, borderRadius: 12 }}><HiOutlineShoppingCart /></div>
                       <div>
                          <div style={{ fontSize: 13, fontWeight: 700 }}>{sale.product_name}</div>
                          <div style={{ fontSize: 11, fontFamily: 'monospace', opacity: 0.6 }}>ID: {sale.serial_number?.slice(-8)}</div>
                       </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                       <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--success)' }}>₹{sale.total_price.toLocaleString()}</div>
                       <div style={{ fontSize: 10, opacity: 0.6 }}>{new Date(sale.sold_at).toLocaleString()}</div>
                    </div>
                  </div>
                ))}
             </div>
          </div>
        </div>

        {/* Predictive Stock Alerts */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Inventory Forecasting</h3>
          </div>
          <div style={{ padding: '0 20px 20px' }}>
            {filteredAlerts.length === 0 ? (
               <div style={{ padding: 60, textAlign: 'center', opacity: 0.5 }}>
                  <HiOutlineCheckCircle style={{ fontSize: 40, color: 'var(--success)', marginBottom: 12 }} />
                  <p>All stock vectors clear</p>
               </div>
            ) : (
               filteredAlerts.map((alert, i) => (
                 <div key={i} style={{ marginBottom: 16, padding: 12, borderRadius: 12, border: '1px solid var(--border-main)', background: alert.alert_type === 'out' ? 'rgba(239, 68, 68, 0.03)' : 'transparent' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                       <div style={{ fontSize: 13, fontWeight: 700 }}>{alert.product_name}</div>
                       <span className={`badge ${alert.alert_type === 'out' ? 'badge-danger' : 'badge-warning'}`}>{alert.alert_type === 'out' ? 'OUT' : 'LOW'}</span>
                    </div>
                    <div style={{ fontSize: 11, marginTop: 4, display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-light)' }}>
                       <HiOutlineOfficeBuilding /> {alert.shop_name}
                    </div>
                    <div style={{ marginTop: 8, fontSize: 12, fontWeight: 600, color: alert.alert_type === 'out' ? 'var(--danger)' : 'var(--clr-primary)', background: alert.alert_type === 'out' ? 'rgba(239,68,68,0.1)' : 'var(--clr-primary-light)', padding: '6px 12px', borderRadius: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
                       <HiOutlineTrendingUp /> {alert.forecast}
                    </div>
                 </div>
               ))
            )}
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header"><h3 className="card-title">Global Retailer Health Index</h3></div>
        <div style={{ padding: '0 20px 20px', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 20 }}>
           {data.stock_per_shop.map(shop => {
              const isActive = String(shop.shop_id) === String(chartFilter);
              const total = shop.pending_stock + shop.sold_stock;
              const pct = total > 0 ? (shop.sold_stock / total) * 100 : 0;
              return (
                <div key={shop.shop_id} style={{ padding: 16, borderRadius: 16, border: isActive ? '2px solid var(--clr-primary)' : '1px solid var(--border-main)', background: isActive ? 'rgba(99, 102, 241, 0.02)' : 'white' }}>
                   <div style={{ fontWeight: 700, marginBottom: 12 }}>{shop.shop_name}</div>
                   <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 4 }}>
                      <span>Progress</span>
                      <span>{pct.toFixed(0)}%</span>
                   </div>
                   <div style={{ height: 8, background: 'var(--bg-app)', borderRadius: 10, marginBottom: 12 }}>
                      <div style={{ height: '100%', width: `${pct}%`, background: 'var(--clr-primary)', borderRadius: 10 }} />
                   </div>
                   <div style={{ display: 'flex', gap: 20, fontSize: 11 }}>
                      <div><span style={{ opacity: 0.6 }}>Pending:</span> {shop.pending_stock}</div>
                      <div><span style={{ opacity: 0.6 }}>Sales:</span> {shop.sold_stock}</div>
                   </div>
                </div>
              )
           })}
        </div>
      </div>
    </div>
  );
}
