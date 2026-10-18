'use client';
import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { SkeletonList } from '@/components/Skeleton';
import EmptyState from '@/components/EmptyState';

const CATEGORIES = {
  urgent: { label: 'عاجل', icon: '🔴', color: '#ef4444' },
  service: { label: 'خدمي', icon: '🟢', color: '#10b981' },
  price: { label: 'أسعار', icon: '🟡', color: '#f59e0b' },
  general: { label: 'عام', icon: '🔵', color: '#3b82f6' },
};

export default function NewsPage() {
  const router = useRouter();
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');

  useEffect(() => { load(); }, []);

  async function load() {
    if (!supabase) { setLoading(false); return; }
    try {
      const { data } = await supabase.from('announcements').select('*').eq('is_active', true).order('created_at', { ascending: false });
      setNews(data || []);
    } catch (e) { console.error(e); }
    setLoading(false);
  }

  const filtered = useMemo(() => {
    let list = news;
    if (filter !== 'all') list = list.filter(n => n.category === filter || n.priority === filter);
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(n => (n.title || '').toLowerCase().includes(q) || (n.content || '').toLowerCase().includes(q));
    }
    // المثبت أولاً
    return [...list].sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0));
  }, [news, filter, search]);

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: '#f8fafc', padding: 16 }}>
        <div style={{ background: '#0f4d3a', margin: -16, padding: 20, marginBottom: 16 }}>
          <div style={{ width: 120, height: 20, background: 'rgba(255,255,255,.2)', borderRadius: 6 }} />
        </div>
        <SkeletonList count={4} />
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', paddingBottom: 40 }}>
      {/* Header */}
      <div style={{ position: 'sticky', top: 0, zIndex: 10, background: '#0f4d3a', padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <Link href="/" style={{ color: '#fff', textDecoration: 'none', fontSize: 20, width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,.1)', borderRadius: '50%' }}>→</Link>
        <div style={{ flex: 1 }}>
          <div style={{ color: '#fff', fontSize: 16, fontWeight: 900 }}>📰 الأخبار والإعلانات</div>
          <div style={{ color: 'rgba(255,255,255,.7)', fontSize: 11, marginTop: 2 }}>{filtered.length} خبر</div>
        </div>
      </div>

      {/* Search */}
      <div style={{ padding: 16 }}>
        <input type="text" placeholder="🔍 ابحث في الأخبار..." value={search} onChange={(e) => setSearch(e.target.value)}
          style={{ width: '100%', padding: '12px 14px', border: '1px solid #e5e7eb', borderRadius: 12, fontSize: 13, fontFamily: 'inherit', boxSizing: 'border-box', outline: 'none', background: '#fff', marginBottom: 10 }} />

        <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 4 }}>
          {[['all', 'الكل', '📋'], ['urgent', 'عاجل', '🔴'], ['service', 'خدمي', '🟢'], ['price', 'أسعار', '🟡']].map(([k, l, e]) => (
            <button key={k} onClick={() => setFilter(k)} style={{ padding: '8px 14px', background: filter === k ? '#0f4d3a' : '#fff', color: filter === k ? '#fff' : '#64748b', border: `1px solid ${filter === k ? '#0f4d3a' : '#e5e7eb'}`, borderRadius: 10, fontSize: 11.5, fontWeight: 800, cursor: 'pointer', whiteSpace: 'nowrap', fontFamily: 'inherit' }}>{e} {l}</button>
          ))}
        </div>
      </div>

      {/* News List */}
      <div style={{ padding: '0 16px' }}>
        {filtered.length === 0 ? (
          <EmptyState icon="📰" title={search ? 'لا توجد نتائج' : 'لا توجد أخبار'} description={search ? 'جرّب البحث بكلمات مختلفة' : 'ستظهر الأخبار هنا عند إضافتها'} actionLabel="← الرئيسية" actionHref="/" />
        ) : filtered.map((n) => {
          const cat = CATEGORIES[n.category] || CATEGORIES.general;
          return (
            <div key={n.id} style={{ background: '#fff', borderRadius: 16, padding: 16, marginBottom: 10, border: n.pinned ? '2px solid #fbbf24' : '1px solid #e5e7eb', position: 'relative' }}>
              {n.pinned && (
                <div style={{ position: 'absolute', top: -8, right: 12, background: '#fbbf24', color: '#0f172a', padding: '2px 10px', borderRadius: 8, fontSize: 10, fontWeight: 900 }}>📌 مثبت</div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10, marginTop: n.pinned ? 4 : 0 }}>
                <span style={{ background: `${cat.color}20`, color: cat.color, padding: '3px 10px', borderRadius: 6, fontSize: 10, fontWeight: 900 }}>{cat.icon} {cat.label}</span>
                <span style={{ fontSize: 10, color: '#94a3b8' }}>{new Date(n.created_at).toLocaleString('ar-EG')}</span>
              </div>
              <Link href={`/news/${n.id}`} style={{ textDecoration: 'none' }}><h3 style={{ fontSize: 16, fontWeight: 900, color: '#0f172a', marginBottom: 8, lineHeight: 1.4 }}>{n.title}</h3></Link>
              {n.content && <p style={{ fontSize: 13, color: '#64748b', lineHeight: 1.7, margin: 0, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{n.content}</p>}
            </div>
          );
        })}
      </div>
    </div>
  );
}
