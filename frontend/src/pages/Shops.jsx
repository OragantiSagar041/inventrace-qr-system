import { useEffect, useState } from 'react';
import { listShops, createShop, resetShopCredentials } from '../api/client';
import { useToast } from '../context/ToastContext';
import Modal from '../components/Modal';
import Pagination from '../components/Pagination';
import { Loader, EmptyState } from '../components/Shared';
import { HiPlus, HiOutlineKey, HiOutlineClipboardCopy, HiOutlineShieldCheck, HiOutlineShoppingBag } from 'react-icons/hi';

export default function Shops() {
  const toast = useToast();
  const [shops, setShops] = useState([]);
  const [meta, setMeta] = useState({ page: 1, total_pages: 1 });
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [credsModalOpen, setCredsModalOpen] = useState(false);
  const [resetModalOpen, setResetModalOpen] = useState(false);
  const [resetTarget, setResetTarget] = useState(null);
  const [resetPassword, setResetPassword] = useState('');
  const [newCreds, setNewCreds] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [resettingId, setResettingId] = useState(null);
  const [form, setForm] = useState({ name: '', location: '', contact_email: '', password: '' });

  useEffect(() => {
    fetchShops(1);
  }, []);

  async function fetchShops(page) {
    setLoading(true);
    try {
      const res = await listShops(page);
      setShops(res.data.items);
      setMeta(res.data.meta);
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to load shops');
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.name.trim() || !form.location.trim()) {
      return toast.error('Shop name and location are required');
    }
    if (!form.password || form.password.length < 6) {
      return toast.error('Password must be at least 6 characters');
    }
    setSubmitting(true);
    try {
      const res = await createShop({
        name: form.name,
        location: form.location,
        contact_email: form.contact_email || null,
        password: form.password,
      });
      toast.success('Shop created successfully');
      setModalOpen(false);
      setForm({ name: '', location: '', contact_email: '', password: '' });
      fetchShops(1);
      
      // Show credentials
      setNewCreds({
        name: res.data.name,
        username: res.data.username,
        password: res.data.plain_password,
      });
      setCredsModalOpen(true);
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to create shop');
    } finally {
      setSubmitting(false);
    }
  }

  function handleReset(shopId, shopName) {
    setResetTarget({ shopId, shopName });
    setResetPassword('');
    setResetModalOpen(true);
  }

  async function handleResetSubmit() {
    if (!resetPassword || resetPassword.length < 6) {
      return toast.error('Password must be at least 6 characters');
    }
    setResettingId(resetTarget.shopId);
    try {
      const res = await resetShopCredentials(resetTarget.shopId, resetPassword);
      toast.success(`Credentials reset for ${resetTarget.shopName}`);
      setResetModalOpen(false);
      setNewCreds({
        name: resetTarget.shopName,
        username: res.data.username,
        password: resetPassword,
      });
      setCredsModalOpen(true);
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to reset credentials');
    } finally {
      setResettingId(null);
    }
  }

  function copyToClipboard(text) {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard!');
  }

  return (
    <div>
      <div className="page-header">
        <div className="page-header-actions">
          <div>
            <h1>Shops</h1>
            <p>Manage your retail shop locations</p>
          </div>
          <button className="btn btn-primary" onClick={() => setModalOpen(true)}>
            <HiPlus /> New Shop
          </button>
        </div>
      </div>

      {loading ? (
        <Loader />
      ) : shops.length === 0 ? (
        <EmptyState icon={<HiOutlineShoppingBag />} title="No shops registered" message="Start by adding your first retail shop location." />
      ) : (
        <>
          <div className="table-container animate-in">
            <table>
              <thead>
                <tr>
                  <th>Shop ID</th>
                  <th>Name</th>
                  <th>Location</th>
                  <th>Contact Email</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {shops.map((s) => (
                  <tr key={s.shop_id}>
                    <td>
                      <span className="mono">{s.shop_id}</span>
                    </td>
                    <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{s.name}</td>
                    <td>{s.location}</td>
                    <td>{s.contact_email || '—'}</td>
                    <td style={{ display: 'flex', gap: 6 }}>
                      <button 
                        onClick={() => handleReset(s.shop_id, s.name)} 
                        className="btn btn-secondary btn-sm"
                        disabled={resettingId === s.shop_id}
                        title="Reset Login Credentials"
                      >
                        {resettingId === s.shop_id ? 'Wait…' : <><HiOutlineKey /> Reset Login</>}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination page={meta.page} totalPages={meta.total_pages} onPageChange={fetchShops} />
        </>
      )}

      {/* Create Shop Modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Create New Shop"
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setModalOpen(false)}>
              Cancel
            </button>
            <button className="btn btn-primary" onClick={handleSubmit} disabled={submitting}>
              {submitting ? 'Creating…' : 'Create Shop'}
            </button>
          </>
        }
      >
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Shop Name *</label>
            <input
              className="form-input"
              placeholder="e.g. Downtown Electronics Hub"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              autoFocus
            />
          </div>
          <div className="form-group">
            <label className="form-label">Location *</label>
            <input
              className="form-input"
              placeholder="e.g. Mumbai, Maharashtra"
              value={form.location}
              onChange={(e) => setForm({ ...form, location: e.target.value })}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Contact Email</label>
            <input
              className="form-input"
              type="email"
              placeholder="shop@example.com"
              value={form.contact_email}
              onChange={(e) => setForm({ ...form, contact_email: e.target.value })}
            />
            <div className="form-helper">Used for stock alert notifications</div>
          </div>
          <div className="form-group">
            <label className="form-label">Password *</label>
            <input
              className="form-input"
              type="password"
              placeholder="Minimum 6 characters"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
            />
            <div className="form-helper">This password will be used by the shop owner to login</div>
          </div>
        </form>
      </Modal>

      {/* Reset Credentials Modal */}
      <Modal
        open={resetModalOpen}
        onClose={() => setResetModalOpen(false)}
        title="Reset Password"
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setResetModalOpen(false)}>
              Cancel
            </button>
            <button className="btn btn-danger" onClick={handleResetSubmit} disabled={!!resettingId}>
              {resettingId ? 'Resetting…' : 'Reset Password'}
            </button>
          </>
        }
      >
        {resetTarget && (
          <div>
            <div className="form-group" style={{ marginBottom: 16 }}>
              <label className="form-label">Shop Name</label>
              <div style={{ display: 'flex', gap: 8 }}>
                <div className="form-input" style={{ background: 'var(--bg-glass)', color: 'var(--text-muted)', flex: 1 }}>
                  {resetTarget.shopName}
                </div>
                <button 
                  type="button"
                  className="btn btn-icon btn-secondary" 
                  onClick={() => copyToClipboard(resetTarget.shopName)} 
                  title="Copy Shop Name"
                >
                  <HiOutlineClipboardCopy />
                </button>
              </div>
            </div>
            
            <div style={{ marginBottom: 20 }}>
              <p style={{ fontSize: 13, color: 'var(--warning)', marginBottom: 8 }}>
                Warning: Resetting will immediately sign out the shop owner if they are currently logged in.
              </p>
            </div>
            <div className="form-group">
              <label className="form-label">New Password *</label>
              <input
                className="form-input"
                type="password"
                placeholder="Minimum 6 characters"
                value={resetPassword}
                onChange={(e) => setResetPassword(e.target.value)}
                autoFocus
              />
              <div className="form-helper">Enter the new password for this shop</div>
            </div>
          </div>
        )}
      </Modal>

      {/* Show Credentials Modal */}
      <Modal
        open={credsModalOpen}
        onClose={() => { setCredsModalOpen(false); setNewCreds(null); }}
        title="Shop Credentials"
        footer={
          <button className="btn btn-primary" onClick={() => { setCredsModalOpen(false); setNewCreds(null); }}>
            Done
          </button>
        }
      >
        {newCreds && (
          <div style={{ textAlign: 'center', padding: '10px 0' }}>
            <div style={{ marginBottom: 16, color: 'var(--clr-primary)', fontSize: 40 }}>
              <HiOutlineShieldCheck style={{ margin: '0 auto' }} />
            </div>
            <h3 style={{ marginBottom: 8 }}>{newCreds.name}</h3>
            <p style={{ fontSize: 13, color: 'var(--text-light)', marginBottom: 24 }}>
              Share these credentials with the shop owner. <br/>
              <strong>Credential access is restricted for security.</strong>
            </p>

            <div style={{ background: 'var(--bg-glass)', border: '1px solid var(--border-primary)', borderRadius: 'var(--radius-md)', padding: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, paddingBottom: 16, borderBottom: '1px solid var(--border-primary)' }}>
                <div style={{ textAlign: 'left' }}>
                  <div style={{ fontSize: 11, textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 600, marginBottom: 4 }}>Username</div>
                  <div className="mono" style={{ fontSize: 16, color: 'var(--text-primary)' }}>{newCreds.username}</div>
                </div>
                <button className="btn btn-icon btn-secondary" onClick={() => copyToClipboard(newCreds.username)} title="Copy Username">
                  <HiOutlineClipboardCopy />
                </button>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ textAlign: 'left' }}>
                  <div style={{ fontSize: 11, textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 600, marginBottom: 4 }}>Password</div>
                  <div className="mono" style={{ fontSize: 16, color: 'var(--text-primary)' }}>{newCreds.password}</div>
                </div>
                <button className="btn btn-icon btn-secondary" onClick={() => copyToClipboard(newCreds.password)} title="Copy Password">
                  <HiOutlineClipboardCopy />
                </button>
              </div>
            </div>
            
            <div style={{ marginTop: 24, padding: 12, borderRadius: 8, background: 'rgba(99, 102, 241, 0.1)', border: '1px solid rgba(99, 102, 241, 0.2)', fontSize: 13, color: 'var(--accent-primary)', display: 'flex', flexDirection: 'column', gap: 6 }}>
              Login URL: <br/>
              <span className="mono" style={{ color: 'var(--text-primary)', fontWeight: 'bold' }}>{window.location.origin}/login</span>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
