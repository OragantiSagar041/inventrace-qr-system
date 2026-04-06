import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  HiOutlineViewGrid,
  HiOutlineClipboardList,
  HiOutlineQrcode,
  HiOutlineChartBar,
  HiOutlineLogout,
  HiOutlineShoppingBag,
} from 'react-icons/hi';

const navItems = [
  { label: 'Dashboard', path: '/portal', icon: HiOutlineViewGrid, end: true },
  { label: 'Inventory', path: '/portal/inventory', icon: HiOutlineClipboardList, group: 'Manage' },
  { label: 'QR Scanner', path: '/portal/scanner', icon: HiOutlineQrcode, group: 'Operations' },
  { label: 'Sales History', path: '/portal/sales', icon: HiOutlineChartBar },
];

export default function ShopSidebar() {
  const { auth, logout } = useAuth();
  const shopInfo = auth.shop?.info || {};
  let lastGroup = null;

  return (
    <aside className="sidebar" id="shop-sidebar">
      <div className="sidebar-header">
        <div className="sidebar-logo">
          <HiOutlineShoppingBag />
        </div>
        <div>
          <div className="sidebar-title">{shopInfo.shop_name || 'Shop Portal'}</div>
          <div className="sidebar-subtitle">{shopInfo.location || 'Shop Management'}</div>
        </div>
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
        <button className="nav-item logout-btn" onClick={() => logout('shop')}>
          <span className="nav-item-icon"><HiOutlineLogout /></span>
          <span>Logout Shop</span>
        </button>
        <div className="sidebar-footer-text">v1.0.0 • Shop Portal</div>
      </div>
    </aside>
  );
}
