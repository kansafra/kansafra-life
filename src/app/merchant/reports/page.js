'use client';
import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { useCurrentUser } from '@/lib/useCurrentUser';
import { useToast } from '@/components/Toast';
import { SkeletonList } from '@/components/Skeleton';

export default function ReportsPage() {
  const router = useRouter();
  const { user, loading: userLoading, isOwner, isSectionAdmin, hasPermission, dataOwnerName } = useCurrentUser();
  const { error: toastError } = useToast();
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('month');

  useEffect(() => {
    if (userLoading) return;
    if (!user) { router.replace('/login'); return; }
    load();
  }, [user, userLoading]);

  async function load() {
    if (!supabase || !dataOwnerName) { setLoading(false); return; }
    try {
      let oq = supabase.from('orders').select('*').order('created_at', { ascending: false });
      let pq = supabase.from('products').select('*');
      let cq = supabase.from('customers').select('*');
      if (!isSectionAdmin) {
        oq = oq.eq('provider_name', dataOwnerName);
        pq = pq.eq('provider_name', dataOwnerName);
        cq = cq.eq('entity_name', dataOwnerName);
      }
      const [o, p, c] = await Promise.all([oq, pq, cq]);
      setOrders(o.data || []);
      setProducts(p.data || []);
      setCustomers(c.data || []);
    } catch (e) { toastError('تعذّر التحميل'); }
    setLoading(false);
  }

  const periodOrders = useMemo(() => {
    if (period === 'all') return orders;
    const now = new Date();
    const cutoff = new Date();
    if (period === 'week') cutoff.setDate(now.getDate() - 7);
    else if (period === 'month') cutoff.setMonth(now.getMonth() - 1);
    else if (period === 'year') cutoff.setFullYear(now.getFullYear() - 1);
    return orders.filter(o => new Date(o.created_at) >= cutoff);
  }, [orders, period]);

  const kpis = useMemo(() => {
    const done = periodOrders.filter(o => o.status === 'done');
    const revenue = done.reduce((s, o) => s + Number(o.total || 0), 0);
    return {
      revenue,
      done: done.length,
      pending: periodOrders.filter(o => ['new','preparing','delivering'].includes(o.status)).length,
      cancelled: periodOrders.filter(o => o.status === 'cancelled').length,
      avgOrder: done.length ? revenue / done.length : 0,
    };
  }, [periodOrders]);

  const topProducts = useMemo(() => {
    const counts = {};
    periodOrders.filter(o => o.status === 'done').forEach(o => {
      (o.items || []).forEach(it => {
        const k = it.title || 'منتج';
        if (!counts[k]) counts[k] = { title: k, qty: 0, revenue: 0 };
        counts[k].qty += Number(it.qty) || 0;
        counts[k].revenue += (Number(it.price) || 0) * (Number(it.qty) || 0);
      });
    });
    return Object.values(counts).sort((a, b) => b.revenue - a.revenue).slice(0, 5);
  }, [periodOrders]);

  const chartData = useMemo(() => {
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      d.setHours(0,0,0,0);
      const next = new Date(d);
      next.setDate(next.getDate() + 1);
      const total = orders
        .filter(o => o.status === 'done' && new Date(o.created_at) >= d && new Date(o.created_at) < next)
        .reduce((s, o) => s + Number(o.total || 0), 0);
      days.push({ label: d.toLocaleDateString('ar-EG', { weekday: 'short' }), value: total });
    }
    return days;
  }, [orders]);

  const maxChart = Math.max(...chartData.map(d => d.value), 1);

  if (!userLoading && user && !isOwner && !isSectionAdmin && !hasPermission('reports')) {
    return <div style={{ padding: 60, textAlign: 'center' }}>🔒 ليس لديك صلاحية</div>;
  }
  if (userLoading || (user && loading)) {
    return <div style={{ padding: 16, background: '#f8fafc', minHeight: '100vh' }}><SkeletonList count={4} /></div>;
  }
  if (!user) return null;

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', paddingBottom: 40 }}>
      <div style={{ background: '#0f4d3a', padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <Link href="/merchant" style={{ color: '#fff', textDecoration: 'none', fontSize: 20 }}>→</Link>
        <div style={{ flex: 1, color: '#fff', fontSize: 16, fontWeight: 900 }}>📊 التقارير</div>
      </div>

      <div style={{ padding: 16 }}>
        <div style={{ display: 'flex', gap: 8, overflowX: 'auto', marginBottom: 12 }}>
          {[['all','الكل'],['week','7 أيام'],['month','30 يوم'],['year','سنة']].map(([k,l]) => (
            <button key={k} onClick={() => setPeriod(k)} style={{
              padding: '8px 16px', background: period === k ? '#0f4d3a' : '#fff', color: period === k ? '#fff' : '#64748b',
              border: `1px solid ${period === k ? '#0f4d3a' : '#e5e7eb'}`, borderRadius: 10, fontSize: 12, fontWeight: 800,
              cursor: 'pointer', whiteSpace: 'nowrap', fontFamily: 'inherit',
            }}>{l}</button>
          ))}
        </div>

        <div style={{ background: 'linear-gradient(135deg,#10b981,#059669)', borderRadius: 18, padding: 20, color: '#fff', marginBottom: 16 }}>
          <div style={{ fontSize: 11, opacity: 0.85, marginBottom: 8 }}>إجمالي الإيرادات</div>
          <div style={{ fontSize: 28, fontWeight: 900 }}>{kpis.revenue.toLocaleString()} SYP</div>
          <div style={{ fontSize: 11, opacity: 0.75, marginTop: 8 }}>من {kpis.done} طلب مكتمل</div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10, marginBottom: 16 }}>
          <div style={{ background: '#fff', borderRadius: 14, padding: 14, border: '1px solid #e5e7eb' }}>
            <div style={{ fontSize: 10, color: '#64748b', marginBottom: 6 }}>مكتملة</div>
            <div style={{ fontSize: 22, fontWeight: 900, color: '#10b981' }}>{kpis.done}</div>
          </div>
          <div style={{ background: '#fff', borderRadius: 14, padding: 14, border: '1px solid #e5e7eb' }}>
            <div style={{ fontSize: 10, color: '#64748b', marginBottom: 6 }}>قيد التنفيذ</div>
            <div style={{ fontSize: 22, fontWeight: 900, color: '#f59e0b' }}>{kpis.pending}</div>
          </div>
          <div style={{ background: '#fff', borderRadius: 14, padding: 14, border: '1px solid #e5e7eb' }}>
            <div style={{ fontSize: 10, color: '#64748b', marginBottom: 6 }}>ملغاة</div>
            <div style={{ fontSize: 22, fontWeight: 900, color: '#ef4444' }}>{kpis.cancelled}</div>
          </div>
          <div style={{ background: '#fff', borderRadius: 14, padding: 14, border: '1px solid #e5e7eb' }}>
            <div style={{ fontSize: 10, color: '#64748b', marginBottom: 6 }}>متوسط الطلب</div>
            <div style={{ fontSize: 18, fontWeight: 900, color: '#3b82f6' }}>{Math.round(kpis.avgOrder).toLocaleString()}</div>
          </div>
        </div>

        <div style={{ background: '#fff', borderRadius: 16, padding: 16, border: '1px solid #e5e7eb', marginBottom: 16 }}>
          <div style={{ fontSize: 14, fontWeight: 900, marginBottom: 16 }}>📈 آخر 7 أيام</div>
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', height: 140, gap: 6 }}>
            {chartData.map((d, i) => {
              const h = (d.value / maxChart) * 100;
              return (
                <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                  <div style={{ flex: 1, width: '100%', display: 'flex', alignItems: 'flex-end' }}>
                    <div style={{ width: '100%', height: `${Math.max(h, 4)}%`, background: 'linear-gradient(180deg,#10b981,#059669)', borderRadius: '6px 6px 0 0', minHeight: 4 }} />
                  </div>
                  <div style={{ fontSize: 10, fontWeight: 700, color: '#64748b' }}>{d.label}</div>
                </div>
              );
            })}
          </div>
        </div>

        {topProducts.length > 0 && (
          <div style={{ background: '#fff', borderRadius: 16, padding: 16, border: '1px solid #e5e7eb', marginBottom: 16 }}>
            <div style={{ fontSize: 14, fontWeight: 900, marginBottom: 14 }}>🔥 الأكثر مبيعاً</div>
            {topProducts.map((p, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: i < topProducts.length - 1 ? '1px solid #f1f5f9' : 'none' }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 800 }}>{p.title}</div>
                  <div style={{ fontSize: 10, color: '#64748b' }}>{p.qty} مبيع</div>
                </div>
                <div style={{ fontSize: 13, fontWeight: 900, color: '#0f4d3a' }}>{p.revenue.toLocaleString()}</div>
              </div>
            ))}
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
          <div style={{ background: '#fff', borderRadius: 14, padding: 14, border: '1px solid #e5e7eb', textAlign: 'center' }}>
            <div style={{ fontSize: 20, fontWeight: 900 }}>{products.length}</div>
            <div style={{ fontSize: 10, color: '#64748b' }}>منتج</div>
          </div>
          <div style={{ background: '#fff', borderRadius: 14, padding: 14, border: '1px solid #e5e7eb', textAlign: 'center' }}>
            <div style={{ fontSize: 20, fontWeight: 900 }}>{customers.length}</div>
            <div style={{ fontSize: 10, color: '#64748b' }}>عميل</div>
          </div>
        </div>
      </div>
    </div>
  );
}
