'use client';
import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { SkeletonList } from '@/components/Skeleton';
import EmptyState from '@/components/EmptyState';

const TABS = [
  { k: 'items', l: '📸 صور', table: 'memory_items', titleField: 'title', imgField: 'image_url' },
  { k: 'stories', l: '📖 حكايات', table: 'memory_stories', titleField: 'title', textField: 'content' },
  { k: 'places', l: '📍 أماكن', table: 'memory_places', titleField: 'name', imgField: 'image_url' },
];

export default function MemoryPage() {
  const [tab, setTab] = useState('items');
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => { load(tab); }, [tab]);

  async function load(type) {
    if (!supabase) { setLoading(false); return; }
    setLoading(true);
    const cfg = TABS.find(t => t.k === type);
    try {
      const { data } = await supabase.from(cfg.table).select('*').order('created_at', { ascending: false });
      setItems(data || []);
    } catch (e) { console.error(e); setItems([]); }
    setLoading(false);
  }

  const cfg = TABS.find(t => t.k === tab);
  const filtered = useMemo(() => {
    if (!search.trim()) return items;
    const q = search.trim().toLowerCase();
    return items.filter(i => {
      const title = (i[cfg.titleField] || '').toLowerCase();
      const desc = (i.description || i.content || '').toLowerCase();
      return title.includes(q) || desc.includes(q);
    });
  }, [items, search, cfg]);

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', paddingBottom: 80 }}>
      <div style={{ background: 'linear-gradient(135deg,#6366f1,#4338ca)', padding: '20px 16px', color: '#fff' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
          <Link href="/" style={{ color: '#fff', textDecoration: 'none', fontSize: 20, width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,.15)', borderRadius: '50%' }}>→</Link>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 20, fontWeight: 900 }}>📷 ذاكرة كنصفرة</div>
            <div style={{ fontSize: 12, opacity: 0.85, marginTop: 2 }}>أرشيف البلدة التاريخي</div>
          </div>
          <div style={{ fontSize: 40 }}>📷</div>
        </div>
        <div style={{ fontSize: 12, opacity: 0.75, lineHeight: 1.6, textAlign: 'center' }}>ذاكرة لكل بلدة، ومستقبل لكل جيل</div>
      </div>

      <div style={{ padding: 16 }}>
        <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
          {TABS.map(t => (
            <button key={t.k} onClick={() => setTab(t.k)} style={{ flex: 1, padding: '10px 8px', background: tab === t.k ? '#6366f1' : '#fff', color: tab === t.k ? '#fff' : '#64748b', border: `1px solid ${tab === t.k ? '#6366f1' : '#e5e7eb'}`, borderRadius: 10, fontSize: 12, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit' }}>{t.l}</button>
          ))}
        </div>
        <input type="text" placeholder="🔍 ابحث..." value={search} onChange={(e) => setSearch(e.target.value)}
          style={{ width: '100%', padding: '12px 14px', border: '1px solid #e5e7eb', borderRadius: 12, fontSize: 13, fontFamily: 'inherit', boxSizing: 'border-box', outline: 'none', background: '#fff' }} />
      </div>

      {loading ? (
        <div style={{ padding: 16 }}><SkeletonList count={3} /></div>
      ) : (
        <div style={{ padding: '0 16px' }}>
          {filtered.length === 0 ? (
            <EmptyState icon="📷" title={search ? 'لا توجد نتائج' : 'لا يوجد محتوى بعد'} description="كن أول من يضيف للذاكرة" actionLabel="← الرئيسية" actionHref="/" />
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 12 }}>
              {filtered.map(i => (
                <div key={i.id} style={{ background: '#fff', borderRadius: 12, overflow: 'hidden', border: '1px solid #e5e7eb' }}>
                  {i[cfg.imgField] ? (
                    <img src={i[cfg.imgField]} alt="" style={{ width: '100%', height: 130, objectFit: 'cover' }} />
                  ) : (
                    <div style={{ height: 130, background: 'linear-gradient(135deg,#6366f1,#4338ca)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 48 }}>{tab === 'stories' ? '📖' : tab === 'places' ? '📍' : '📸'}</div>
                  )}
                  <div style={{ padding: 10 }}>
                    <div style={{ fontSize: 12.5, fontWeight: 900, color: '#0f172a', marginBottom: 4, overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', lineHeight: 1.4 }}>{i[cfg.titleField] || i.title || i.name || '—'}</div>
                    {(i.description || i.content) && <div style={{ fontSize: 10.5, color: '#64748b', overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', lineHeight: 1.4 }}>{i.description || i.content}</div>}
                    <div style={{ fontSize: 9.5, color: '#94a3b8', marginTop: 6 }}>📅 {new Date(i.created_at).toLocaleDateString('ar-EG')}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
