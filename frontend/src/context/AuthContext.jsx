import { createContext, useContext, useState, useCallback } from 'react';
import { adminLogin as apiAdminLogin, shopLogin as apiShopLogin } from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [auth, setAuth] = useState(() => {
    // Restore from localStorage on mount
    const adminToken = localStorage.getItem('admin_token');
    const shopToken = localStorage.getItem('shop_token');
    let shopInfo = null;
    try {
      shopInfo = JSON.parse(localStorage.getItem('shop_info') || 'null');
    } catch {
      shopInfo = null;
    }

    return {
      admin: adminToken ? { token: adminToken } : null,
      shop: shopToken ? { token: shopToken, info: shopInfo } : null,
    };
  });

  const loginAdmin = useCallback(async (token) => {
    const res = await apiAdminLogin(token);
    if (res.data.valid) {
      localStorage.setItem('admin_token', token);
      setAuth(prev => ({
        ...prev,
        admin: { token }
      }));
      return true;
    }
    return false;
  }, []);

  const loginShop = useCallback(async (username, password) => {
    const res = await apiShopLogin(username, password);
    const { token, shop_id, shop_name, location } = res.data;
    const shopInfo = { shop_id, shop_name, location };
    
    localStorage.setItem('shop_token', token);
    localStorage.setItem('shop_info', JSON.stringify(shopInfo));
    
    setAuth(prev => ({
      ...prev,
      shop: { token, info: shopInfo }
    }));
    return true;
  }, []);

  const logout = useCallback((role = 'all') => {
    if (role === 'admin' || role === 'all') {
      localStorage.removeItem('admin_token');
      setAuth(prev => ({ ...prev, admin: null }));
    }
    if (role === 'shop' || role === 'all') {
      localStorage.removeItem('shop_token');
      localStorage.removeItem('shop_info');
      setAuth(prev => ({ ...prev, shop: null }));
    }
  }, []);

  const isAdmin = !!auth.admin;
  const isShop = !!auth.shop;
  const isAuthenticated = isAdmin || isShop;

  return (
    <AuthContext.Provider
      value={{
        auth,
        isAdmin,
        isShop,
        isAuthenticated,
        loginAdmin,
        loginShop,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
