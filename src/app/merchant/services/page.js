'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

export default function ServicesListPage() {
  const router = useRouter();
  const [entity, setEntity] = useState(null);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');

  useEffect(() => {
    let stored = null;
    try { stored = JSON.parse(localStorage.getItem('sanad_entity') || 'null'); } catch {}
    if (!stored) { router.replace('/login'); return; }
    setEntity(stored);
    load(stored);
  }, [router]);

  async function load(ent) {
    if (!supabase) return;
    setLoading(true);
    const { data } = await supabase.from('services').select('*').eq('provider_name', ent.display_name).order('created_at', { ascending: false });
    setLoading(false);
    if (Array.isArray(data)) setServices(data);
  }

  async function del(id) {
    if (!confirm('حذف الخدمة؟')) return;
    const { error } = await supabase.from('services').delete().eq('id', id);
    if (error) return alert('خطأ: ' + error.message);
    setServices((s) => s.filter((x) => x.id !== id));
  }

  if (!entity) return <div style={{ padding: 60, textAlign: 'center', color: '#fff' }}>جارٍ التحميل...</div>;

  const filtered = services.filter((s) => {
    if (filter === 'published' && s.status !== 'published') return false;
    if (filter === 'draft' && s.status !== 'draft') return false;
    if (search) return (s.title || '').toLowerCase().includes(search.toLowerCase());
    return true;
  });

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(180deg,#0a1f16,#061410)', paddingBottom: 40 }}>
      <div style={{ position: 'sticky', top: 0, zIndex: 10, padding: '14px 16px', background: 'rgba(10,31,22,.95)', backdropFilter: 'blur(12px)', borderBottom: '1px solid rgba(255,255,255,.08)', display: 'flex', alignItems: 'center', gap: 12 }}>
        <Link href="/merchant" style={{ color: '#fff', textDecoration: 'none', fontSize: 20 }}>→</Link>
        <h1 style={{ flex: 1, margin: 0, fontSize: 16, fontWeight: 900, color: '#fff' }}>خدماتي ({services.length})</h1>
        <Link href="/merchant/services/new" style={{ background: 'linear-gradient(135deg,#10b981,#059669)', color: '#fff', padding: '8px 14px', borderRadius: 10, fontSize: 12, fontWeight: 800, textDecoration: 'none' }}>+ خدمة</Link>
      </div>
      <div style={{ padding: '16px 16px 0' }}>
        <input type="text" placeholder="🔍 ابحث..." value={search} onChange={(e) => setSearch(e.target.value)} style={{ width: '100%', padding: '12px 16px', background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.1)', borderRadius: 12, color: '#fff', fontSize: 13, marginBottom: 12, boxSizing: 'border-box', outline: 'none' }} />
        <div style={{ display: 'flex', gap: 8 }}>
          {[['all','الكل'],['published','منشورة'],['draft','مسودات']].map(([k,l]) => (
            <button key={k} onClick={() => setFilter(k)} style={{ padding: '8px 14px', background: filter === k ? 'linear-gradient(135deg,#10b981,#059669)' : 'rgba(255,255,255,.06)', color: '#fff', border: '1px solid ' + (filter === k ? 'transparent' : 'rgba(255,255,255,.1)'), borderRadius: 10, fontSize: 11.5, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit' }}>{l}</button>
          ))}
        </div>
      </div>
      <div style={{ padding: 16 }}>
        {loading && <div style={{ textAlign: 'center', padding: 40, color: 'rgba(255,255,255,.6)' }}>جارٍ التحميل...</div>}
        {!loading && filtered.length === 0 && (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: 'rgba(255,255,255,.5)' }}>
            <div style={{ fontSize: 56, marginBottom: 16 }}>🛠️</div>
            <p style={{ fontSize: 15, fontWeight: 700 }}>{services.length === 0 ? 'ما عندك خدمات بعد' : 'لا توجد نتائج'}</p>
            {services.length === 0 && <Link href="/merchant/services/new" style={{ display: 'inline-block', marginTop: 16, background: 'linear-gradient(135deg,#10b981,#059669)', color: '#fff', padding: '10px 20px', borderRadius: 12, fontSize: 13, fontWeight: 800, textDecoration: 'none' }}>+ أضف أول خدمة</Link>}
          </div>
        )}
        {filtered.map((s) => (
          <div key={s.id} style={{ background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.08)', borderRadius: 16, padding: 14, marginBottom: 12 }}>
            <div style={{ display: 'flex', gap: 12 }}>
              <div style={{ width: 64, height: 64, borderRadius: 12, overflow: 'hidden', flexShrink: 0, background: 'rgba(255,255,255,.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28 }}>
                {s.image_url ? <img src={s.image_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : '🛠️'}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
                  <h3 style={{ margin: 0, fontSize: 14, fontWeight: 900, color: '#fff' }}>{s.title}</h3>
                  <span style={{ fontSize: 9.5, padding: '2px 6px', borderRadius: 6, background: s.status === 'published' ? 'rgba(16,185,129,.15)' : 'rgba(251,191,36,.15)', color: s.status === 'published' ? '#34d399' : '#fbbf24', fontWeight: 800 }}>
                    {s.status === 'published' ? '✓ منشورة' : '⏳ مسودة'}
                  </span>
                </div>
                {s.description && <p style={{ margin: '0 0 6px', fontSize: 11.5, color: 'rgba(255,255,255,.65)' }}>{s.description.slice(0, 80)}...</p>}
                <div style={{ display: 'flex', gap: 10, fontSize: 11, color: 'rgba(255,255,255,.5)', flexWrap: 'wrap' }}>
                  {s.phone && <span>📞 {s.phone}</span>}
                  {s.address && <span>📍 {s.address}</span>}
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
              <Link href={`/service/${s.id}`} target="_blank" style={{ flex: 1, padding: 8, background: 'rgba(59,130,246,.15)', color: '#60a5fa', border: '1px solid rgba(59,130,246,.3)', borderRadius: 10, fontSize: 11.5, fontWeight: 800, textDecoration: 'none', textAlign: 'center' }}>👁️ عرض</Link>
              <button onClick={() => del(s.id)} style={{ flex: 1, padding: 8, background: 'rgba(220,38,38,.15)', color: '#f87171', border: '1px solid rgba(220,38,38,.3)', borderRadius: 10, fontSize: 11.5, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit' }}>🗑️ حذف</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
