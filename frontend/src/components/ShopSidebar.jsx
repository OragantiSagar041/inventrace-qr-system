import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  HiOutlineViewGrid,
  HiOutlineClipboardList,
  HiOutlineQrcode,
  HiOutlineChartBar,
  HiOutlineLogout,
  HiOutlineShoppingBag,
  HiOutlinePlus
} from 'react-icons/hi';
import { useState } from 'react';

const navItems = [
  { label: 'Dashboard', path: '/portal', icon: HiOutlineViewGrid, end: true },
  { label: 'Inventory', path: '/portal/inventory', icon: HiOutlineClipboardList, group: 'Manage' },
  { label: 'QR Scanner', path: '/portal/scanner', icon: HiOutlineQrcode, group: 'Operations' },
  { label: 'Sales History', path: '/portal/sales', icon: HiOutlineChartBar },
];

export default function ShopSidebar() {
  const { auth, logout, switchShop } = useAuth();
  const navigate = useNavigate();
  const shopInfo = auth.shop?.info || {};
  const allShops = auth.shops || [];
  
  const [showShopSelector, setShowShopSelector] = useState(false);
  let lastGroup = null;

  const handleLogoutCurrentShop = () => {
    logout('shop', shopInfo.shop_id);
    if (allShops.length <= 1) {
       navigate('/login');
    }
  };

  return (
    <aside className="sidebar" id="shop-sidebar">
      <div className="sidebar-header" style={{ flexDirection: 'column', alignItems: 'stretch', gap: '8px', position: 'relative' }}>
        <div 
          onClick={() => setShowShopSelector(!showShopSelector)}
          style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', padding: '4px', borderRadius: '8px' }}
          className="hover-bg-muted"
        >
          <div className="sidebar-logo">
            <HiOutlineShoppingBag />
          </div>
          <div style={{ flex: 1, overflow: 'hidden' }}>
            <div className="sidebar-title" style={{ whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
              {shopInfo.shop_name || 'Shop Portal'}
            </div>
            <div className="sidebar-subtitle" style={{ whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
              {shopInfo.location || 'Shop Management'}
            </div>
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-light)' }}>
            ▼
          </div>
        </div>

        {showShopSelector && (
          <div 
            style={{ 
              position: 'absolute', top: '100%', left: '10px', right: '10px', 
              background: 'white', border: '1px solid var(--border-main)', 
              borderRadius: 'var(--radius)', boxShadow: 'var(--shadow)', 
              zIndex: 100, overflow: 'hidden' 
            }}
          >
            <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
              {allShops.map((s, idx) => (
                <div 
                  key={s.info.shop_id || idx}
                  onClick={() => { switchShop(s.info.shop_id); setShowShopSelector(false); }}
                  style={{ 
                    padding: '10px 12px', cursor: 'pointer', borderBottom: '1px solid var(--border-main)',
                    background: s.info.shop_id === shopInfo.shop_id ? 'var(--bg-muted)' : '',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                  }}
                >
                  <div style={{ overflow: 'hidden' }}>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-main)', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                      {s.info.shop_name}
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--text-light)', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                      {s.info.location}
                    </div>
                  </div>
                  {s.info.shop_id === shopInfo.shop_id && (
                    <div style={{ color: 'var(--clr-primary)', fontSize: '12px', fontWeight: 600 }}>✓</div>
                  )}
                </div>
              ))}
            </div>
            <div 
              onClick={() => { navigate('/login'); setShowShopSelector(false); }}
              style={{ padding: '10px 12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--clr-primary)', fontSize: '13px', fontWeight: 500 }}
            >
              <HiOutlinePlus /> Add another shop
            </div>
          </div>
        )}
      </div>

      <nav className="sidebar-nav">
        {navItems.map((item) => {
          const showGroup = item.group && item.group !== lastGroup;
          if (item.group) lastGroup = item.group;

          return (
            <div key={item.path}>
              {showGroup && <div className="nav-label">{item.group}</div>}
              <NavLink
                to={item.path}
                end={item.end}
                className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
              >
                <span className="nav-item-icon">
                  <item.icon />
                </span>
                <span>{item.label}</span>
              </NavLink>
            </div>
          );
        })}
      </nav>

      <div className="sidebar-footer">
        <button className="nav-item logout-btn" onClick={handleLogoutCurrentShop} title={shopInfo.shop_name ? `Logout of ${shopInfo.shop_name}` : 'Logout Shop'} style={{ width: '100%', background: 'none', border: 'none', textAlign: 'left', cursor: 'pointer' }}>
          <span className="nav-item-icon"><HiOutlineLogout /></span>
          <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            Logout {shopInfo.shop_name || 'Shop'}
          </span>
        </button>
        {allShops.length > 1 && (
           <button className="nav-item logout-btn" onClick={() => { logout('shop'); navigate('/login'); }} style={{ width: '100%', background: 'none', border: 'none', textAlign: 'left', cursor: 'pointer', marginTop: '4px', color: 'var(--danger)' }}>
             <span className="nav-item-icon"><HiOutlineLogout /></span>
             <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
               Logout All Shops
             </span>
           </button>
        )}
        <div className="sidebar-footer-text" style={{ marginTop: '12px' }}>v1.0.0 • Shop Portal</div>
      </div>
    </aside>
  );
}
