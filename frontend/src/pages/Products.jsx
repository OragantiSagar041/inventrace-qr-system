import { useEffect, useState } from 'react';
import { getProducts, createProduct, deleteProduct, getSections } from '../api/client';
import { Loader, EmptyState } from '../components/Shared';
import Modal from '../components/Modal';
import { 
  HiOutlineCube, 
  HiOutlineTag, 
  HiOutlinePlus, 
  HiOutlineTrash, 
  HiOutlineInformationCircle,
  HiOutlineCurrencyRupee,
  HiOutlineLibrary
} from 'react-icons/hi';

export default function Products() {
  const [products, setProducts] = useState([]);
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [detailProduct, setDetailProduct] = useState(null);
  
  const [formData, setFormData] = useState({ 
    product_name: '', 
    product_id: '', 
    base_price: '', 
    cgst: '9', 
    sgst: '9',
    section_id: '' 
  });

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);
    try {
      const [resP, resS] = await Promise.all([getProducts(), getSections()]);
      setProducts(resP.data.items || []);
      setSections(resS.data.items || []);
    } catch (err) {
      console.error('Failed to load products');
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      await createProduct({
        ...formData,
        base_price: parseFloat(formData.base_price),
        cgst: parseFloat(formData.cgst),
        sgst: parseFloat(formData.sgst)
      });
      setIsModalOpen(false);
      setFormData({ product_name: '', product_id: '', base_price: '', cgst: '9', sgst: '9', section_id: '' });
      fetchData();
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to create product');
    }
  }

  async function handleDelete(e, id) {
    e.stopPropagation();
    if (!window.confirm('Delete this product? Related inventory will be affected.')) return;
    try {
      await deleteProduct(id);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.detail || 'Delete failed');
    }
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Product Catalog</h1>
          <p>Define product specifications, taxes, and pricing.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
          <HiOutlinePlus /> Create Product
        </button>
      </div>

      {loading ? (
        <Loader />
      ) : products.length === 0 ? (
        <EmptyState 
          icon={<HiOutlineCube />} 
          title="No Products Found" 
          message="Create your first product to start managing inventory." 
        />
      ) : (
        <div className="table-container animate-in">
          <table>
            <thead>
              <tr>
                <th>Product Details</th>
                <th>Product ID</th>
                <th>Section</th>
                <th>Total Price (incl. tax)</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr 
                  key={p.product_id} 
                  onClick={() => setDetailProduct(p)}
                  style={{ cursor: 'pointer' }}
                  className="hover-row"
                >
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ 
                        width: 32, height: 32, borderRadius: 8, background: 'var(--indigo-50)', 
                        color: 'var(--clr-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' 
                      }}>
                        <HiOutlineTag />
                      </div>
                      <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>{p.product_name}</span>
                    </div>
                  </td>
                  <td className="mono" style={{ fontSize: 13 }}>{p.product_id}</td>
                  <td>
                    <span className="badge badge-secondary">
                      {sections.find(s => s.section_id === p.section_id)?.name || 'Default'}
                    </span>
                  </td>
                  <td style={{ fontWeight: 700, color: 'var(--text-main)' }}>
                    ₹{(p.total_price || 0).toLocaleString('en-IN')}
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <button 
                      className="btn btn-sm btn-secondary" 
                      style={{ color: 'var(--danger)' }}
                      onClick={(e) => handleDelete(e, p.product_id)}
                    >
                      <HiOutlineTrash />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Detail Modal */}
      <Modal
        open={!!detailProduct}
        onClose={() => setDetailProduct(null)}
        title="Product Specifications"
        footer={<button className="btn btn-primary" onClick={() => setDetailProduct(null)}>Close</button>}
      >
        {detailProduct && (
          <div style={{ padding: '4px 0' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
              <div style={{ 
                width: 48, height: 48, borderRadius: 12, background: 'var(--indigo-50)', 
                color: 'var(--clr-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 24
              }}>
                <HiOutlineCube />
              </div>
              <div>
                <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>{detailProduct.product_name}</h2>
                <div className="mono" style={{ fontSize: 12, color: 'var(--text-light)' }}>ID: {detailProduct.product_id}</div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
              <div className="card" style={{ padding: 16, background: '#f8fafc', border: '1px solid var(--border-main)' }}>
                <div style={{ fontSize: 11, color: 'var(--text-light)', marginBottom: 4, textTransform: 'uppercase', fontWeight: 700 }}>Base Price</div>
                <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-main)' }}>₹{(detailProduct.base_price || 0).toLocaleString('en-IN')}</div>
              </div>
              <div className="card" style={{ padding: 16, background: 'var(--success-bg)', border: '1px solid var(--success-border)' }}>
                <div style={{ fontSize: 11, color: 'var(--success)', marginBottom: 4, textTransform: 'uppercase', fontWeight: 700 }}>Total (Inc. Tax)</div>
                <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--success)' }}>₹{(detailProduct.total_price || 0).toLocaleString('en-IN')}</div>
              </div>
            </div>

            <div style={{ border: '1px solid var(--border-main)', borderRadius: 12, overflow: 'hidden' }}>
              <div style={{ padding: '12px 16px', background: '#fafafa', borderBottom: '1px solid var(--border-main)', fontSize: 12, fontWeight: 700 }}>Tax Structure</div>
              <div style={{ padding: '12px 16px', display: 'flex', justifyContent: 'space-between', fontSize: 13, borderBottom: '1px solid var(--border-main)' }}>
                <span style={{ color: 'var(--text-light)' }}>CGST Percentage</span>
                <span style={{ fontWeight: 600 }}>{detailProduct.cgst}%</span>
              </div>
              <div style={{ padding: '12px 16px', display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                <span style={{ color: 'var(--text-light)' }}>SGST Percentage</span>
                <span style={{ fontWeight: 600 }}>{detailProduct.sgst}%</span>
              </div>
            </div>

            <div style={{ marginTop: 24, padding: 16, borderRadius: 12, background: 'var(--bg-glass)', border: '1px solid var(--border-main)', display: 'flex', alignItems: 'center', gap: 12 }}>
              <HiOutlineLibrary style={{ fontSize: 20, color: 'var(--clr-primary)' }} />
              <div>
                <div style={{ fontSize: 11, color: 'var(--text-light)' }}>Assigned Section</div>
                <div style={{ fontSize: 14, fontWeight: 600 }}>{sections.find(s => s.section_id === detailProduct.section_id)?.name || 'General Inventory'}</div>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Create Modal */}
      <Modal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Create New Product"
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={handleSubmit}>Create Product</button>
          </>
        }
      >
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Product Name</label>
            <input
              type="text"
              className="form-input"
              value={formData.product_name}
              onChange={(e) => setFormData({ ...formData, product_name: e.target.value })}
              placeholder="e.g. Premium White Tile (8x8)"
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label">Product ID / SKU</label>
            <input
              type="text"
              className="form-input"
              value={formData.product_id}
              onChange={(e) => setFormData({ ...formData, product_id: e.target.value })}
              placeholder="e.g. TL-WH-88"
              required
            />
          </div>
          
          <div className="form-group">
            <label className="form-label">Section</label>
            <select
              className="form-input"
              value={formData.section_id}
              onChange={(e) => setFormData({ ...formData, section_id: e.target.value })}
              required
            >
              <option value="">Select Section</option>
              {sections.map(s => (
                <option key={s.section_id} value={s.section_id}>{s.name}</option>
              ))}
            </select>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr', gap: 12 }}>
            <div className="form-group">
              <label className="form-label">Base Price (₹)</label>
              <input
                type="number"
                step="0.01"
                className="form-input"
                value={formData.base_price}
                onChange={(e) => setFormData({ ...formData, base_price: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">CGST %</label>
              <input
                type="number"
                className="form-input"
                value={formData.cgst}
                onChange={(e) => setFormData({ ...formData, cgst: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">SGST %</label>
              <input
                type="number"
                className="form-input"
                value={formData.sgst}
                onChange={(e) => setFormData({ ...formData, sgst: e.target.value })}
                required
              />
            </div>
          </div>
        </form>
      </Modal>
    </div>
  );
}
