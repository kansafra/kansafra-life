'use client';
import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

const CATEGORIES = {
  personal: { label: 'أغراض شخصية', icon: '👤' },
  documents: { label: 'وثائق', icon: '📄' },
  electronics: { label: 'إلكترونيات', icon: '📱' },
  keys: { label: 'مفاتيح', icon: '🔑' },
  animals: { label: 'حيوانات', icon: '🐾' },
  money: { label: 'أموال', icon: '💰' },
  other: { label: 'أخرى', icon: '📦' },
};

const POST_TYPES = {
  lost: { label: 'مفقود', color: '#ef4444', bg: 'rgba(239,68,68,0.1)', icon: '🔴' },
  found: { label: 'موجود', color: '#10b981', bg: 'rgba(16,185,129,0.1)', icon: '🟢' },
};

const FILTERS = [
  { key: 'all', label: 'الكل' },
  { key: 'lost', label: '🔴 مفقود' },
  { key: 'found', label: '🟢 موجود' },
];

export default function LostFoundPage() {
  const router = useRouter();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');

  useEffect(() => { loadItems(); }, []);

  async function loadItems() {
    if (!supabase) return;
    setLoading(true);
    try {
      const { data } = await supabase
        .from('lost_found')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });
      setItems(data || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }

  const filtered = useMemo(() => {
    let list = items;
    if (filter !== 'all') list = list.filter(i => i.post_type === filter);
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(i =>
        (i.title || '').toLowerCase().includes(q) ||
        (i.description || '').toLowerCase().includes(q) ||
        (i.location || '').toLowerCase().includes(q) ||
        (i.city || '').toLowerCase().includes(q)
      );
    }
    return list;
  }, [items, filter, search]);

  const stats = useMemo(() => ({
    total: items.length,
    lost: items.filter(i => i.post_type === 'lost' && !i.is_resolved).length,
    found: items.filter(i => i.post_type === 'found' && !i.is_resolved).length,
  }), [items]);

  function timeAgo(date) {
    if (!date) return '';
    const diff = Math.floor((Date.now() - new Date(date).getTime()) / 60000);
    if (diff < 60) return 'الآن';
    if (diff < 1440) return `قبل ${Math.floor(diff / 60)} ساعة`;
    if (diff < 10080) return `قبل ${Math.floor(diff / 1440)} يوم`;
    return new Date(date).toLocaleDateString('ar-SY');
  }

  if (loading) return <div style={{ padding: 80, textAlign: 'center' }}>⏳</div>;

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', paddingBottom: 40 }}>
      <div style={{ background: 'linear-gradient(135deg, #0f4d3a, #075640)', padding: '20px', color: '#fff', borderBottomLeftRadius: 24, borderBottomRightRadius: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
          <button onClick={() => router.back()} style={{ color: '#fff', background: 'rgba(255,255,255,.15)', border: 'none', width: 40, height: 40, borderRadius: '50%', fontSize: 18, cursor: 'pointer' }}>←</button>
          <div style={{ flex: 1 }}>
            <h1 style={{ fontSize: 20, fontWeight: 900, margin: 0 }}>🔍 المفقودات</h1>
            <div style={{ fontSize: 12, opacity: 0.8, marginTop: 2 }}>{stats.lost} مفقود · {stats.found} موجود</div>
          </div>
          <Link href="/merchant/lostfound/new" style={{ background: '#fbbf24', color: '#0f4d3a', padding: '8px 14px', borderRadius: 10, fontSize: 12, fontWeight: 900, textDecoration: 'none' }}>+ أعلن</Link>
        </div>
        <input type="search" placeholder="🔍 ابحث عن شيء مفقود أو موجود..." value={search} onChange={e => setSearch(e.target.value)} style={{ width: '100%', padding: '12px 16px', borderRadius: 12, border: 'none', fontSize: 14, outline: 'none', boxSizing: 'border-box', background: 'rgba(255,255,255,0.95)', fontFamily: 'inherit' }} />
      </div>

      <div style={{ padding: 16, maxWidth: 800, margin: '0 auto' }}>
        <div style={{ display: 'flex', gap: 6, marginBottom: 16, overflowX: 'auto', paddingBottom: 4 }}>
          {FILTERS.map(f => (
            <button key={f.key} onClick={() => setFilter(f.key)} style={{ background: filter === f.key ? '#0f4d3a' : '#fff', color: filter === f.key ? '#fff' : '#64748b', border: filter === f.key ? '1px solid #0f4d3a' : '1px solid #e2e8f0', padding: '8px 14px', borderRadius: 20, fontSize: 12, fontWeight: 900, cursor: 'pointer', whiteSpace: 'nowrap', fontFamily: 'inherit' }}>
              {f.label} {f.key === 'lost' && stats.lost > 0 && `(${stats.lost})`}{f.key === 'found' && stats.found > 0 && `(${stats.found})`}
            </button>
          ))}
        </div>

        {filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 60, background: '#fff', borderRadius: 16, color: '#64748b' }}>
            <div style={{ fontSize: 60, marginBottom: 12 }}>🔍</div>
            <div style={{ fontSize: 15, fontWeight: 900, marginBottom: 8 }}>
              {items.length === 0 ? 'لا توجد بلاغات بعد' : 'لا توجد نتائج'}
            </div>
            {items.length === 0 && (
              <Link href="/merchant/lostfound/new" style={{ display: 'inline-block', background: '#0f4d3a', color: '#fff', padding: '10px 20px', borderRadius: 10, textDecoration: 'none', fontSize: 13, fontWeight: 900, marginTop: 12 }}>
                + أضف أول بلاغ
              </Link>
            )}
          </div>
        ) : filtered.map(item => {
          const type = POST_TYPES[item.post_type] || POST_TYPES.lost;
          const cat = CATEGORIES[item.category] || CATEGORIES.other;
          const phone = (item.contact_phone || '').replace(/[^0-9]/g, '');
          return (
            <div key={item.id} style={{ background: '#fff', borderRadius: 16, padding: 14, marginBottom: 12, border: '1px solid #e2e8f0', opacity: item.is_resolved ? 0.6 : 1 }}>
              <div style={{ display: 'flex', gap: 12, marginBottom: 10 }}>
                {item.image_url ? (
                  <div style={{ width: 80, height: 80, borderRadius: 10, overflow: 'hidden', flexShrink: 0 }}>
                    <img src={item.image_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                ) : (
                  <div style={{ width: 80, height: 80, borderRadius: 10, background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 36, flexShrink: 0 }}>{cat.icon}</div>
                )}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4, flexWrap: 'wrap' }}>
                    <div style={{ fontSize: 14, fontWeight: 900, color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1, minWidth: 0 }}>{item.title}</div>
                    <span style={{ background: type.bg, color: type.color, padding: '2px 8px', borderRadius: 6, fontSize: 9, fontWeight: 900 }}>{type.icon} {type.label}</span>
                    {item.is_resolved && <span style={{ background: 'rgba(148,163,184,0.15)', color: '#64748b', padding: '2px 8px', borderRadius: 6, fontSize: 9, fontWeight: 900 }}>✅ تم الحل</span>}
                  </div>
                  <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>📂 {cat.label}</div>
                  {item.location && <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>📍 {item.location}{item.city ? ` · ${item.city}` : ''}</div>}
                  <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 4 }}>⏱️ {timeAgo(item.created_at)}</div>
                </div>
              </div>

              {item.description && (
                <div style={{ fontSize: 12, color: '#475569', lineHeight: 1.5, marginBottom: 10, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                  {item.description}
                </div>
              )}

              <div style={{ display: 'flex', gap: 6 }}>
                {phone && <a href={`tel:${phone}`} style={{ flex: 1, padding: 10, background: 'rgba(16,185,129,0.1)', color: '#059669', border: '1px solid rgba(16,185,129,0.3)', borderRadius: 8, textAlign: 'center', textDecoration: 'none', fontSize: 12, fontWeight: 900 }}>📞</a>}
                {phone && <a href={`https://wa.me/${phone}?text=${encodeURIComponent('مرحباً، بخصوص البلاغ: ' + item.title)}`} target="_blank" rel="noreferrer" style={{ flex: 1, padding: 10, background: 'rgba(37,211,102,0.1)', color: '#25D366', border: '1px solid rgba(37,211,102,0.3)', borderRadius: 8, textAlign: 'center', textDecoration: 'none', fontSize: 12, fontWeight: 900 }}>💬</a>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
