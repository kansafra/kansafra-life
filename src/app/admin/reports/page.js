'use client';

// Safe date for hydration
const __safeDate = (d) => (typeof window !== 'undefined' ? __safeDate(d) : __safeDate(0));

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

export default function AdminReports() {
  const router = useRouter();
  const [stats, setStats] = useState({ entities: 0, services: 0, products: 0, orders: 0, sos: 0, revenue: 0, reviews: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let stored = null;
    try { stored = JSON.parse(localStorage.getItem('sanad_admin') || 'null'); } catch {}
    if (!stored) { router.replace('/admin/login'); return; }
    load();
  }, [router]);

  async function load() {
    if (!supabase) return;
    const [e, s, p, o, sos, ord, r] = await Promise.all([
      supabase.from('entities').select('*', { count: 'exact', head: true }),
      supabase.from('services').select('*', { count: 'exact', head: true }),
      supabase.from('products').select('*', { count: 'exact', head: true }),
      supabase.from('orders').select('*', { count: 'exact', head: true }),
      supabase.from('sos_alerts').select('*', { count: 'exact', head: true }),
      supabase.from('orders').select('total'),
      supabase.from('reviews').select('*', { count: 'exact', head: true }),
    ]);
    const revenue = (ord.data || []).reduce((s, x) => s + (Number(x.total) || 0), 0);
    setStats({
      entities: e.count || 0, services: s.count || 0, products: p.count || 0,
      orders: o.count || 0, sos: sos.count || 0, revenue, reviews: r.count || 0,
    });
    setLoading(false);
  }

  return (
    <div className="admin-page">
      <div className="admin-sub-header">
        <Link href="/admin" className="admin-sub-back">→</Link>
        <span className="admin-sub-title">📊 التقارير</span>
      </div>
      {loading ? (
        <div className="sect-empty"><span className="em">⏳</span></div>
      ) : (
        <div className="admin-stats" style={{ paddingTop: 20 }}>
          <div className="admin-stat"><div className="admin-stat-val">{stats.entities}</div><div className="admin-stat-lbl">كيانات</div></div>
          <div className="admin-stat"><div className="admin-stat-val">{stats.services + stats.products}</div><div className="admin-stat-lbl">خدمات ومنتجات</div></div>
          <div className="admin-stat"><div className="admin-stat-val">{stats.orders}</div><div className="admin-stat-lbl">طلبات</div></div>
          <div className="admin-stat"><div className="admin-stat-val">{stats.revenue.toLocaleString()}</div><div className="admin-stat-lbl">الإيرادات</div></div>
          <div className="admin-stat"><div className="admin-stat-val">{stats.sos}</div><div className="admin-stat-lbl">بلاغات SOS</div></div>
          <div className="admin-stat"><div className="admin-stat-val">{stats.reviews}</div><div className="admin-stat-lbl">تقييمات</div></div>
        </div>
      )}
    </div>
  );
}
