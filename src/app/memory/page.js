'use client';
import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

const TYPES = [
  { key: 'all', label: 'الكل', icon: '📚' },
  { key: 'photo', label: 'صور', icon: '📷' },
  { key: 'story', label: 'قصص', icon: '📖' },
  { key: 'place', label: 'أماكن', icon: '🏛️' },
];

export default function MemoryPage() {
  const router = useRouter();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [selected, setSelected] = useState(null);

  useEffect(() => { loadPosts(); }, []);

  async function loadPosts() {
    if (!supabase) return;
    setLoading(true);
    try {
      const { data } = await supabase.from('memory_posts').select('*').eq('is_active', true).order('created_at', { ascending: false });
      setPosts(data || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }

  const filtered = useMemo(() => {
    let list = posts;
    if (activeTab !== 'all') list = list.filter(p => p.type === activeTab);
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(p =>
        (p.title || '').toLowerCase().includes(q) ||
        (p.description || '').toLowerCase().includes(q) ||
        (p.story_text || '').toLowerCase().includes(q) ||
        (p.location || '').toLowerCase().includes(q)
      );
    }
    return list;
  }, [posts, activeTab, search]);

  const stats = useMemo(() => ({
    total: posts.length,
    photos: posts.filter(p => p.type === 'photo').length,
    stories: posts.filter(p => p.type === 'story').length,
    places: posts.filter(p => p.type === 'place').length,
  }), [posts]);

  if (loading) return <div style={{ padding: 80, textAlign: 'center' }}>⏳</div>;

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', paddingBottom: 40 }}>
      <div style={{ background: 'linear-gradient(135deg, #0f4d3a, #075640)', padding: '20px', color: '#fff', borderBottomLeftRadius: 24, borderBottomRightRadius: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
          <button onClick={() => router.back()} style={{ color: '#fff', background: 'rgba(255,255,255,.15)', border: 'none', width: 40, height: 40, borderRadius: '50%', fontSize: 18, cursor: 'pointer' }}>←</button>
          <div style={{ flex: 1 }}>
            <h1 style={{ fontSize: 20, fontWeight: 900, margin: 0 }}>📸 ذاكرة كنصفرة</h1>
            <div style={{ fontSize: 12, opacity: 0.8, marginTop: 2 }}>أرشيف الذكريات والتراث</div>
          </div>
          <Link href="/merchant/memory/new" style={{ background: '#fbbf24', color: '#0f4d3a', padding: '8px 14px', borderRadius: 10, fontSize: 12, fontWeight: 900, textDecoration: 'none' }}>+ أضف</Link>
        </div>
        <input type="search" placeholder="🔍 ابحث في الذكريات..." value={search} onChange={e => setSearch(e.target.value)} style={{ width: '100%', padding: '12px 16px', borderRadius: 12, border: 'none', fontSize: 14, outline: 'none', boxSizing: 'border-box', background: 'rgba(255,255,255,0.95)', fontFamily: 'inherit' }} />
      </div>

      <div style={{ padding: 16, maxWidth: 800, margin: '0 auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginBottom: 16 }}>
          <StatBox label="الكل" value={stats.total} color="#0f4d3a" />
          <StatBox label="صور" value={stats.photos} color="#0ea5e9" />
          <StatBox label="قصص" value={stats.stories} color="#8b5cf6" />
          <StatBox label="أماكن" value={stats.places} color="#f59e0b" />
        </div>

        <div style={{ display: 'flex', gap: 6, marginBottom: 16, overflowX: 'auto', paddingBottom: 4 }}>
          {TYPES.map(t => (
            <button key={t.key} onClick={() => setActiveTab(t.key)} style={chip(activeTab === t.key)}>{t.icon} {t.label}</button>
          ))}
        </div>

        {filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 60, background: '#fff', borderRadius: 16, color: '#64748b' }}>
            <div style={{ fontSize: 60, marginBottom: 12 }}>📸</div>
            <div style={{ fontSize: 15, fontWeight: 900 }}>{posts.length === 0 ? 'لا توجد ذكريات منشورة بعد' : 'لا نتائج'}</div>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 12 }}>
            {filtered.map(p => {
              const typeLabel = p.type === 'photo' ? '📷 صورة' : p.type === 'story' ? '📖 قصة' : '🏛️ مكان';
              return (
                <div key={p.id} onClick={() => setSelected(p)} style={{ background: '#fff', borderRadius: 16, overflow: 'hidden', border: '1px solid #e2e8f0', cursor: 'pointer' }}>
                  {p.image_url ? <img src={p.image_url} alt="" style={{ width: '100%', height: 160, objectFit: 'cover' }} /> : <div style={{ width: '100%', height: 160, background: 'linear-gradient(135deg, #f0fdf4, #e0f2fe)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 56 }}>📸</div>}
                  <div style={{ padding: 14 }}>
                    <div style={{ background: 'rgba(14,165,233,0.1)', color: '#0284c7', padding: '2px 8px', borderRadius: 6, fontSize: 9, fontWeight: 900, display: 'inline-block', marginBottom: 6 }}>{typeLabel}</div>
                    <div style={{ fontSize: 14, fontWeight: 900, color: '#0f172a', marginBottom: 4 }}>{p.title}</div>
                    {p.location && <div style={{ fontSize: 11, color: '#64748b', marginBottom: 4 }}>📍 {p.location}</div>}
                    {p.description && <div style={{ fontSize: 12, color: '#475569', lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{p.description}</div>}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {selected && (
        <div onClick={() => setSelected(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div onClick={e => e.stopPropagation()} style={{ background: '#fff', borderRadius: 20, maxWidth: 500, width: '100%', maxHeight: '90vh', overflowY: 'auto' }}>
            {selected.image_url && <img src={selected.image_url} alt="" style={{ width: '100%', maxHeight: 300, objectFit: 'cover', borderRadius: '20px 20px 0 0' }} />}
            <div style={{ padding: 20 }}>
              <div style={{ fontSize: 20, fontWeight: 900, color: '#0f172a', marginBottom: 8 }}>{selected.title}</div>
              {selected.location && <div style={{ fontSize: 13, color: '#64748b', marginBottom: 8 }}>📍 {selected.location}</div>}
              {selected.description && <div style={{ fontSize: 14, color: '#475569', lineHeight: 1.7, marginBottom: 12 }}>{selected.description}</div>}
              {selected.story_text && <div style={{ fontSize: 14, color: '#475569', lineHeight: 1.8, background: '#f8fafc', padding: 14, borderRadius: 12 }}>{selected.story_text}</div>}
              <button onClick={() => setSelected(null)} style={{ width: '100%', marginTop: 20, padding: 12, background: '#0f4d3a', color: '#fff', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 900, cursor: 'pointer', fontFamily: 'inherit' }}>إغلاق</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function chip(active) {
  return { background: active ? '#0f4d3a' : '#fff', color: active ? '#fff' : '#64748b', border: active ? '1px solid #0f4d3a' : '1px solid #e2e8f0', padding: '8px 14px', borderRadius: 20, fontSize: 12, fontWeight: 900, cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap' };
}

function StatBox({ label, value, color }) {
  return <div style={{ background: '#fff', borderRadius: 12, padding: 12, textAlign: 'center', border: '1px solid #e2e8f0' }}><div style={{ fontSize: 18, fontWeight: 900, color, marginBottom: 2 }}>{value}</div><div style={{ fontSize: 9.5, color: '#64748b', fontWeight: 800 }}>{label}</div></div>;
}
