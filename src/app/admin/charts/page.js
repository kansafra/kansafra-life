'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

export default function ChartsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [ordersByDay, setOrdersByDay] = useState([]);
  const [entitiesByType, setEntitiesByType] = useState({});
  const [revenueByMonth, setRevenueByMonth] = useState([]);
  const [categoriesCount, setCategoriesCount] = useState([]);

  useEffect(() => {
    let stored = null;
    try { stored = JSON.parse(localStorage.getItem('sanad_admin') || 'null'); } catch {}
    if (!stored) { router.replace('/admin/login'); return; }
    load();
  }, [router]);

  async function load() {
    if (!supabase) return;
    const [orders, ents, cats] = await Promise.all([
      supabase.from('orders').select('total,created_at,currency').order('created_at', { ascending: false }).limit(500),
      supabase.from('entities').select('entity_type,is_active'),
      supabase.from('service_categories').select('name,icon').eq('is_active', true),
    ]);

    // الطلبات حسب آخر 7 أيام
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      const count = (orders.data || []).filter((o) => o.created_at?.slice(0, 10) === key).length;
      const revenue = (orders.data || []).filter((o) => o.created_at?.slice(0, 10) === key).reduce((s, o) => s + Number(o.total || 0), 0);
      days.push({ day: d.toLocaleDateString('ar-EG', { weekday: 'short' }), count, revenue });
    }
    setOrdersByDay(days);

    // الكيانات حسب النوع
    const types = {};
    (ents.data || []).forEach((e) => { types[e.entity_type] = (types[e.entity_type] || 0) + 1; });
    setEntitiesByType(types);

    // الإيرادات حسب الشهور (آخر 6 شهور)
    const months = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const key = d.toISOString().slice(0, 7);
      const revenue = (orders.data || []).filter((o) => o.created_at?.slice(0, 7) === key).reduce((s, o) => s + Number(o.total || 0), 0);
      const count = (orders.data || []).filter((o) => o.created_at?.slice(0, 7) === key).length;
      months.push({ month: d.toLocaleDateString('ar-EG', { month: 'short' }), revenue, count });
    }
    setRevenueByMonth(months);
    setCategoriesCount(cats.data || []);
    setLoading(false);
  }

  const maxCount = Math.max(...ordersByDay.map((d) => d.count), 1);
  const maxRevenue = Math.max(...revenueByMonth.map((m) => m.revenue), 1);
  const maxType = Math.max(...Object.values(entitiesByType), 1);

  if (loading) return <div className="admin-page"><div className="sect-empty"><span className="em">⏳</span></div></div>;

  return (
    <div className="admin-page">
      <div className="admin-sub-header">
        <Link href="/admin" className="admin-sub-back">→</Link>
        <span className="admin-sub-title">📊 الرسوم البيانية</span>
      </div>

      <div style={{ padding: '20px 20px 0' }}>
        <div className="report-chart" style={{ background: 'rgba(255,255,255,.03)', borderColor: 'rgba(255,255,255,.08)', margin: 0 }}>
          <div className="report-chart-title" style={{ color: '#fff' }}>الطلبات آخر 7 أيام</div>
          <div className="bars">
            {ordersByDay.map((d, i) => (
              <div key={i} className="bar-col">
                <span className="bar-value" style={{ color: '#e8b923' }}>{d.count}</span>
                <div className="bar alt" style={{ height: `${(d.count / maxCount) * 100}%`, minHeight: 4 }} />
                <span className="bar-label" style={{ color: 'rgba(255,255,255,.4)' }}>{d.day}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{ padding: '20px 20px 0' }}>
        <div className="report-chart" style={{ background: 'rgba(255,255,255,.03)', borderColor: 'rgba(255,255,255,.08)', margin: 0 }}>
          <div className="report-chart-title" style={{ color: '#fff' }}>الإيرادات آخر 6 شهور</div>
          <div className="bars">
            {revenueByMonth.map((m, i) => (
              <div key={i} className="bar-col">
                <span className="bar-value" style={{ color: '#e8b923', fontSize: 9 }}>{Math.round(m.revenue / 1000)}K</span>
                <div className="bar" style={{ height: `${(m.revenue / maxRevenue) * 100}%`, minHeight: 4, background: 'linear-gradient(180deg, #0e8a66, #05402d)' }} />
                <span className="bar-label" style={{ color: 'rgba(255,255,255,.4)' }}>{m.month}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{ padding: 20 }}>
        <div className="report-chart" style={{ background: 'rgba(255,255,255,.03)', borderColor: 'rgba(255,255,255,.08)', margin: 0 }}>
          <div className="report-chart-title" style={{ color: '#fff' }}>الكيانات حسب النوع</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {Object.entries(entitiesByType).map(([type, count]) => (
              <div key={type} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 12, color: 'rgba(255,255,255,.6)', fontWeight: 700, minWidth: 90 }}>{type}</span>
                <div style={{ flex: 1, height: 10, background: 'rgba(255,255,255,.05)', borderRadius: 5, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${(count / maxType) * 100}%`, background: 'linear-gradient(90deg, #e8b923, #c99418)', borderRadius: 5 }} />
                </div>
                <span style={{ fontSize: 13, color: '#e8b923', fontWeight: 900, minWidth: 30, textAlign: 'left', direction: 'ltr' }}>{count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
