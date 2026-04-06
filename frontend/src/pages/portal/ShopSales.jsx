import { useEffect, useState } from 'react';
import { getShopPortalSales } from '../../api/client';
import { Loader, EmptyState } from '../../components/Shared';
import Pagination from '../../components/Pagination';
import { HiOutlineTrendingUp, HiOutlineTag } from 'react-icons/hi';

export default function ShopSales() {
  const [sales, setSales] = useState([]);
  const [meta, setMeta] = useState({ page: 1, total_pages: 1, total: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSales(1);
  }, []);

  async function fetchSales(page) {
    setLoading(true);
    try {
      const res = await getShopPortalSales(page);
      setSales(res.data.items);
      setMeta(res.data.meta);
    } catch (err) {
      console.error('Failed to load sales', err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Sales Performance</h1>
          <p>{meta.total} successful transactions recorded</p>
        </div>
      </div>

      {loading ? (
        <Loader />
      ) : sales.length === 0 ? (
        <EmptyState 
          icon={<HiOutlineTrendingUp />} 
          title="No Sales Recorded" 
          message="Once products are sold, their transaction history will appear here." 
        />
      ) : (
        <>
          <div className="table-container animate-in">
            <table>
              <thead>
                <tr>
                  <th>Product Details</th>
                  <th>Serial Number</th>
                  <th>Amount</th>
                  <th>Transaction Time</th>
                </tr>
              </thead>
              <tbody>
                {sales.map((sale, i) => (
                  <tr key={sale.inventory_id || i}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <HiOutlineTag style={{ color: 'var(--clr-primary)', fontSize: 16 }} />
                        <div>
                          <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>{sale.product_name}</div>
                          <div className="mono" style={{ fontSize: 11, color: 'var(--text-light)' }}>{sale.product_id}</div>
                        </div>
                      </div>
                    </td>
                    <td className="mono" style={{ fontSize: 12 }}>
                      {sale.serial_number?.slice(-12).toUpperCase()}
                    </td>
                    <td style={{ fontWeight: 700, color: 'var(--success)' }}>
                      ₹{sale.total_price?.toLocaleString('en-IN')}
                    </td>
                    <td style={{ fontSize: 13, color: 'var(--text-light)' }}>
                      {sale.sold_at ? new Date(sale.sold_at).toLocaleString() : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div style={{ marginTop: 24, display: 'flex', justifyContent: 'center' }}>
            <Pagination page={meta.page} totalPages={meta.total_pages} onPageChange={fetchSales} />
          </div>
        </>
      )}
    </div>
  );
}
