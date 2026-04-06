import { useEffect, useState } from 'react';
import { getShopInventory, checkAvailability, listShops, listProducts } from '../api/client';
import { Loader, EmptyState } from '../components/Shared';
import { 
  HiOutlineChevronDown, 
  HiOutlineChevronRight, 
  HiOutlineSearch, 
  HiOutlineOfficeBuilding,
  HiOutlineCheckCircle,
  HiOutlineXCircle,
  HiOutlineInbox
} from 'react-icons/hi';

export default function Inventory() {
  const [shops, setShops] = useState([]);
  const [products, setProducts] = useState([]);
  const [selectedShop, setSelectedShop] = useState('');
  const [inventory, setInventory] = useState(null);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [expandedSections, setExpandedSections] = useState({});

  // Availability check
  const [availShop, setAvailShop] = useState('');
  const [availProduct, setAvailProduct] = useState('');
  const [availResult, setAvailResult] = useState(null);
  const [availChecking, setAvailChecking] = useState(false);

  useEffect(() => {
    loadInitial();
  }, []);

  async function loadInitial() {
    try {
      const [shopRes, prodRes] = await Promise.all([listShops(1, 100), listProducts(1, 100)]);
      setShops(shopRes.data.items);
      setProducts(prodRes.data.items);
    } catch {
      console.error('Failed to load initial data');
    } finally {
      setInitialLoading(false);
    }
  }

  async function fetchInventory(shopId) {
    if (!shopId) {
      setInventory(null);
      return;
    }
    setLoading(true);
    setInventory(null);
    try {
      const res = await getShopInventory(shopId);
      setInventory(res.data);
      const expanded = {};
      res.data.sections.forEach((s) => {
        expanded[s.section_id] = true;
      });
      setExpandedSections(expanded);
    } catch (err) {
      console.error('Failed to load inventory');
    } finally {
      setLoading(false);
    }
  }

  function toggleSection(sectionId) {
    setExpandedSections((prev) => ({ ...prev, [sectionId]: !prev[sectionId] }));
  }

  async function handleAvailCheck(e) {
    e.preventDefault();
    if (!availShop || !availProduct) return;
    setAvailChecking(true);
    setAvailResult(null);
    try {
      const res = await checkAvailability(availShop, availProduct);
      setAvailResult(res.data);
    } catch (err) {
      console.error('Availability check failed');
    } finally {
      setAvailChecking(false);
    }
  }

  if (initialLoading) return <Loader />;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Inventory Viewer</h1>
          <p>Real-time stock monitoring across all shop locations.</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 24 }}>
        {/* Shop Inventory */}
        <div>
          <div className="card animate-in" style={{ marginBottom: 20 }}>
            <div className="card-header">
              <h3 className="card-title">Shop Lookup</h3>
            </div>
            <div style={{ padding: 20 }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <select
                  className="form-input"
                  value={selectedShop}
                  onChange={(e) => {
                    setSelectedShop(e.target.value);
                    fetchInventory(e.target.value);
                  }}
                >
                  <option value="">Choose a shop location to view inventory</option>
                  {shops.map((s) => (
                    <option key={s.shop_id} value={s.shop_id}>
                      {s.name} — {s.location}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {loading && <Loader />}

          {!loading && inventory && inventory.sections.length === 0 && (
            <EmptyState
              icon={<HiOutlineInbox />}
              title="Shop Empty"
              message="No inventory items have been distributed to this location."
            />
          )}

          {!loading && inventory && inventory.sections.map((section) => (
            <div className="card animate-in" key={section.section_id} style={{ marginBottom: 16, overflow: 'hidden' }}>
              <div
                style={{ 
                  padding: '12px 20px', background: '#fafafa', cursor: 'pointer', 
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  borderBottom: expandedSections[section.section_id] ? '1px solid var(--border-main)' : 'none'
                }}
                onClick={() => toggleSection(section.section_id)}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  {expandedSections[section.section_id] ? <HiOutlineChevronDown /> : <HiOutlineChevronRight />}
                  <span style={{ fontWeight: 700, fontSize: 14 }}>{section.section_name}</span>
                </div>
                <div style={{ display: 'flex', gap: 12 }}>
                  <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--success)' }}>{section.completed} sold</span>
                  <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--clr-primary)' }}>{section.pending} pending</span>
                </div>
              </div>

              {expandedSections[section.section_id] && (
                <div className="table-container" style={{ border: 'none', borderRadius: 0 }}>
                  <table>
                    <thead>
                      <tr>
                        <th>Product Details</th>
                        <th>Serial Number</th>
                        <th>Status</th>
                        <th>Price</th>
                      </tr>
                    </thead>
                    <tbody>
                      {section.items.map((item) => (
                        <tr key={item.inventory_id}>
                          <td>
                            <div style={{ fontWeight: 600, color: 'var(--text-main)', fontSize: 13 }}>{item.product_name}</div>
                            <div className="mono" style={{ fontSize: 11, color: 'var(--text-light)' }}>{item.product_id}</div>
                          </td>
                          <td className="mono" style={{ fontSize: 12 }}>{item.serial_number.slice(-12).toUpperCase()}</td>
                          <td>
                            <span className={`badge ${item.status === 'sold' ? 'badge-success' : 'badge-warning'}`}>
                              {item.status}
                            </span>
                          </td>
                          <td style={{ fontWeight: 700, color: 'var(--text-main)' }}>₹{parseFloat(item.total_price).toLocaleString('en-IN')}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ))}

          {!loading && !inventory && !selectedShop && (
            <div className="card" style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-light)' }}>
              <HiOutlineOfficeBuilding style={{ fontSize: 40, marginBottom: 12, opacity: 0.3 }} />
              <p style={{ fontSize: 13 }}>Select a shop above to view live inventory</p>
            </div>
          )}
        </div>

        {/* Availability Check */}
        <div>
          <div className="card animate-in stagger-2">
            <div className="card-header">
              <h3 className="card-title">Stock Search</h3>
            </div>
            <div style={{ padding: 20 }}>
              <p style={{ fontSize: 13, color: 'var(--text-light)', marginBottom: 20 }}>
                Verify if a product is in stock at a specific shop and find alternatives.
              </p>
              <form onSubmit={handleAvailCheck}>
                <div className="form-group">
                  <label className="form-label">Shop Location</label>
                  <select
                    className="form-input"
                    value={availShop}
                    onChange={(e) => setAvailShop(e.target.value)}
                  >
                    <option value="">Select location</option>
                    {shops.map((s) => (
                      <option key={s.shop_id} value={s.shop_id}>{s.name}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Product Name</label>
                  <select
                    className="form-input"
                    value={availProduct}
                    onChange={(e) => setAvailProduct(e.target.value)}
                  >
                    <option value="">Select product</option>
                    {products.map((p) => (
                      <option key={p.product_id} value={p.product_id}>{p.product_name}</option>
                    ))}
                  </select>
                </div>
                <button
                  className="btn btn-primary"
                  type="submit"
                  disabled={availChecking}
                  style={{ width: '100%', marginTop: 8 }}
                >
                  <HiOutlineSearch /> {availChecking ? 'Checking…' : 'Check Availability'}
                </button>
              </form>

              {/* Availability Result */}
              {availResult && (
                <div style={{ 
                  marginTop: 24, padding: 16, borderRadius: 12, 
                  background: availResult.available ? 'var(--success-bg)' : 'var(--danger-bg)',
                  border: `1px solid ${availResult.available ? 'var(--success-border)' : 'var(--danger-border)'}`
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                    {availResult.available ? 
                      <HiOutlineCheckCircle style={{ color: 'var(--success)', fontSize: 20 }} /> : 
                      <HiOutlineXCircle style={{ color: 'var(--danger)', fontSize: 20 }} />
                    }
                    <span style={{ fontSize: 14, fontWeight: 700, color: availResult.available ? 'var(--success)' : 'var(--danger)' }}>
                      {availResult.available ? 'Available' : 'Out of Stock'}
                    </span>
                  </div>
                  <p style={{ fontSize: 12, color: 'var(--text-dim)' }}>{availResult.message}</p>

                  {!availResult.available && availResult.alternative_shops.length > 0 && (
                    <div style={{ marginTop: 16 }}>
                      <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-light)', marginBottom: 8, textTransform: 'uppercase' }}>
                        Found at other shops
                      </div>
                      {availResult.alternative_shops.map((alt) => (
                        <div key={alt.shop_id} style={{ 
                          display: 'flex', justifyContent: 'space-between', padding: '10px 12px',
                          background: 'white', borderRadius: 8, border: '1px solid var(--border-main)', marginBottom: 6,
                          fontSize: 12
                        }}>
                          <div>
                            <div style={{ fontWeight: 700 }}>{alt.name}</div>
                            <div style={{ color: 'var(--text-light)', fontSize: 11 }}>{alt.location}</div>
                          </div>
                          <span className="badge badge-success" style={{ height: 'fit-content' }}>
                            {alt.available_stock} units
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
