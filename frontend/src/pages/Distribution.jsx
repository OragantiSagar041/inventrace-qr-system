import { useEffect, useState } from 'react';
import { getDistribution, distributeProduct, getShops, getProducts } from '../api/client';
import { Loader, EmptyState } from '../components/Shared';
import Modal from '../components/Modal';
import { 
  HiOutlineOfficeBuilding, 
  HiOutlineCube, 
  HiOutlinePlus, 
  HiOutlineCollection, 
  HiOutlineTag,
  HiOutlineTruck
} from 'react-icons/hi';

export default function Distribution() {
  const [distributions, setDistributions] = useState([]);
  const [shops, setShops] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({ 
    shop_id: '', 
    product_id: '', 
    quantity: 1 
  });

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);
    try {
      const [resD, resS, resP] = await Promise.all([
        getDistribution(), 
        getShops(), 
        getProducts()
      ]);
      setDistributions(resD.data.items || []);
      setShops(resS.data.items || []);
      setProducts(resP.data.items || []);
    } catch (err) {
      console.error('Failed to load distribution data');
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!formData.shop_id || !formData.product_id) return alert('Selection required');
    setSubmitting(true);
    try {
      await distributeProduct(formData);
      setIsModalOpen(false);
      setFormData({ shop_id: '', product_id: '', quantity: 1 });
      fetchData();
    } catch (err) {
      alert(err.response?.data?.detail || 'Distribution failed');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Stock Distribution</h1>
          <p>Assign product batches to your shop locations.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
          <HiOutlinePlus /> Create Distribution
        </button>
      </div>

      {loading ? (
        <Loader />
      ) : distributions.length === 0 ? (
        <EmptyState 
          icon={<HiOutlineTruck />} 
          title="No Distributions Found" 
          message="Products assigned to shops will appear here." 
        />
      ) : (
        <div className="table-container animate-in">
          <table>
            <thead>
              <tr>
                <th>Shop Location</th>
                <th>Product Distributed</th>
                <th>Units Shared</th>
                <th>Completion</th>
                <th>Distribution Date</th>
              </tr>
            </thead>
            <tbody>
              {distributions.map((d, i) => (
                <tr key={i}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <HiOutlineOfficeBuilding style={{ color: 'var(--clr-primary)' }} />
                      <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>{d.shop_name}</span>
                    </div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <HiOutlineTag style={{ color: 'var(--text-light)' }} />
                      <span>{d.product_name}</span>
                    </div>
                  </td>
                  <td style={{ fontWeight: 700, color: 'var(--text-main)' }}>{d.total_units} units</td>
                  <td>
                    <span className={`badge ${d.completion_percent === 100 ? 'badge-success' : 'badge-warning'}`}>
                      {d.completion_percent}% sold
                    </span>
                  </td>
                  <td style={{ fontSize: 13, color: 'var(--text-light)' }}>
                    {new Date(d.distributed_at).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Distribution Modal */}
      <Modal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Distribute Products"
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={handleSubmit} disabled={submitting}>
              {submitting ? 'Assigning…' : 'Distribute Batch'}
            </button>
          </>
        }
      >
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Shop Location</label>
            <select
              className="form-input"
              value={formData.shop_id}
              onChange={(e) => setFormData({ ...formData, shop_id: e.target.value })}
              required
            >
              <option value="">Select Target Shop</option>
              {shops.map(s => (
                <option key={s.shop_id} value={s.shop_id}>{s.name} — {s.location}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Product to Share</label>
            <select
              className="form-input"
              value={formData.product_id}
              onChange={(e) => setFormData({ ...formData, product_id: e.target.value })}
              required
            >
              <option value="">Select Product Specifications</option>
              {products.map(p => (
                <option key={p.product_id} value={p.product_id}>
                  {p.product_name} (₹{p.total_price?.toLocaleString('en-IN')})
                </option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Initial Stock Quantity</label>
            <input
              type="number"
              min="1"
              className="form-input"
              value={formData.quantity}
              onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) || 1 })}
              required
            />
            <p className="form-helper">Specifies how many unique QR items to generate now.</p>
          </div>
        </form>
      </Modal>
    </div>
  );
}
