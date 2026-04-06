import { useEffect, useState } from 'react';
import { getShopPortalInventory } from '../../api/client';
import { Loader, EmptyState } from '../../components/Shared';
import Modal from '../../components/Modal';
import { QRCodeCanvas } from 'qrcode.react';
import { 
  HiOutlineCollection, 
  HiOutlineCube, 
  HiOutlineDeviceMobile,
  HiOutlineInbox,
  HiOutlineDownload,
  HiOutlineOfficeBuilding
} from 'react-icons/hi';

export default function ShopInventory() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedSection, setSelectedSection] = useState('all');
  const [selectedItem, setSelectedItem] = useState(null);

  useEffect(() => {
    fetchInventory();
  }, []);

  async function fetchInventory() {
    setLoading(true);
    try {
      const res = await getShopPortalInventory();
      setData(res.data);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to load inventory');
    } finally {
      setLoading(false);
    }
  }

  const handleDownloadQR = () => {
    const canvas = document.getElementById('qr-canvas');
    if (!canvas) return;
    const url = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.href = url;
    link.download = `QR_${selectedItem.product_name.replace(/\s+/g, '_')}_${selectedItem.serial_number.slice(-8)}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) return <Loader />;
  if (error) return <EmptyState icon={<HiOutlineInbox />} title="Error" message={error} />;
  if (!data) return <EmptyState icon={<HiOutlineInbox />} title="No Data" message="Inventory data unavailable" />;

  const sections = data.sections || [];
  const allItems = sections.flatMap((s) => s.items || []);
  const pendingItems = allItems.filter((i) => i.status === 'pending');
  const filteredSections =
    selectedSection === 'all'
      ? sections
      : sections.filter((s) => s.section_id === selectedSection);

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Stock Inventory</h1>
          <p>Available items: {pendingItems.length} units</p>
        </div>
      </div>

      {/* Section Filter */}
      {sections.length > 1 && (
        <div style={{ display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap' }}>
          <button
            className={`btn btn-sm ${selectedSection === 'all' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setSelectedSection('all')}
          >
            All Stock
          </button>
          {sections.map((sec) => (
            <button
              key={sec.section_id}
              className={`btn btn-sm ${selectedSection === sec.section_id ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setSelectedSection(sec.section_id)}
            >
              {sec.section_name} ({sec.pending})
            </button>
          ))}
        </div>
      )}

      {filteredSections.length === 0 ? (
        <EmptyState icon={<HiOutlineInbox />} title="Inventory Empty" message="No stock has been assigned to your shop." />
      ) : (
        filteredSections.map((sec) => {
          const sectionPending = (sec.items || []).filter((i) => i.status === 'pending');
          return (
            <div key={sec.section_id} className="card animate-in" style={{ marginBottom: 24 }}>
              <div className="card-header" style={{ padding: '16px 24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <HiOutlineCollection style={{ color: 'var(--clr-primary)' }} />
                  <h3 className="card-title">{sec.section_name}</h3>
                </div>
                <div style={{ display: 'flex', gap: 12 }}>
                  <span className="badge badge-success">{sec.pending} Available</span>
                  <span className="badge badge-secondary">{sec.completed} Sold</span>
                </div>
              </div>

              <div style={{ padding: 20 }}>
                {sectionPending.length === 0 ? (
                  <div style={{ textAlign: 'center', color: 'var(--text-light)', fontSize: 13, padding: '20px 0' }}>
                    Successfully sold all units in this section
                  </div>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 16 }}>
                    {sectionPending.map((item) => (
                      <div 
                        key={item.inventory_id} 
                        className="shop-inv-card" 
                        onClick={() => setSelectedItem(item)}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: 13, fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {item.product_name}
                            </div>
                            <div className="mono" style={{ fontSize: 11, color: 'var(--text-light)', marginTop: 2 }}>
                              #{item.serial_number.slice(-12).toUpperCase()}
                            </div>
                            <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--clr-primary)', marginTop: 12 }}>
                              ₹{parseFloat(item.total_price).toLocaleString('en-IN')}
                            </div>
                          </div>
                          <div style={{ padding: 8, background: 'var(--clr-primary-light)', color: 'var(--clr-primary)', borderRadius: 8 }}>
                            <HiOutlineDeviceMobile style={{ fontSize: 18 }} />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })
      )}

      {/* Item Details Modal */}
      <Modal
        open={!!selectedItem}
        onClose={() => setSelectedItem(null)}
        title="Product Information"
        footer={
          <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', width: '100%' }}>
            <button className="btn btn-secondary" onClick={() => setSelectedItem(null)}>Close</button>
            <button className="btn btn-primary" onClick={handleDownloadQR}>
              <HiOutlineDownload /> Download QR
            </button>
          </div>
        }
      >
        {selectedItem && (
          <div style={{ textAlign: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, justifyContent: 'center', marginBottom: 16 }}>
              <div style={{ 
                width: 40, height: 40, background: 'var(--indigo-50)', color: 'var(--clr-primary)',
                borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20
              }}>
                <HiOutlineCube />
              </div>
              <div style={{ textAlign: 'left' }}>
                <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>
                  {selectedItem.product_name}
                </h2>
                <div className="mono" style={{ fontSize: 11, color: 'var(--text-light)' }}>
                  {selectedItem.product_id}
                </div>
              </div>
            </div>

            <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--success)', marginBottom: 24 }}>
              ₹{parseFloat(selectedItem.total_price).toLocaleString('en-IN')}
            </div>

            <div style={{ 
              background: 'white', padding: 24, borderRadius: 20, 
              border: '1px solid var(--border-main)', display: 'inline-block', 
              boxShadow: '0 4px 12px rgba(0,0,0,0.05)', marginBottom: 32 
            }}>
              <QRCodeCanvas
                id="qr-canvas"
                value={`${window.location.origin}/buy/${selectedItem.qr_token}`}
                size={220}
                level="H"
                includeMargin={true}
              />
              <div style={{ marginTop: 12, fontSize: 11, color: 'var(--text-light)', fontWeight: 600 }}>
                SCAN TO PURCHASE
              </div>
            </div>

            <div style={{ border: '1px solid var(--border-main)', borderRadius: 12, overflow: 'hidden', textAlign: 'left' }}>
              <div style={{ padding: '12px 16px', background: '#fafafa', borderBottom: '1px solid var(--border-main)', fontSize: 12, fontWeight: 700 }}>
                Inventory Record
              </div>
              {[
                { l: 'Product ID', v: selectedItem.product_id },
                { l: 'Serial No', v: selectedItem.serial_number.toUpperCase(), m: true },
                { l: 'QR Token', v: selectedItem.qr_token.slice(0, 16) + '...', m: true }
              ].map((row, i) => (
                <div key={i} style={{ 
                  display: 'flex', justifyContent: 'space-between', padding: '12px 16px',
                  borderBottom: i < 2 ? '1px solid var(--border-main)' : 'none',
                  fontSize: 13
                }}>
                  <span style={{ color: 'var(--text-light)' }}>{row.l}</span>
                  <span style={{ 
                    fontWeight: 600, color: 'var(--text-main)',
                    fontFamily: row.m ? 'var(--font-mono)' : 'inherit'
                  }}>
                    {row.v}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
