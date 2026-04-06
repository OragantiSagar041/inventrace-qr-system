import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  HiOutlineViewGrid,
  HiOutlineCollection,
  HiOutlineCube,
  HiOutlineOfficeBuilding,
  HiOutlineTruck,
  HiOutlineQrcode,
  HiOutlineClipboardList,
  HiOutlineCog,
  HiOutlineLogout,
} from 'react-icons/hi';

const navItems = [
  { label: 'Overview', path: '/admin', icon: HiOutlineViewGrid, end: true },
  { label: 'Sections', path: '/admin/sections', icon: HiOutlineCollection, group: 'Manage' },
  { label: 'Products', path: '/admin/products', icon: HiOutlineCube },
  { label: 'Shops', path: '/admin/shops', icon: HiOutlineOfficeBuilding },
  { label: 'Distribution', path: '/admin/distribution', icon: HiOutlineTruck, group: 'Operations' },
  { label: 'QR Scanner', path: '/admin/qr-scan', icon: HiOutlineQrcode },
  { label: 'Inventory', path: '/admin/inventory', icon: HiOutlineClipboardList },
  { label: 'Settings', path: '/admin/settings', icon: HiOutlineCog, group: 'System' },
];

export default function Sidebar() {
  const { logout } = useAuth();
  let lastGroup = null;

  return (
    <aside className="sidebar" id="sidebar">
      <div className="sidebar-header">
        <div className="sidebar-logo">
          <HiOutlineCube />
        </div>
        <div>
          <div className="sidebar-title">Manufacturing QR</div>
          <div className="sidebar-subtitle">Admin Portal</div>
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
        <button className="nav-item logout-btn" onClick={() => logout('admin')}>
          <span className="nav-item-icon"><HiOutlineLogout /></span>
          <span>Logout Admin</span>
        </button>
        <div className="sidebar-footer-text">v1.0.0 • Admin Portal</div>
      </div>
    </aside>
  );
}
