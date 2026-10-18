'use client';


import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { getSession } from '@/lib/auth';

export default function ReportsPage() {
  const router = useRouter();
  const [entity, setEntity] = useState(null);
  const [stats, setStats] = useState({ services: 0, products: 0, orders: 0, revenue: 0, reviews: 0, rating: 0 });
  const [ordersByDay, setOrdersByDay] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let stored = null;
    try { stored = getSession(); } catch (e) {}
    if (!stored) { router.replace('/login'); return; }
    setEntity(stored);
    load(stored);
  }, [router]);

  async function load(ent) {
    if (!supabase) { setLoading(false); return; }
    const [s, p, o, r] = await Promise.all([
      supabase.from('services').select('*', { count: 'exact', head: true }).eq('provider_name', ent.display_name),
      supabase.from('products').select('*', { count: 'exact', head: true }).eq('provider_name', ent.display_name),
      supabase.from('orders').select('*').eq('provider_name', ent.display_name),
      supabase.from('reviews').select('rating').eq('target_id', ent.display_name),
    ]);
    const orders = Array.isArray(o.data) ? o.data : [];
    const revenue = orders.reduce((sum, x) => sum + (Number(x.total) || 0), 0);
    const ratings = (r.data || []).map((x) => Number(x.rating) || 0);
    const avgRating = ratings.length ? (ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(1) : 0;

    // تجميع الطلبات حسب آخر 7 أيام
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      const count = orders.filter((o) => o.created_at?.slice(0, 10) === key).length;
      days.push({ day: d.toLocaleDateString('ar-EG', { weekday: 'short' }), count, date: key });
    }

    setStats({
      services: s.count || 0,
      products: p.count || 0,
      orders: orders.length,
      revenue,
      reviews: ratings.length,
      rating: avgRating,
    });
    setOrdersByDay(days);
    setLoading(false);
  }

  function exportCSV() {
    if (!entity) return;
    const csv = '\uFEFF' + [
      ['البند', 'القيمة'],
      ['الخدمات', stats.services],
      ['المنتجات', stats.products],
      ['الطلبات', stats.orders],
      ['الإيرادات', stats.revenue],
      ['التقييمات', stats.reviews],
      ['متوسط التقييم', stats.rating],
    ].map((r) => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `sanad-report-${Date.now()}.csv`;
    a.click();
  }

  if (!entity) return <div className="sect-empty" style={{ padding: 80 }}><span className="em">⏳</span></div>;

  const maxOrders = Math.max(...ordersByDay.map((d) => d.count), 1);

  // Donut للإيرادات
  const donutParts = [
    { label: 'طلبات مكتملة', val: stats.orders, color: '#0e8a66' },
    { label: 'منتجات', val: stats.products, color: '#e8b923' },
    { label: 'خدمات', val: stats.services, color: '#0891b2' },
  ];
  const total = donutParts.reduce((s, p) => s + p.val, 0) || 1;
  let offset = 0;

  return (
    <div className="reports-page">
      <div className="notif-header">
        <Link href="/merchant" className="notif-back">→</Link>
        <span className="notif-title">📊 التقارير</span>
        <button className="mng-add-btn" onClick={exportCSV} type="button">📥 CSV</button>
      </div>

      {loading ? (
        <div className="sect-empty"><span className="em">⏳</span></div>
      ) : (
        <>
          <div className="report-kpis">
            <div className="report-kpi">
              <div className="report-kpi-val">{stats.revenue.toLocaleString()}</div>
              <div className="report-kpi-lbl">الإيرادات (ل.س)</div>
            </div>
            <div className="report-kpi">
              <div className="report-kpi-val">{stats.orders}</div>
              <div className="report-kpi-lbl">الطلبات</div>
            </div>
            <div className="report-kpi">
              <div className="report-kpi-val">{stats.reviews}</div>
              <div className="report-kpi-lbl">التقييمات</div>
            </div>
            <div className="report-kpi">
              <div className="report-kpi-val">{stats.rating} ⭐</div>
              <div className="report-kpi-lbl">متوسط التقييم</div>
            </div>
          </div>

          <div className="report-chart">
            <div className="report-chart-title">الطلبات آخر 7 أيام</div>
            <div className="bars">
              {ordersByDay.map((d, i) => (
                <div key={i} className="bar-col">
                  <span className="bar-value">{d.count}</span>
                  <div className="bar" style={{ height: `${(d.count / maxOrders) * 100}%` }} />
                  <span className="bar-label">{d.day}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="report-chart">
            <div className="report-chart-title">توزيع المحتوى</div>
            <div className="donut">
              <svg width="160" height="160" viewBox="0 0 160 160">
                {donutParts.map((p, i) => {
                  const pct = (p.val / total) * 100;
                  const dash = (pct / 100) * 2 * Math.PI * 60;
                  const gap = 2 * Math.PI * 60 - dash;
                  const el = (
                    <circle
                      key={i}
                      cx="80"
                      cy="80"
                      r="60"
                      fill="none"
                      stroke={p.color}
                      strokeWidth="20"
                      strokeDasharray={`${dash} ${gap}`}
                      strokeDashoffset={-offset}
                      strokeLinecap="round"
                    />
                  );
                  offset += dash;
                  return el;
                })}
              </svg>
              <div className="donut-center">
                <div className="donut-val">{stats.products + stats.services}</div>
                <div className="donut-lbl">إجمالي العناصر</div>
              </div>
            </div>
            <div className="legend">
              {donutParts.map((p) => (
                <div key={p.label} className="legend-item">
                  <span className="legend-dot" style={{ background: p.color }} />
                  {p.label}: {p.val}
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
