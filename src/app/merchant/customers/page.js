'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

export default function CustomersPage() {
  const router = useRouter();
  const [entity, setEntity] = useState(null);
  const [customers, setCustomers] = useState([]);
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
    if (!supabase) return;
    const { data } = await supabase
      .from('orders')
      .select('customer_name,customer_phone,total,created_at')
      .eq('provider_name', ent.display_name);

    // تجميع حسب اسم العميل
    const map = {};
    (data || []).forEach((o) => {
      const key = o.customer_phone || o.customer_name;
      if (!map[key]) {
        map[key] = { name: o.customer_name, phone: o.customer_phone, orders: 0, total: 0, last: o.created_at };
      }
      map[key].orders++;
      map[key].total += Number(o.total) || 0;
      if (o.created_at > map[key].last) map[key].last = o.created_at;
    });

    setCustomers(Object.values(map).sort((a, b) => b.total - a.total));
    setLoading(false);
  }

  const filtered = customers.filter((c) => {
    if (!search.trim()) return true;
    const q = search.trim().toLowerCase();
    return (c.name || '').toLowerCase().includes(q) || (c.phone || '').includes(q);
  });

  if (!entity) return <div className="sect-empty" style={{ padding: 80 }}><span className="em">⏳</span></div>;

  return (
    <div className="mng-page">
      <div className="mng-header">
        <Link href="/merchant" className="mng-back">→</Link>
        <span className="mng-title">👥 العملاء</span>
        <span className="mng-count">{customers.length}</span>
      </div>

      <div style={{ padding: '14px 20px 0' }}>
        <input
          className="new-service-input"
          placeholder="ابحث بالاسم أو الهاتف..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {loading ? (
        <div className="sect-empty"><span className="em">⏳</span></div>
      ) : filtered.length === 0 ? (
        <div className="sect-empty">
          <span className="em">👥</span>
          <p>لا يوجد عملاء بعد</p>
          <p style={{ fontSize: 12, marginTop: 8, color: 'var(--n-400)' }}>سيظهر العملاء تلقائياً عند استلام الطلبات</p>
        </div>
      ) : (
        <div style={{ padding: 20 }}>
          {filtered.map((c, i) => (
            <div key={i} className="customer-card">
              <div className="customer-head">
                <div className="customer-name">{c.name}</div>
                {c.phone && <a href={`tel:${c.phone}`} className="mng-btn edit" style={{ textDecoration: 'none', padding: '6px 12px', fontSize: 11.5 }}>📞</a>}
              </div>
              {c.phone && (
                <div style={{ fontSize: 12, color: 'var(--n-500)', direction: 'ltr', textAlign: 'right', fontFamily: 'monospace' }}>
                  {c.phone}
                </div>
              )}
              <div className="customer-stats">
                <span>🛍️ <strong>{c.orders}</strong> طلب</span>
                <span>💰 <strong>{c.total.toLocaleString()}</strong> ل.س</span>
              </div>
              <div style={{ fontSize: 10.5, color: 'var(--n-400)', marginTop: 6 }}>
                آخر طلب: {new Date(c.last).toLocaleDateString('ar-EG')}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
