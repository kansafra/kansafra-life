'use client';
import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { useCurrentUser } from '@/lib/useCurrentUser';
import { useToast } from '@/components/Toast';
import { SkeletonList } from '@/components/Skeleton';
import EmptyState from '@/components/EmptyState';

function Stars({ rating, size = 16 }) {
  return (
    <div style={{ display: 'flex', gap: 2, direction: 'ltr' }}>
      {[1, 2, 3, 4, 5].map(n => (
        <span key={n} style={{ fontSize: size, color: n <= rating ? '#fbbf24' : '#e5e7eb' }}>★</span>
      ))}
    </div>
  );
}

export default function ReviewsPage() {
  const router = useRouter();
  const { user, loading: userLoading, isOwner, isSectionAdmin, hasPermission, dataOwnerName } = useCurrentUser();
  const { success, error: toastError } = useToast();
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (userLoading) return;
    if (!user) { router.replace('/login'); return; }
    load();
  }, [user, userLoading]);

  async function load() {
    if (!supabase || !dataOwnerName) { setLoading(false); return; }
    try {
      let q = supabase.from('reviews').select('*').order('created_at', { ascending: false });
      if (!isSectionAdmin) q = q.eq('target_name', dataOwnerName);
      const { data, error } = await q;
      if (error) throw error;
      setReviews(Array.isArray(data) ? data : []);
    } catch (e) { toastError('تعذّر التحميل'); }
    setLoading(false);
  }

  const filtered = useMemo(() => {
    let list = reviews;
    if (filter === '5star') list = list.filter(r => r.rating === 5);
    else if (filter === '4star') list = list.filter(r => r.rating === 4);
    else if (filter === 'low') list = list.filter(r => r.rating <= 3);
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(r =>
        (r.reviewer_name || '').toLowerCase().includes(q) ||
        (r.comment || '').toLowerCase().includes(q)
      );
    }
    return list;
  }, [reviews, filter, search]);

  const stats = useMemo(() => {
    const total = reviews.length;
    const avg = total > 0 ? reviews.reduce((s, r) => s + Number(r.rating || 0), 0) / total : 0;
    const dist = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    reviews.forEach(r => { if (dist[r.rating] !== undefined) dist[r.rating]++; });
    return { total, avg: avg.toFixed(1), dist };
  }, [reviews]);

  async function deleteReview(r) {
    if (!confirm('حذف هذا التقييم؟')) return;
    try {
      const { error } = await supabase.from('reviews').delete().eq('id', r.id);
      if (error) throw error;
      success('✅ تم الحذف');
      setReviews(prev => prev.filter(x => x.id !== r.id));
    } catch (e) { toastError('تعذّر: ' + e.message); }
  }

  if (!userLoading && user && !isOwner && !isSectionAdmin && !hasPermission('customers')) {
    return <div style={{ padding: 60, textAlign: 'center' }}>🔒 ليس لديك صلاحية</div>;
  }
  if (userLoading || (user && loading)) {
    return <div style={{ padding: 16, background: '#f8fafc', minHeight: '100vh' }}><SkeletonList count={3} /></div>;
  }
  if (!user) return null;

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', paddingBottom: 40 }}>
      <div style={{ position: 'sticky', top: 0, zIndex: 10, background: '#0f4d3a', padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <Link href="/merchant" style={{ color: '#fff', textDecoration: 'none', fontSize: 20, width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,.1)', borderRadius: '50%' }}>→</Link>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 16, fontWeight: 900, color: '#fff' }}>⭐ التقييمات</div>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,.7)', marginTop: 2 }}>{stats.total} تقييم</div>
        </div>
      </div>

      <div style={{ padding: 16 }}>
        <div style={{ background: 'linear-gradient(135deg,#0f4d3a,#075640)', borderRadius: 18, padding: 20, color: '#fff', marginBottom: 16, display: 'flex', gap: 16, alignItems: 'center' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 40, fontWeight: 900, lineHeight: 1 }}>{stats.avg}</div>
            <Stars rating={Math.round(Number(stats.avg))} size={14} />
            <div style={{ fontSize: 10, opacity: 0.7, marginTop: 4 }}>{stats.total} تقييم</div>
          </div>
          <div style={{ flex: 1 }}>
            {[5, 4, 3, 2, 1].map(n => {
              const pct = stats.total > 0 ? (stats.dist[n] / stats.total) * 100 : 0;
              return (
                <div key={n} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <span style={{ fontSize: 11, width: 12 }}>{n}★</span>
                  <div style={{ flex: 1, height: 6, background: 'rgba(255,255,255,.15)', borderRadius: 3, overflow: 'hidden' }}>
                    <div style={{ width: `${pct}%`, height: '100%', background: '#fbbf24' }} />
                  </div>
                  <span style={{ fontSize: 10, width: 24, textAlign: 'left' }}>{stats.dist[n]}</span>
                </div>
              );
            })}
          </div>
        </div>

        <input type="text" placeholder="🔍 ابحث بالاسم أو التعليق..." value={search} onChange={(e) => setSearch(e.target.value)}
          style={{ width: '100%', padding: '12px 14px', border: '1px solid #e5e7eb', borderRadius: 12, fontSize: 13, fontFamily: 'inherit', boxSizing: 'border-box', outline: 'none', background: '#fff', marginBottom: 10 }} />
        
        <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4 }}>
          {[
            { k: 'all', l: 'الكل', n: stats.total },
            { k: '5star', l: '5★', n: stats.dist[5] },
            { k: '4star', l: '4★', n: stats.dist[4] },
            { k: 'low', l: '≤3★', n: stats.dist[3] + stats.dist[2] + stats.dist[1] },
          ].map((f) => (
            <button key={f.k} onClick={() => setFilter(f.k)} style={{
              padding: '8px 14px', background: filter === f.k ? '#0f4d3a' : '#fff', color: filter === f.k ? '#fff' : '#64748b',
              border: `1px solid ${filter === f.k ? '#0f4d3a' : '#e5e7eb'}`, borderRadius: 10, fontSize: 11.5, fontWeight: 800,
              cursor: 'pointer', whiteSpace: 'nowrap', fontFamily: 'inherit',
            }}>{f.l} ({f.n})</button>
          ))}
        </div>
      </div>

      <div style={{ padding: '0 16px' }}>
        {filtered.length === 0 ? (
          <EmptyState icon="⭐" title={search ? 'لا توجد نتائج' : 'لا توجد تقييمات بعد'} description={search ? 'جرّب البحث بكلمات مختلفة' : 'ستظهر هنا تقييمات عملائك'} />
        ) : filtered.map((r) => (
          <div key={r.id} style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 14, padding: 14, marginBottom: 10 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'linear-gradient(135deg,#0f4d3a,#075640)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 900 }}>
                    {(r.reviewer_name || '?').charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 900, color: '#0f172a' }}>{r.reviewer_name || 'زائر'}</div>
                    <div style={{ fontSize: 10, color: '#94a3b8' }}>{new Date(r.created_at).toLocaleDateString('ar-EG')}</div>
                  </div>
                </div>
                <Stars rating={Number(r.rating) || 0} />
              </div>
              <button onClick={() => deleteReview(r)} style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(220,38,38,.1)', color: '#dc2626', border: 'none', fontSize: 14, cursor: 'pointer' }}>🗑️</button>
            </div>
            {r.comment && (
              <div style={{ padding: 12, background: '#f8fafc', borderRadius: 10, fontSize: 13, color: '#334155', lineHeight: 1.7 }}>
                "{r.comment}"
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
