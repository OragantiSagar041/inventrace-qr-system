import { useEffect, useState } from 'react';
import { getSections, createSection, deleteSection, getProducts } from '../api/client';
import { Loader, EmptyState } from '../components/Shared';
import Modal from '../components/Modal';
import { 
  HiOutlineCollection, 
  HiOutlinePlus, 
  HiOutlineTrash, 
  HiOutlineCube,
  HiOutlineTag,
  HiOutlineChevronRight
} from 'react-icons/hi';

export default function Sections() {
  const [sections, setSections] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedSection, setSelectedSection] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [formData, setFormData] = useState({ name: '', description: '' });

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);
    try {
      const [resS, resP] = await Promise.all([getSections(), getProducts()]);
      setSections(resS.data.items || []);
      setProducts(resP.data.items || []);
    } catch (err) {
      console.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      await createSection(formData);
      setIsModalOpen(false);
      setFormData({ name: '', description: '' });
      fetchData();
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to create section');
    }
  }

  async function handleDelete(e, id) {
    e.stopPropagation();
    if (!window.confirm('Delete this section? Products assigned to it will remain but without a section.')) return;
    setIsDeleting(true);
    try {
      await deleteSection(id);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.detail || 'Delete failed');
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Inventory Sections</h1>
          <p>Organize products into functional groups for better management.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
          <HiOutlinePlus /> Create Section
        </button>
      </div>

      {loading ? (
        <Loader />
      ) : sections.length === 0 ? (
        <EmptyState 
          icon={<HiOutlineCollection />} 
          title="No Sections Defined" 
          message="Create your first section to better organize your inventory." 
        />
      ) : (
        <div className="table-container animate-in">
          <table>
            <thead>
              <tr>
                <th>Section Identity</th>
                <th>Description</th>
                <th>Products</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {sections.map((sec) => {
                const sectionProducts = products.filter(p => p.section_id === sec.section_id);
                return (
                  <tr 
                    key={sec.section_id} 
                    onClick={() => setSelectedSection({ ...sec, products: sectionProducts })}
                    style={{ cursor: 'pointer' }}
                    className="hover-row"
                  >
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ 
                          width: 32, height: 32, borderRadius: 8, background: 'var(--indigo-50)', 
                          color: 'var(--clr-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' 
                        }}>
                          <HiOutlineCollection />
                        </div>
                        <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>{sec.name}</span>
                      </div>
                    </td>
                    <td>{sec.description || <span style={{ color: 'var(--text-light)', fontSize: 12 }}>Detailed section meta</span>}</td>
                    <td>
                      <span className="badge badge-info" style={{ display: 'flex', alignItems: 'center', gap: 4, width: 'fit-content' }}>
                        <HiOutlineCube style={{ fontSize: 12 }} /> {sectionProducts.length} Products
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 12 }}>
                        <HiOutlineChevronRight style={{ color: 'var(--text-light)', opacity: 0.5 }} />
                        <button 
                          className="btn btn-sm btn-secondary" 
                          style={{ color: 'var(--danger)' }}
                          onClick={(e) => handleDelete(e, sec.section_id)}
                          disabled={isDeleting}
                        >
                          <HiOutlineTrash />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Section Products Modal */}
      <Modal
        open={!!selectedSection}
        onClose={() => setSelectedSection(null)}
        title={selectedSection ? `Products in ${selectedSection.name}` : ''}
        footer={<button className="btn btn-primary" onClick={() => setSelectedSection(null)}>Close View</button>}
      >
        {selectedSection && (
          <div>
            {selectedSection.products.length === 0 ? (
              <div style={{ padding: '40px 0', textAlign: 'center' }}>
                <HiOutlineTag style={{ fontSize: 40, color: 'var(--text-light)', marginBottom: 12, opacity: 0.3 }} />
                <p style={{ color: 'var(--text-light)', fontSize: 13 }}>No products are currently assigned to this section.</p>
              </div>
            ) : (
              <div style={{ border: '1px solid var(--border-main)', borderRadius: 12, overflow: 'hidden' }}>
                {selectedSection.products.map((p, i) => (
                  <div key={p.product_id} style={{ 
                    padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    borderBottom: i < selectedSection.products.length - 1 ? '1px solid var(--border-main)' : 'none',
                    background: i % 2 === 0 ? 'white' : '#fafafa'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <HiOutlineTag style={{ color: 'var(--clr-primary)' }} />
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 13 }}>{p.product_name}</div>
                        <div className="mono" style={{ fontSize: 10, color: 'var(--text-light)' }}>{p.product_id}</div>
                      </div>
                    </div>
                    <span style={{ fontWeight: 700, fontSize: 13, color: 'var(--text-main)' }}>
                      ₹{(p.total_price || 0).toLocaleString('en-IN')}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Create Modal */}
      <Modal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Create New Section"
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={handleSubmit}>Create Section</button>
          </>
        }
      >
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Section Name</label>
            <input
              type="text"
              className="form-input"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. Tiles, Fittings"
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label">Description (Optional)</label>
            <textarea
              className="form-input"
              style={{ minHeight: 80, resize: 'none' }}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Short description of this section"
            />
          </div>
        </form>
      </Modal>
    </div>
  );
}
