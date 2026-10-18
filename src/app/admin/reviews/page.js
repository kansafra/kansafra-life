'use client';
import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/components/Toast';
import { SkeletonList } from '@/components/Skeleton';
import EmptyState from '@/components/EmptyState';

function Stars({ rating }) {
  return <div style={{ display: 'flex', gap: 2, direction: 'ltr' }}>{[1,2,3,4,5].map(n => <span key={n} style={{ fontSize: 14, color: n <= rating ? '#fbbf24' : '#e5e7eb' }}>★</span>)}</div>;
}

export default function AdminReviews() {
  const router = useRouter();
  const { success, error: tE } = useToast();
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');

  useEffect(() => {
    let stored = null;
    try { stored = JSON.parse(localStorage.getItem('sanad_admin') || 'null'); } catch {}
    if (!stored) { router.replace('/admin/login'); return; }
    load();
  }, [router]);

  async function load() {
    if (!supabase) { setLoading(false); return; }
    const { data } = await supabase.from('reviews').select('*').order('created_at', { ascending: false });
    setReviews(data || []);
    setLoading(false);
  }

  const filtered = useMemo(() => {
    let list = reviews;
    if (filter === '5star') list = list.filter(r => r.rating === 5);
    else if (filter === 'low') list = list.filter(r => r.rating <= 3);
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(r => (r.reviewer_name || '').toLowerCase().includes(q) || (r.target_name || '').toLowerCase().includes(q) || (r.comment || '').toLowerCase().includes(q));
    }
    return list;
  }, [reviews, filter, search]);

  const stats = useMemo(() => {
    const total = reviews.length;
    const avg = total > 0 ? (reviews.reduce((s, r) => s + Number(r.rating || 0), 0) / total).toFixed(1) : '0.0';
    const dist = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    reviews.forEach(r => { if (dist[r.rating] !== undefined) dist[r.rating]++; });
    return { total, avg, dist };
  }, [reviews]);

  async function del(r) {
    if (!confirm('حذف هذا التقييم نهائياً؟')) return;
    await supabase.from('reviews').delete().eq('id', r.id);
    success('✅ تم الحذف');
    setReviews(prev => prev.filter(x => x.id !== r.id));
  }

  if (loading) return <div style={{ padding: 16, background: '#f8fafc', minHeight: '100vh' }}><SkeletonList count={4} /></div>;

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', paddingBottom: 40 }}>
      <div style={{ position: 'sticky', top: 0, zIndex: 10, background: '#0f4d3a', padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <Link href="/admin" style={{ color: '#fff', textDecoration: 'none', fontSize: 20, width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,.1)', borderRadius: '50%' }}>→</Link>
        <div style={{ flex: 1, color: '#fff', fontSize: 16, fontWeight: 900 }}>⭐ التقييمات ({stats.total})</div>
      </div>

      <div style={{ padding: 16 }}>
        <div style={{ background: 'linear-gradient(135deg,#0f4d3a,#075640)', borderRadius: 18, padding: 20, color: '#fff', marginBottom: 16, display: 'flex', gap: 16, alignItems: 'center' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 40, fontWeight: 900, lineHeight: 1 }}>{stats.avg}</div>
            <Stars rating={Math.round(Number(stats.avg))} />
            <div style={{ fontSize: 10, opacity: 0.7, marginTop: 4 }}>{stats.total} تقييم</div>
          </div>
          <div style={{ flex: 1 }}>
            {[5,4,3,2,1].map(n => {
              const pct = stats.total > 0 ? (stats.dist[n] / stats.total) * 100 : 0;
              return (
                <div key={n} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
                  <span style={{ fontSize: 10, width: 10 }}>{n}★</span>
                  <div style={{ flex: 1, height: 5, background: 'rgba(255,255,255,.15)', borderRadius: 3, overflow: 'hidden' }}>
                    <div style={{ width: `${pct}%`, height: '100%', background: '#fbbf24' }} />
                  </div>
                  <span style={{ fontSize: 9.5, width: 20, textAlign: 'left' }}>{stats.dist[n]}</span>
                </div>
              );
            })}
          </div>
        </div>

        <input type="text" placeholder="🔍 ابحث بالاسم أو التعليق..." value={search} onChange={(e) => setSearch(e.target.value)} style={{ width: '100%', padding: '12px 14px', border: '1px solid #e5e7eb', borderRadius: 12, fontSize: 13, fontFamily: 'inherit', boxSizing: 'border-box', outline: 'none', background: '#fff', marginBottom: 10 }} />
        
        <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 4 }}>
          {[['all','الكل',stats.total],['5star','5★',stats.dist[5]],['low','≤3★',stats.dist[3]+stats.dist[2]+stats.dist[1]]].map(([k,l,n]) => (
            <button key={k} onClick={() => setFilter(k)} style={{ padding: '6px 12px', background: filter === k ? '#0f4d3a' : '#fff', color: filter === k ? '#fff' : '#64748b', border: `1px solid ${filter === k ? '#0f4d3a' : '#e5e7eb'}`, borderRadius: 8, fontSize: 11, fontWeight: 800, cursor: 'pointer', whiteSpace: 'nowrap', fontFamily: 'inherit' }}>{l} ({n})</button>
          ))}
        </div>
      </div>

      <div style={{ padding: '0 16px' }}>
        {filtered.length === 0 ? <EmptyState icon="⭐" title="لا توجد تقييمات" /> : filtered.map(r => (
          <div key={r.id} style={{ background: '#fff', borderRadius: 14, padding: 14, marginBottom: 10, border: '1px solid #e5e7eb' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 900 }}>{r.reviewer_name || 'زائر'}</div>
                {r.target_name && <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>→ {r.target_name}</div>}
                <div style={{ marginTop: 4 }}><Stars rating={Number(r.rating) || 0} /></div>
              </div>
              <button onClick={() => del(r)} style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(220,38,38,.1)', color: '#dc2626', border: 'none', fontSize: 14, cursor: 'pointer' }}>🗑️</button>
            </div>
            {r.comment && <div style={{ padding: 10, background: '#f8fafc', borderRadius: 8, fontSize: 12, color: '#334155', lineHeight: 1.6, marginBottom: 8 }}>"{r.comment}"</div>}
            <div style={{ fontSize: 10, color: '#94a3b8' }}>📅 {new Date(r.created_at).toLocaleString('ar-EG')}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
