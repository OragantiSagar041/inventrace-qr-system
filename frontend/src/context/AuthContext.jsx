import { createContext, useContext, useState, useCallback } from 'react';
import { adminLogin as apiAdminLogin, shopLogin as apiShopLogin } from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [auth, setAuth] = useState(() => {
    // Restore from localStorage on mount
    const adminToken = localStorage.getItem('admin_token');
    
    let shops = [];
    try {
      shops = JSON.parse(localStorage.getItem('logged_in_shops') || '[]');
    } catch {
      shops = [];
    }
    
    let activeShopId = sessionStorage.getItem('active_shop_id') || localStorage.getItem('active_shop_id');
    let activeShop = shops.find(s => String(s.info?.shop_id) === String(activeShopId)) || shops[0] || null;

    // Migrate from the old single shop format if it exists and `shops` is empty
    if (shops.length === 0) {
      const oldShopToken = localStorage.getItem('shop_token');
      let oldShopInfo = null;
      try { 
        oldShopInfo = JSON.parse(localStorage.getItem('shop_info') || 'null'); 
      } catch {}
      
      if (oldShopToken && oldShopInfo) {
        const migratedShop = { token: oldShopToken, info: oldShopInfo };
        shops = [migratedShop];
        activeShop = migratedShop;
        localStorage.setItem('logged_in_shops', JSON.stringify(shops));
        localStorage.setItem('active_shop_id', oldShopInfo.shop_id);
        sessionStorage.setItem('active_shop_id', oldShopInfo.shop_id);
        localStorage.removeItem('shop_token');
        localStorage.removeItem('shop_info');
      }
    } else if (activeShop) {
      sessionStorage.setItem('active_shop_id', activeShop.info.shop_id);
      localStorage.setItem('active_shop_id', activeShop.info.shop_id);
    }

    return {
      admin: adminToken ? { token: adminToken } : null,
      shop: activeShop, // Currently active shop
      shops: shops,     // List of all logged-in shops
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
    // ensure shop_id is present and treated as string for consistency
    const string_shop_id = String(shop_id);
    const shopInfo = { shop_id: string_shop_id, shop_name, location };
    
    setAuth(prev => {
      let newShops = [...(prev.shops || [])];
      const existingIdx = newShops.findIndex(s => String(s.info.shop_id) === string_shop_id);
      
      if (existingIdx >= 0) {
        newShops[existingIdx] = { token, info: shopInfo }; // update token/info
      } else {
        newShops.push({ token, info: shopInfo }); // add new shop
      }
      
      localStorage.setItem('logged_in_shops', JSON.stringify(newShops));
      sessionStorage.setItem('active_shop_id', string_shop_id); // Set the logged in shop as active in tab
      localStorage.setItem('active_shop_id', string_shop_id); // Defaults for new tabs
      
      return {
        ...prev,
        shop: { token, info: shopInfo },
        shops: newShops
      };
    });
    
    return true;
  }, []);

  const switchShop = useCallback((shopId) => {
    setAuth(prev => {
      const string_shop_id = String(shopId);
      const activeShop = (prev.shops || []).find(s => String(s.info.shop_id) === string_shop_id);
      if (activeShop) {
        sessionStorage.setItem('active_shop_id', string_shop_id);
        localStorage.setItem('active_shop_id', string_shop_id);
        return { ...prev, shop: activeShop };
      }
      return prev;
    });
  }, []);

  const logout = useCallback((role = 'all', shopId = null) => {
    if (role === 'admin' || role === 'all') {
      localStorage.removeItem('admin_token');
      setAuth(prev => ({ ...prev, admin: null }));
    }
    
    if (role === 'shop' || role === 'all') {
      if (shopId && role === 'shop') {
         // Logout a specific shop
         setAuth(prev => {
           const string_shopId = String(shopId);
           let newShops = (prev.shops || []).filter(s => String(s.info.shop_id) !== string_shopId);
           localStorage.setItem('logged_in_shops', JSON.stringify(newShops));
           
           if (String(prev.shop?.info?.shop_id) === string_shopId) {
             // We logged out of the currently active shop
             const existingActiveShop = newShops[0] || null;
             if (existingActiveShop) {
               sessionStorage.setItem('active_shop_id', existingActiveShop.info.shop_id);
               localStorage.setItem('active_shop_id', existingActiveShop.info.shop_id);
             } else {
               sessionStorage.removeItem('active_shop_id');
               localStorage.removeItem('active_shop_id');
             }
             return { ...prev, shop: existingActiveShop, shops: newShops };
           }
           
           return { ...prev, shops: newShops };
         });
      } else {
         // Logout all shops
         localStorage.removeItem('logged_in_shops');
         sessionStorage.removeItem('active_shop_id');
         localStorage.removeItem('active_shop_id');
         // Also clean up old format just to be safe
         localStorage.removeItem('shop_token');
         localStorage.removeItem('shop_info');
         
         setAuth(prev => ({ ...prev, shop: null, shops: [] }));
      }
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
        switchShop,
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
