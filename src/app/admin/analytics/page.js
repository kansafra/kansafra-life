'use client';
import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/components/Toast';
import { SkeletonList } from '@/components/Skeleton';

export default function AdminAnalytics() {
  const router = useRouter();
  const { error: tE } = useToast();
  const [loading, setLoading] = useState(true);
  const [entities, setEntities] = useState([]);
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [services, setServices] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [period, setPeriod] = useState('month');

  useEffect(() => {
    let stored = null;
    try { stored = JSON.parse(localStorage.getItem('sanad_admin') || 'null'); } catch {}
    if (!stored) { router.replace('/admin/login'); return; }
    load();
  }, [router]);

  async function load() {
    if (!supabase) { setLoading(false); return; }
    try {
      const [e, o, p, s, r] = await Promise.all([
        supabase.from('entities').select('*'),
        supabase.from('orders').select('*').order('created_at', { ascending: false }).limit(500),
        supabase.from('products').select('id', { count: 'exact', head: true }),
        supabase.from('services').select('id', { count: 'exact', head: true }),
        supabase.from('reviews').select('rating'),
      ]);
      setEntities(e.data || []);
      setOrders(o.data || []);
      setProducts(p.count || 0);
      setServices(s.count || 0);
      setReviews(r.data || []);
    } catch (err) { tE('تعذّر التحميل'); }
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
    const avgRating = reviews.length > 0 ? (reviews.reduce((s, r) => s + Number(r.rating || 0), 0) / reviews.length).toFixed(1) : '0.0';
    return {
      revenue,
      orders: periodOrders.length,
      entities: entities.length,
      products,
      services,
      avgRating,
      pending: entities.filter(e => e.approval_status === 'pending').length,
      activeEntities: entities.filter(e => e.is_active).length,
    };
  }, [periodOrders, entities, products, services, reviews]);

  const chartData = useMemo(() => {
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      d.setHours(0,0,0,0);
      const next = new Date(d);
      next.setDate(next.getDate() + 1);
      const total = orders.filter(o => o.status === 'done' && new Date(o.created_at) >= d && new Date(o.created_at) < next).reduce((s, o) => s + Number(o.total || 0), 0);
      days.push({ label: d.toLocaleDateString('ar-EG', { weekday: 'short' }), value: total });
    }
    return days;
  }, [orders]);
  const maxChart = Math.max(...chartData.map(d => d.value), 1);

  const topEntities = useMemo(() => {
    const counts = {};
    periodOrders.filter(o => o.status === 'done').forEach(o => {
      if (!counts[o.provider_name]) counts[o.provider_name] = { name: o.provider_name, revenue: 0, orders: 0 };
      counts[o.provider_name].revenue += Number(o.total || 0);
      counts[o.provider_name].orders++;
    });
    return Object.values(counts).sort((a, b) => b.revenue - a.revenue).slice(0, 10);
  }, [periodOrders]);

  const typeDist = useMemo(() => {
    const dist = {};
    entities.forEach(e => { dist[e.entity_type || 'other'] = (dist[e.entity_type || 'other'] || 0) + 1; });
    return Object.entries(dist).sort((a, b) => b[1] - a[1]);
  }, [entities]);

  if (loading) return <div style={{ padding: 16, background: '#f8fafc', minHeight: '100vh' }}><SkeletonList count={5} /></div>;

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', paddingBottom: 40 }}>
      <div style={{ position: 'sticky', top: 0, zIndex: 10, background: '#0f4d3a', padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <Link href="/admin" style={{ color: '#fff', textDecoration: 'none', fontSize: 20, width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,.1)', borderRadius: '50%' }}>→</Link>
        <div style={{ flex: 1, color: '#fff', fontSize: 16, fontWeight: 900 }}>📊 تحليلات المنصة</div>
      </div>

      <div style={{ padding: 16 }}>
        <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 8, marginBottom: 12 }}>
          {[['all','الكل'],['week','7 أيام'],['month','30 يوم'],['year','سنة']].map(([k,l]) => (
            <button key={k} onClick={() => setPeriod(k)} style={{ padding: '8px 16px', background: period === k ? '#0f4d3a' : '#fff', color: period === k ? '#fff' : '#64748b', border: `1px solid ${period === k ? '#0f4d3a' : '#e5e7eb'}`, borderRadius: 10, fontSize: 12, fontWeight: 800, cursor: 'pointer', whiteSpace: 'nowrap', fontFamily: 'inherit' }}>{l}</button>
          ))}
        </div>

        <div style={{ background: 'linear-gradient(135deg,#0f4d3a,#075640)', borderRadius: 18, padding: 22, color: '#fff', marginBottom: 16 }}>
          <div style={{ fontSize: 11, opacity: 0.85, marginBottom: 8 }}>إجمالي إيرادات المنصة</div>
          <div style={{ fontSize: 32, fontWeight: 900 }}>{kpis.revenue.toLocaleString()} <span style={{ fontSize: 14, opacity: 0.8 }}>SYP</span></div>
          <div style={{ display: 'flex', gap: 20, marginTop: 14, fontSize: 11, opacity: 0.8 }}>
            <div>📦 {kpis.orders} طلب</div>
            <div>⭐ {kpis.avgRating} متوسط التقييم</div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10, marginBottom: 16 }}>
          <div style={{ background: '#fff', borderRadius: 14, padding: 14, border: '1px solid #e5e7eb' }}>
            <div style={{ fontSize: 10, color: '#64748b', marginBottom: 6 }}>المزودون</div>
            <div style={{ fontSize: 24, fontWeight: 900, color: '#0f4d3a' }}>{kpis.entities}</div>
            <div style={{ fontSize: 10, color: '#10b981', fontWeight: 800, marginTop: 4 }}>{kpis.activeEntities} نشط</div>
          </div>
          <div style={{ background: '#fff', borderRadius: 14, padding: 14, border: '1px solid #e5e7eb' }}>
            <div style={{ fontSize: 10, color: '#64748b', marginBottom: 6 }}>المنتجات</div>
            <div style={{ fontSize: 24, fontWeight: 900, color: '#0f4d3a' }}>{kpis.products}</div>
            <div style={{ fontSize: 10, color: '#64748b', marginTop: 4 }}>{kpis.services} خدمة</div>
          </div>
          <div style={{ background: '#fff', borderRadius: 14, padding: 14, border: '1px solid #e5e7eb' }}>
            <div style={{ fontSize: 10, color: '#64748b', marginBottom: 6 }}>قيد المراجعة</div>
            <div style={{ fontSize: 24, fontWeight: 900, color: '#f59e0b' }}>{kpis.pending}</div>
            <Link href="/admin/entities" style={{ fontSize: 10, color: '#f59e0b', fontWeight: 800, textDecoration: 'none', marginTop: 4, display: 'inline-block' }}>عرض ←</Link>
          </div>
          <div style={{ background: '#fff', borderRadius: 14, padding: 14, border: '1px solid #e5e7eb' }}>
            <div style={{ fontSize: 10, color: '#64748b', marginBottom: 6 }}>التقييمات</div>
            <div style={{ fontSize: 24, fontWeight: 900, color: '#fbbf24' }}>{reviews.length}</div>
            <div style={{ fontSize: 10, color: '#64748b', marginTop: 4 }}>متوسط {kpis.avgRating}★</div>
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

        {topEntities.length > 0 && (
          <div style={{ background: '#fff', borderRadius: 16, padding: 16, border: '1px solid #e5e7eb', marginBottom: 16 }}>
            <div style={{ fontSize: 14, fontWeight: 900, marginBottom: 14 }}>🏆 أعلى المتاجر إيراداً</div>
            {topEntities.map((e, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: i < topEntities.length - 1 ? '1px solid #f1f5f9' : 'none' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 24, height: 24, borderRadius: '50%', background: i === 0 ? '#fbbf24' : i === 1 ? '#cbd5e1' : i === 2 ? '#d97706' : '#f1f5f9', color: i < 3 ? '#fff' : '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 900 }}>{i + 1}</div>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 800 }}>{e.name}</div>
                    <div style={{ fontSize: 10, color: '#64748b' }}>{e.orders} طلب</div>
                  </div>
                </div>
                <div style={{ fontSize: 12, fontWeight: 900, color: '#0f4d3a' }}>{e.revenue.toLocaleString()}</div>
              </div>
            ))}
          </div>
        )}

        {typeDist.length > 0 && (
          <div style={{ background: '#fff', borderRadius: 16, padding: 16, border: '1px solid #e5e7eb' }}>
            <div style={{ fontSize: 14, fontWeight: 900, marginBottom: 12 }}>📊 توزيع المزودين حسب النوع</div>
            {typeDist.slice(0, 10).map(([type, count]) => {
              const pct = (count / entities.length) * 100;
              return (
                <div key={type} style={{ marginBottom: 10 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 4 }}>
                    <span style={{ fontWeight: 800 }}>{type}</span>
                    <span style={{ color: '#64748b' }}>{count}</span>
                  </div>
                  <div style={{ height: 6, background: '#f1f5f9', borderRadius: 3, overflow: 'hidden' }}>
                    <div style={{ width: `${pct}%`, height: '100%', background: 'linear-gradient(90deg,#10b981,#059669)' }} />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
