'use client';


import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

export default function MerchantInvoices() {
  const router = useRouter();
  const [entity, setEntity] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    let stored = null;
    try { stored = JSON.parse(localStorage.getItem('sanad_entity') || 'null'); } catch {}
    if (!stored) { router.replace('/login'); return; }
    setEntity(stored);
    load(stored);
  }, [router]);

  async function load(ent) {
    if (!supabase) { setLoading(false); return; }
    const { data } = await supabase
      .from('orders')
      .select('*')
      .eq('provider_name', ent.display_name)
      .order('created_at', { ascending: false });
    setOrders(Array.isArray(data) ? data : []);
    setLoading(false);
  }

  const filtered = orders.filter((o) => {
    if (!search.trim()) return true;
    const q = search.trim().toLowerCase();
    return (o.order_code || '').toLowerCase().includes(q)
        || (o.customer_name || '').toLowerCase().includes(q)
        || (o.customer_phone || '').includes(q);
  });

  const totalRevenue = orders.reduce((s, x) => s + (Number(x.total) || 0), 0);

  if (!entity) return <div className="sect-empty" style={{ padding: 80 }}><span className="em">⏳</span></div>;

  return (
    <div className="inv-page">
      <div className="inv-header">
        <Link href="/merchant" className="inv-back">→</Link>
        <span className="inv-title">🧾 الفواتير</span>
        <span className="mng-count">{orders.length}</span>
      </div>

      <div style={{ padding: '16px 20px 0', fontSize: 12, color: 'var(--n-500)', fontWeight: 600 }}>
        إجمالي الإيرادات: <strong style={{ color: 'var(--f-700)', fontSize: 14 }}>{totalRevenue.toLocaleString()} ل.س</strong>
      </div>

      <div style={{ padding: '14px 20px 0' }}>
        <div className="search-box">
          <span className="ico">⌕</span>
          <input type="text" placeholder="ابحث برقم الطلب أو اسم العميل..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
      </div>

      {loading ? (
        <div className="sect-empty"><span className="em">⏳</span></div>
      ) : filtered.length === 0 ? (
        <div className="sect-empty"><span className="em">🧾</span><p>لا توجد فواتير</p></div>
      ) : (
        <div className="inv-list">
          {filtered.map((o) => (
            <Link key={o.id} href={`/invoice/${o.id}`} className="inv-item">
              <div className="inv-item-icon">🧾</div>
              <div className="inv-item-body">
                <div className="inv-code">{o.order_code}</div>
                <div className="inv-customer">{o.customer_name} · {o.customer_phone}</div>
                <div style={{ fontSize: 10.5, color: 'var(--n-400)', fontWeight: 600, marginTop: 3 }}>
                  {new Date(o.created_at).toLocaleString('ar-EG', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
              <div className="inv-amount">{Number(o.total || 0).toLocaleString()}</div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
