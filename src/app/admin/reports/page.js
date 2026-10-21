'use client';
import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

const RANGES = [
  { key: 'today', label: 'اليوم' },
  { key: 'week', label: '٧ أيام' },
  { key: 'month', label: '٣٠ يوم' },
  { key: 'year', label: 'سنة' },
  { key: 'all', label: 'الكل' },
];

function getStartDate(range) {
  const now = new Date();
  switch (range) {
    case 'today': { const d = new Date(now); d.setHours(0, 0, 0, 0); return d; }
    case 'week':  { const d = new Date(now); d.setDate(now.getDate() - 7); return d; }
    case 'month': { const d = new Date(now); d.setDate(now.getDate() - 30); return d; }
    case 'year':  { const d = new Date(now); d.setFullYear(now.getFullYear() - 1); return d; }
    default: return null;
  }
}

export default function AdminReportsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState('month');
  const [orders, setOrders] = useState([]);
  const [totalCustomers, setTotalCustomers] = useState(0);
  const [totalEntities, setTotalEntities] = useState(0);

  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem('sanad_admin') || 'null');
    if (!stored) { router.replace('/admin/login'); return; }
    loadData();
  }, [router]);

  async function loadData() {
    if (!supabase) return;
    try {
      const [ordersRes, customersRes, entitiesRes] = await Promise.all([
        supabase.from('orders').select('*').order('created_at', { ascending: false }).limit(2000),
        supabase.from('customers').select('id', { count: 'exact', head: true }),
        supabase.from('entities').select('id', { count: 'exact', head: true }),
      ]);
      setOrders(ordersRes.data || []);
      setTotalCustomers(customersRes.count || 0);
      setTotalEntities(entitiesRes.count || 0);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }

  const filteredOrders = useMemo(() => {
    const start = getStartDate(range);
    if (!start) return orders;
    return orders.filter(o => o.created_at && new Date(o.created_at) >= start);
  }, [orders, range]);

  const stats = useMemo(() => {
    const valid = filteredOrders.filter(o => o.status !== 'cancelled');
    const revenue = valid.reduce((s, o) => s + Number(o.total || 0), 0);
    const count = valid.length;
    const avg = count > 0 ? Math.round(revenue / count) : 0;
    const unique = new Set(valid.map(o => o.customer_phone).filter(Boolean)).size;
    return { revenue, count, avg, unique };
  }, [filteredOrders]);

  const topProducts = useMemo(() => {
    const map = {};
    filteredOrders.filter(o => o.status !== 'cancelled').forEach(o => {
      (Array.isArray(o.items) ? o.items : []).forEach(it => {
        const key = it.title || 'غير معروف';
        if (!map[key]) map[key] = { title: key, qty: 0, revenue: 0 };
        map[key].qty += Number(it.qty || 0);
        map[key].revenue += Number(it.price || 0) * Number(it.qty || 0);
      });
    });
    return Object.values(map).sort((a, b) => b.qty - a.qty).slice(0, 5);
  }, [filteredOrders]);

  const topStores = useMemo(() => {
    const map = {};
    filteredOrders.filter(o => o.status !== 'cancelled').forEach(o => {
      const key = o.provider_name || 'غير معروف';
      if (!map[key]) map[key] = { name: key, orders: 0, revenue: 0 };
      map[key].orders++;
      map[key].revenue += Number(o.total || 0);
    });
    return Object.values(map).sort((a, b) => b.revenue - a.revenue).slice(0, 5);
  }, [filteredOrders]);

  if (loading) return <div style={{ padding: 80, textAlign: 'center' }}>⏳ جارٍ التحميل...</div>;

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', paddingBottom: 40 }}>
      <div style={{ background: '#0f172a', padding: '16px 20px', position: 'sticky', top: 0, zIndex: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
          <Link href="/admin" style={{ color: '#fff', textDecoration: 'none', fontSize: 20 }}>→</Link>
          <h1 style={{ color: '#fff', fontSize: 18, fontWeight: 900, margin: 0, flex: 1 }}>📊 التقارير والإحصائيات</h1>
        </div>
        <div style={{ display: 'flex', gap: 6, overflowX: 'auto' }}>
          {RANGES.map(r => (
            <button key={r.key} onClick={() => setRange(r.key)} style={{ background: range === r.key ? '#fff' : 'rgba(255,255,255,0.1)', color: range === r.key ? '#0f172a' : '#fff', border: 'none', padding: '8px 16px', borderRadius: 20, fontSize: 12, fontWeight: 900, cursor: 'pointer', whiteSpace: 'nowrap', fontFamily: 'inherit' }}>
              {r.label}
            </button>
          ))}
        </div>
      </div>

      <div style={{ padding: 16 }}>
        
        {/* Stats Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10, marginBottom: 16 }}>
          <StatCard icon="💰" label="الإيرادات" value={stats.revenue.toLocaleString()} suffix="SYP" color="#10b981" />
          <StatCard icon="🛒" label="الطلبات" value={stats.count} color="#3b82f6" />
          <StatCard icon="📊" label="متوسط الطلب" value={stats.avg.toLocaleString()} suffix="SYP" color="#8b5cf6" />
          <StatCard icon="👥" label="عملاء نشطون" value={stats.unique} color="#f59e0b" />
        </div>

        {/* Global Info */}
        <div style={{ background: 'linear-gradient(135deg, #0f4d3a, #075640)', borderRadius: 16, padding: 16, marginBottom: 16, color: '#fff', display: 'flex', justifyContent: 'space-around' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 22, fontWeight: 900 }}>{totalEntities}</div>
            <div style={{ fontSize: 11, opacity: 0.8, fontWeight: 700 }}>متجر مسجل</div>
          </div>
          <div style={{ width: 1, background: 'rgba(255,255,255,0.2)' }} />
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 22, fontWeight: 900 }}>{totalCustomers}</div>
            <div style={{ fontSize: 11, opacity: 0.8, fontWeight: 700 }}>عميل مسجل</div>
          </div>
          <div style={{ width: 1, background: 'rgba(255,255,255,0.2)' }} />
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 22, fontWeight: 900 }}>{orders.length}</div>
            <div style={{ fontSize: 11, opacity: 0.8, fontWeight: 700 }}>إجمالي الطلبات</div>
          </div>
        </div>

        {/* Top Products */}
        <div style={{ background: '#fff', borderRadius: 16, padding: 16, marginBottom: 16, border: '1px solid #e2e8f0' }}>
          <h2 style={{ fontSize: 14, fontWeight: 900, color: '#0f172a', marginTop: 0, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 6 }}>🔥 أفضل المنتجات مبيعاً</h2>
          {topProducts.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 20, color: '#94a3b8', fontSize: 12 }}>لا توجد بيانات للفترة المحددة</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {topProducts.map((p, i) => {
                const maxQty = topProducts[0].qty;
                const percent = maxQty > 0 ? (p.qty / maxQty) * 100 : 0;
                return (
                  <div key={i}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 6 }}>
                      <span style={{ fontWeight: 800, color: '#1e293b' }}>{i + 1}. {p.title}</span>
                      <span style={{ color: '#64748b', fontWeight: 900 }}>{p.qty} قطعة</span>
                    </div>
                    <div style={{ height: 8, background: '#f1f5f9', borderRadius: 4, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${percent}%`, background: 'linear-gradient(90deg, #10b981, #059669)', borderRadius: 4, transition: 'width 0.5s' }} />
                    </div>
                    <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 4, textAlign: 'left' }}>{p.revenue.toLocaleString()} SYP</div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Top Stores */}
        <div style={{ background: '#fff', borderRadius: 16, padding: 16, border: '1px solid #e2e8f0' }}>
          <h2 style={{ fontSize: 14, fontWeight: 900, color: '#0f172a', marginTop: 0, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 6 }}>🏆 أفضل المتاجر</h2>
          {topStores.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 20, color: '#94a3b8', fontSize: 12 }}>لا توجد بيانات للفترة المحددة</div>
          ) : (
            topStores.map((s, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: i < topStores.length - 1 ? '1px solid #f1f5f9' : 'none' }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: i === 0 ? '#fbbf24' : i === 1 ? '#94a3b8' : i === 2 ? '#d97706' : '#e2e8f0', color: i < 3 ? '#fff' : '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: 14 }}>
                  {i + 1}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 900, color: '#1e293b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.name}</div>
                  <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>{s.orders} طلب</div>
                </div>
                <div style={{ textAlign: 'left' }}>
                  <div style={{ fontSize: 13, fontWeight: 900, color: '#0f4d3a' }}>{s.revenue.toLocaleString()}</div>
                  <div style={{ fontSize: 9, color: '#94a3b8' }}>SYP</div>
                </div>
              </div>
            ))
          )}
        </div>

      </div>
    </div>
  );
}

function StatCard({ icon, label, value, suffix, color }) {
  return (
    <div style={{ background: '#fff', borderRadius: 14, padding: 14, border: '1px solid #e2e8f0' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
        <div style={{ fontSize: 18 }}>{icon}</div>
        <div style={{ fontSize: 10, color: '#64748b', fontWeight: 800 }}>{label}</div>
      </div>
      <div style={{ fontSize: 18, fontWeight: 900, color }}>
        {value}
        {suffix && <span style={{ fontSize: 10, marginLeft: 4, color: '#94a3b8' }}>{suffix}</span>}
      </div>
    </div>
  );
}
