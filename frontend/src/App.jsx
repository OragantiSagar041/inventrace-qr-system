import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';

// Pages
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Sections from './pages/Sections';
import Products from './pages/Products';
import Shops from './pages/Shops';
import Distribution from './pages/Distribution';
import QRScanner from './pages/QRScanner';
import Inventory from './pages/Inventory';
import Settings from './pages/Settings';
import CustomerBuy from './pages/CustomerBuy';

// Shop Portal Pages
import ShopDashboard from './pages/portal/ShopDashboard';
import ShopInventoryPage from './pages/portal/ShopInventory';
import ShopScanner from './pages/portal/ShopScanner';
import ShopSales from './pages/portal/ShopSales';

// Layout Components
import Sidebar from './components/Sidebar';
import ShopSidebar from './components/ShopSidebar';

/* ── Protected route wrappers ── */
function AdminRoute({ children }) {
  const { isAdmin } = useAuth();
  if (!isAdmin) return <Navigate to="/login" replace />;
  return children;
}

function ShopRoute({ children }) {
  const { isShop } = useAuth();
  if (!isShop) return <Navigate to="/login" replace />;
  return children;
}

/* ── Admin Layout ── */
function AdminLayout() {
  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/sections" element={<Sections />} />
          <Route path="/products" element={<Products />} />
          <Route path="/shops" element={<Shops />} />
          <Route path="/distribution" element={<Distribution />} />
          <Route path="/qr-scan" element={<QRScanner />} />
          <Route path="/inventory" element={<Inventory />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </main>
    </div>
  );
}

/* ── Shop Layout ── */
function ShopLayout() {
  return (
    <div className="app-layout">
      <ShopSidebar />
      <main className="main-content">
        <Routes>
          <Route path="/" element={<ShopDashboard />} />
          <Route path="/inventory" element={<ShopInventoryPage />} />
          <Route path="/scanner" element={<ShopScanner />} />
          <Route path="/sales" element={<ShopSales />} />
        </Routes>
      </main>
    </div>
  );
}

/* ── Root redirect ── */
function RootRedirect() {
  const { isAdmin, isShop } = useAuth();
  if (isAdmin) return <Navigate to="/admin" replace />;
  if (isShop) return <Navigate to="/portal" replace />;
  return <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public */}
        <Route path="/login" element={<Login />} />
        <Route path="/buy/:token" element={<CustomerBuy />} />

        {/* Admin — protected */}
        <Route
          path="/admin/*"
          element={
            <AdminRoute>
              <AdminLayout />
            </AdminRoute>
          }
        />

        {/* Shop Portal — protected */}
        <Route
          path="/portal/*"
          element={
            <ShopRoute>
              <ShopLayout />
            </ShopRoute>
          }
        />

        {/* Root → redirect based on auth */}
        <Route path="*" element={<RootRedirect />} />
      </Routes>
    </BrowserRouter>
  );
}
