'use client';
import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/components/Toast';
import { SkeletonList } from '@/components/Skeleton';
import EmptyState from '@/components/EmptyState';

const STATUS = {
  new: { label: 'جديد', color: '#3b82f6', icon: '🆕' },
  preparing: { label: 'قيد التحضير', color: '#f59e0b', icon: '👨‍🍳' },
  delivering: { label: 'قيد التوصيل', color: '#8b5cf6', icon: '🚚' },
  done: { label: 'مكتمل', color: '#10b981', icon: '✅' },
  cancelled: { label: 'ملغي', color: '#ef4444', icon: '❌' },
};

export default function CustomerOrders() {
  const router = useRouter();
  const { error: tE } = useToast();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    let customer = null;
    try { customer = JSON.parse(localStorage.getItem('sanad_customer') || 'null'); } catch {}
    if (!customer) { router.replace('/login'); return; }
    load(customer);
  }, [router]);

  async function load(customer) {
    if (!supabase) { setLoading(false); return; }
    try {
      const { data } = await supabase
        .from('orders')
        .select('*')
        .eq('customer_phone', customer.phone)
        .order('created_at', { ascending: false });
      setOrders(data || []);
    } catch (e) { tE('تعذّر التحميل'); }
    setLoading(false);
  }

  const filtered = useMemo(() => {
    if (filter === 'all') return orders;
    return orders.filter(o => o.status === filter);
  }, [orders, filter]);

  const stats = useMemo(() => {
    return {
      total: orders.length,
      pending: orders.filter(o => ['new', 'preparing', 'delivering'].includes(o.status)).length,
      done: orders.filter(o => o.status === 'done').length,
    };
  }, [orders]);

  if (loading) return <div style={{ padding: 16, background: '#f8fafc', minHeight: '100vh' }}><SkeletonList count={4} /></div>;

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', paddingBottom: 40 }}>
      <div style={{ position: 'sticky', top: 0, zIndex: 10, background: '#0f4d3a', padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <Link href="/customer" style={{ color: '#fff', textDecoration: 'none', fontSize: 20, width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,.1)', borderRadius: '50%' }}>→</Link>
        <div style={{ flex: 1, color: '#fff', fontSize: 16, fontWeight: 900 }}>🛍️ طلباتي ({stats.total})</div>
      </div>

      <div style={{ padding: 16 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 12 }}>
          <div style={{ background: '#fff', borderRadius: 12, padding: 12, textAlign: 'center', border: '1px solid #e5e7eb' }}>
            <div style={{ fontSize: 20, fontWeight: 900, color: '#0f4d3a' }}>{stats.total}</div>
            <div style={{ fontSize: 10, color: '#64748b', fontWeight: 700, marginTop: 2 }}>الكل</div>
          </div>
          <div style={{ background: '#fff', borderRadius: 12, padding: 12, textAlign: 'center', border: '1px solid #e5e7eb' }}>
            <div style={{ fontSize: 20, fontWeight: 900, color: '#f59e0b' }}>{stats.pending}</div>
            <div style={{ fontSize: 10, color: '#64748b', fontWeight: 700, marginTop: 2 }}>قيد التنفيذ</div>
          </div>
          <div style={{ background: '#fff', borderRadius: 12, padding: 12, textAlign: 'center', border: '1px solid #e5e7eb' }}>
            <div style={{ fontSize: 20, fontWeight: 900, color: '#10b981' }}>{stats.done}</div>
            <div style={{ fontSize: 10, color: '#64748b', fontWeight: 700, marginTop: 2 }}>مكتملة</div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 4 }}>
          {[['all','الكل'],['new','جديد'],['preparing','تحضير'],['delivering','توصيل'],['done','مكتمل'],['cancelled','ملغي']].map(([k,l]) => (
            <button key={k} onClick={() => setFilter(k)} style={{ padding: '8px 14px', background: filter === k ? '#0f4d3a' : '#fff', color: filter === k ? '#fff' : '#64748b', border: `1px solid ${filter === k ? '#0f4d3a' : '#e5e7eb'}`, borderRadius: 10, fontSize: 11.5, fontWeight: 800, cursor: 'pointer', whiteSpace: 'nowrap', fontFamily: 'inherit' }}>{l}</button>
          ))}
        </div>
      </div>

      <div style={{ padding: '0 16px' }}>
        {filtered.length === 0 ? <EmptyState icon="🛍️" title={filter === 'all' ? 'لا توجد طلبات' : 'لا توجد طلبات في هذه الحالة'} actionLabel="تصفح المتاجر" actionHref="/stores" /> : filtered.map(o => {
          const s = STATUS[o.status] || STATUS.new;
          return (
            <Link key={o.id} href={`/order/${o.id}`} style={{ display: 'block', background: '#fff', border: '1px solid #e5e7eb', borderRadius: 14, padding: 14, marginBottom: 10, textDecoration: 'none', color: 'inherit' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 900, fontFamily: 'monospace', color: '#0f172a', marginBottom: 4 }}>#{o.order_code}</div>
                  <div style={{ fontSize: 12, color: '#64748b' }}>🏪 {o.provider_name}</div>
                  <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 2 }}>{(o.items || []).length} منتج · {new Date(o.created_at).toLocaleDateString('ar-EG')}</div>
                </div>
                <div style={{ textAlign: 'left' }}>
                  <div style={{ fontSize: 16, fontWeight: 900, color: '#0f4d3a' }}>{Number(o.total || 0).toLocaleString()}</div>
                  <div style={{ fontSize: 10, color: '#64748b' }}>{o.currency || 'SYP'}</div>
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 10, borderTop: '1px solid #f1f5f9' }}>
                <span style={{ background: `${s.color}20`, color: s.color, padding: '3px 10px', borderRadius: 6, fontSize: 10.5, fontWeight: 900 }}>{s.icon} {s.label}</span>
                <span style={{ fontSize: 11, color: '#64748b', fontWeight: 800 }}>عرض التفاصيل →</span>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
