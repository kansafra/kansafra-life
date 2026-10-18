'use client';


import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { getSession } from '@/lib/auth';
import { notifyOrderStatus } from '@/lib/notify';

const STATUS_LABELS = {
  new: 'جديد',
  preparing: 'قيد التحضير',
  delivering: 'يوجد التوصيل',
  done: 'مكتمل',
  cancelled: 'ملغي',
};

const NEXT_STATUS = {
  new: 'preparing',
  preparing: 'delivering',
  delivering: 'done',
};

export default function MerchantOrders() {
  const router = useRouter();
  const [entity, setEntity] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    let stored = null;
    try {
      const raw = localStorage.getItem('sanad_entity');
      if (raw) stored = JSON.parse(raw);
    } catch {}
    if (!stored) { router.replace('/login'); return; }
    setEntity(stored);
    load(stored);
  }, [router]);

  async function load(ent) {
    if (!supabase) { setLoading(false); return; }
    try {
      const { data } = await supabase
        .from('orders')
        .select('*')
        .eq('provider_name', ent.display_name)
        .order('created_at', { ascending: false });
      if (Array.isArray(data)) setOrders(data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }

  async function advanceStatus(order) {
    const next = NEXT_STATUS[order.status];
    if (!next) return;
    const { error: err } = await supabase.from('orders').update({ status: next }).eq('id', order.id);
    if (!err) {
      // ═══ إشعار للعميل ═══
      try {
        await notifyOrderStatus(order.customer_phone, order.order_code, next);
      } catch (e) { console.warn('notify failed:', e); }
    }
    if (err) { alert('تعذّر التحديث'); return; }
    setOrders((arr) => arr.map((o) => o.id === order.id ? { ...o, status: next } : o));
  }

  async function cancelOrder(order) {
    if (!confirm('إلغاء الطلب؟')) return;
    const { error: err } = await supabase.from('orders').update({ status: 'cancelled' }).eq('id', order.id);
    if (err) { alert('تعذّر الإلغاء'); return; }
    setOrders((arr) => arr.map((o) => o.id === order.id ? { ...o, status: 'cancelled' } : o));
  }

  const filtered = filter === 'all' ? orders : orders.filter((o) => o.status === filter);

  return (
    <div className="prod-page">
      <header className="prod-header">
        <Link href="/merchant" className="prod-back">→</Link>
        <span className="prod-header-title">الطلبات</span>
        <span style={{ width: 40 }} />
      </header>

      <div className="store-cat-scroll" style={{ paddingTop: 14 }}>
        {[
          { k: 'all', l: 'الكل' },
          { k: 'new', l: 'جديد' },
          { k: 'preparing', l: 'قيد التحضير' },
          { k: 'delivering', l: 'يوجد التوصيل' },
          { k: 'done', l: 'مكتمل' },
          { k: 'cancelled', l: 'ملغي' },
        ].map((f) => (
          <button
            key={f.k}
            className={`store-cat-chip ${filter === f.k ? 'active' : ''}`}
            onClick={() => setFilter(f.k)}
            type="button"
          >
            {f.l}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="ol-empty-state" style={{ padding: 60 }}>
          <span className="em">⏳</span>
          <p>جارٍ التحميل...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="ol-empty-state" style={{ padding: 60 }}>
          <span className="em">📦</span>
          <p>لا توجد طلبات يوجد هذه الحالة</p>
        </div>
      ) : (
        <div className="orders-list">
          {filtered.map((o) => {
            const items = Array.isArray(o.items) ? o.items : [];
            return (
              <div key={o.id} className={`order-card status-${o.status}`}>
                <div className="order-head">
                  <span className="order-code">{o.order_code}</span>
                  <span className={`order-status ${o.status}`}>{STATUS_LABELS[o.status] || o.status}</span>
                </div>
                <div className="order-customer">{o.customer_name}</div>
                <div className="order-phone">{o.customer_phone}</div>
                <div className="order-items-preview">
                  {items.slice(0, 3).map((it, i) => (
                    <div key={i}>{it.qty}× {it.title}</div>
                  ))}
                  {items.length > 3 && <div>+{items.length - 3} أكثر</div>}
                </div>
                <div className="order-total">{Number(o.total).toLocaleString()} {o.currency}</div>
                <div className="order-actions">
                  <Link href={`/invoice/${o.id}`} className="order-action-view" style={{ display:'flex', alignItems:'center', justifyContent:'center' }}>
                    🧾 الفاتورة
                  </Link>
                  {NEXT_STATUS[o.status] && (
                    <button className="order-action-advance" onClick={() => advanceStatus(o)} type="button">
                      ← {STATUS_LABELS[NEXT_STATUS[o.status]]}
                    </button>
                  )}
                  {o.status === 'new' && (
                    <button
                      onClick={() => cancelOrder(o)}
                      type="button"
                      style={{ flex:0, padding:'10px 14px', background:'rgba(220,38,38,.1)', color:'#dc2626' }}
                    >
                      ✕
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
