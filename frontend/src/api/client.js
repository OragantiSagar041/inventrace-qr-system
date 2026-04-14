import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor: attach admin OR shop token based on what's stored
api.interceptors.request.use((config) => {
  const adminToken = localStorage.getItem('admin_token');
  let shopToken = null;
  
  try {
    const shops = JSON.parse(localStorage.getItem('logged_in_shops') || '[]');
    const sessionActiveId = sessionStorage.getItem('active_shop_id');
    const localActiveId = localStorage.getItem('active_shop_id');
    const activeShopId = sessionActiveId || localActiveId;
    
    const activeShop = shops.find(s => String(s.info?.shop_id) === String(activeShopId)) || shops[0];
    if (activeShop) {
      shopToken = activeShop.token;
    }
  } catch (e) {}

  if (!shopToken) {
    // Fallback for old sessions that weren't migrated
    shopToken = localStorage.getItem('shop_token');
  }

  if (adminToken) {
    config.headers['X-Admin-Token'] = adminToken;
  }
  if (shopToken) {
    config.headers['X-Shop-Token'] = shopToken;
  }
  return config;
});

// ─── Auth ───
export const adminLogin = (token) => api.post('/auth/admin-login', { token });
export const shopLogin = (username, password) =>
  api.post('/auth/shop-login', { username, password });

// ─── Sections ───
export const getSections = () => api.get('/sections');
export const createSection = (data) => api.post('/sections', data);
export const deleteSection = (id) => api.delete(`/sections/${id}`);

// ─── Products ───
export const getProducts = () => api.get('/products');
export const createProduct = (data) => api.post('/products', data);
export const deleteProduct = (id) => api.delete(`/products/${id}`);

// ─── Shops ───
export const getShops = () => api.get('/shops');
export const createShop = (data) => api.post('/shops', data);
export const deleteShop = (id) => api.delete(`/shops/${id}`);
export const resetShopCredentials = (shopId, password) =>
  api.post(`/shops/${shopId}/reset-credentials`, { password });

// ─── Distribution ───
export const getDistribution = () => api.get('/distribute');
export const distributeProduct = (data) => api.post('/distribute', data);

// ─── QR Scan ───
export const scanQR = (token) => api.get(`/scan/${token}`);

// ─── Inventory ───
export const getShopInventory = (shopId) => api.get(`/shop/${shopId}/inventory`);
export const checkAvailability = (shopId, productId) =>
  api.get(`/shop/${shopId}/availability/${productId}`);

// ─── Dashboard ───
export const getDashboard = () => api.get('/dashboard/admin');

// ─── Shop Portal ───
export const getShopPortalDashboard = () => api.get('/shop-portal/dashboard');
export const getShopPortalInventory = () => api.get('/shop-portal/inventory');
export const getShopPortalSales = (page = 1, pageSize = 30) =>
  api.get('/shop-portal/sales', { params: { page, page_size: pageSize } });

// ─── Customer ───
export const getCustomerProduct = (token) => api.get(`/customer/product/${token}`);
export const customerBuy = (token) => api.post(`/customer/buy/${token}`);

// Backward compatibility (if needed)
export const listSections = getSections;
export const listProducts = getProducts;
export const listShops = getShops;

export default api;
