'use client';
import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { useCurrentUser } from '@/lib/useCurrentUser';
import { useToast } from '@/components/Toast';

export default function MerchantMemoryPage() {
  const router = useRouter();
  const { success } = useToast();
  const { user, loading: userLoading, dataOwnerName } = useCurrentUser();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [deleting, setDeleting] = useState(null);

  useEffect(() => {
    if (userLoading) return;
    if (!user || !dataOwnerName) { setLoading(false); return; }
    loadPosts();
  }, [user, userLoading, dataOwnerName]);

  async function loadPosts() {
    if (!supabase || !dataOwnerName) return;
    try {
      const { data } = await supabase.from('memory_posts').select('*').eq('provider_name', dataOwnerName).order('created_at', { ascending: false });
      setPosts(data || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }

  async function toggleActive(p) {
    const { error } = await supabase.from('memory_posts').update({ is_active: !p.is_active }).eq('id', p.id);
    if (!error) {
      success(p.is_active ? '🙈 مخفي' : '✅ نشط');
      setPosts(prev => prev.map(x => x.id === p.id ? { ...x, is_active: !x.is_active } : x));
    }
  }

  async function deletePost(p) {
    if (!confirm(`حذف "${p.title}"؟`)) return;
    setDeleting(p.id);
    const { error } = await supabase.from('memory_posts').delete().eq('id', p.id);
    if (!error) { success('🗑️ تم الحذف'); setPosts(prev => prev.filter(x => x.id !== p.id)); }
    setDeleting(null);
  }

  const stats = useMemo(() => ({ total: posts.length, active: posts.filter(p => p.is_active).length }), [posts]);
  const filtered = useMemo(() => {
    if (!search.trim()) return posts;
    const q = search.trim().toLowerCase();
    return posts.filter(p => (p.title || '').toLowerCase().includes(q));
  }, [posts, search]);

  if (userLoading || loading) return <div style={{ padding: 80, textAlign: 'center' }}>⏳</div>;

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', paddingBottom: 100 }}>
      <div style={{ background: '#0f4d3a', padding: '16px 20px', position: 'sticky', top: 0, zIndex: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
          <Link href="/merchant" style={{ color: '#fff', textDecoration: 'none', fontSize: 20 }}>←</Link>
          <div style={{ flex: 1 }}><h1 style={{ color: '#fff', fontSize: 18, fontWeight: 900, margin: 0 }}>📸 ذاكرة كنصفرة</h1></div>
          <Link href="/merchant/memory/new" style={{ background: '#fbbf24', color: '#0f4d3a', padding: '8px 14px', borderRadius: 10, fontSize: 12, fontWeight: 900, textDecoration: 'none' }}>+ جديد</Link>
        </div>
        <input type="search" placeholder="🔍 ابحث..." value={search} onChange={e => setSearch(e.target.value)} style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: 'none', fontSize: 13, outline: 'none', boxSizing: 'border-box', background: 'rgba(255,255,255,0.95)' }} />
      </div>

      <div style={{ padding: 16, maxWidth: 800, margin: '0 auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8, marginBottom: 16 }}>
          <StatBox label="الكل" value={stats.total} color="#0f4d3a" />
          <StatBox label="نشط" value={stats.active} color="#10b981" />
        </div>

        {filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 40, background: '#fff', borderRadius: 16, color: '#64748b' }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>📸</div>
            <div style={{ fontSize: 15, fontWeight: 900, marginBottom: 8 }}>{posts.length === 0 ? 'لم تنشر ذكريات بعد' : 'لا نتائج'}</div>
            {posts.length === 0 && <Link href="/merchant/memory/new" style={{ display: 'inline-block', background: '#0f4d3a', color: '#fff', padding: '10px 20px', borderRadius: 10, textDecoration: 'none', fontSize: 13, fontWeight: 900 }}>+ أضف ذكرى</Link>}
          </div>
        ) : filtered.map(p => (
          <div key={p.id} style={{ background: '#fff', borderRadius: 14, padding: 14, marginBottom: 10, border: '1px solid #e2e8f0', opacity: p.is_active ? 1 : 0.6, display: 'flex', gap: 12 }}>
            <div style={{ width: 70, height: 70, borderRadius: 12, overflow: 'hidden', background: '#f1f5f9', flexShrink: 0 }}>
              {p.image_url ? <img src={p.image_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28 }}>📸</div>}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 900, color: '#0f172a', marginBottom: 4 }}>{p.title}</div>
              <div style={{ fontSize: 10.5, color: '#64748b', marginBottom: 8 }}>{p.type === 'photo' ? '📷 صورة' : p.type === 'story' ? '📖 قصة' : '🏛️ مكان'} · {p.location || '—'}</div>
              <div style={{ display: 'flex', gap: 6 }}>
                <button onClick={() => toggleActive(p)} style={btnStyle(p.is_active ? 'rgba(245,158,11,0.1)' : 'rgba(16,185,129,0.1)', p.is_active ? '#f59e0b' : '#10b981')}>{p.is_active ? '🙈' : '👁️'}</button>
                <button onClick={() => deletePost(p)} disabled={deleting === p.id} style={btnStyle('rgba(239,68,68,0.1)', '#ef4444')}>{deleting === p.id ? '⏳' : '🗑️'}</button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <Link href="/merchant/memory/new" style={{ position: 'fixed', bottom: 20, left: 20, right: 20, background: 'linear-gradient(135deg, #10b981, #059669)', color: '#fff', padding: 16, borderRadius: 14, textAlign: 'center', textDecoration: 'none', fontSize: 15, fontWeight: 900, boxShadow: '0 10px 30px rgba(16,185,129,0.4)', zIndex: 30 }}>+ ذكرى جديدة</Link>
    </div>
  );
}

function StatBox({ label, value, color }) {
  return <div style={{ background: '#fff', borderRadius: 12, padding: 12, textAlign: 'center', border: '1px solid #e2e8f0' }}><div style={{ fontSize: 18, fontWeight: 900, color, marginBottom: 2 }}>{value}</div><div style={{ fontSize: 9.5, color: '#64748b', fontWeight: 800 }}>{label}</div></div>;
}

const btnStyle = (bg, color) => ({ flex: 1, padding: 8, background: bg, color, border: 'none', borderRadius: 6, fontSize: 12, fontWeight: 900, cursor: 'pointer', fontFamily: 'inherit' });
