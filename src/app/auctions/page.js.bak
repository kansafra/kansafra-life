'use client';
import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { SkeletonList } from '@/components/Skeleton';
import EmptyState from '@/components/EmptyState';

export default function AuctionsPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('active');

  useEffect(() => { load(); }, []);

  async function load() {
    if (!supabase) { setLoading(false); return; }
    try {
      const { data } = await supabase.from('auctions').select('*').order('created_at', { ascending: false });
      setItems(data || []);
    } catch (e) { console.error(e); }
    setLoading(false);
  }

  const now = new Date();

  const filtered = useMemo(() => {
    let list = items;
    if (status === 'active') list = list.filter(i => i.status !== 'ended' && i.ends_at && new Date(i.ends_at) > now);
    else if (status === 'ended') list = list.filter(i => i.status === 'ended' || (i.ends_at && new Date(i.ends_at) <= now));
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(i => (i.title || '').toLowerCase().includes(q) || (i.description || '').toLowerCase().includes(q));
    }
    return list;
  }, [items, status, search]);

  function timeLeft(endsAt) {
    if (!endsAt) return null;
    const diff = new Date(endsAt) - now;
    if (diff <= 0) return 'انتهى';
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    if (days > 0) return `${days}ي ${hours}س`;
    if (hours > 0) return `${hours}س ${mins}د`;
    return `${mins}د`;
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', paddingBottom: 80 }}>
      <div style={{ background: 'linear-gradient(135deg,#f59e0b,#b45309)', padding: '20px 16px', color: '#fff' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Link href="/" style={{ color: '#fff', textDecoration: 'none', fontSize: 20, width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,.15)', borderRadius: '50%' }}>→</Link>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 20, fontWeight: 900 }}>🏆 المزادات</div>
            <div style={{ fontSize: 12, opacity: 0.85, marginTop: 2 }}>{filtered.length} مزاد</div>
          </div>
          <div style={{ fontSize: 40 }}>🏆</div>
        </div>
      </div>

      <div style={{ padding: 16 }}>
        <input type="text" placeholder="🔍 ابحث في المزادات..." value={search} onChange={(e) => setSearch(e.target.value)}
          style={{ width: '100%', padding: '12px 14px', border: '1px solid #e5e7eb', borderRadius: 12, fontSize: 13, fontFamily: 'inherit', boxSizing: 'border-box', outline: 'none', background: '#fff', marginBottom: 10 }} />
        
        <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 4 }}>
          {[['active','🟢 نشطة'],['ended','⚫ منتهية'],['all','📋 الكل']].map(([k,l]) => (
            <button key={k} onClick={() => setStatus(k)} style={{ padding: '8px 14px', background: status === k ? '#f59e0b' : '#fff', color: status === k ? '#fff' : '#64748b', border: `1px solid ${status === k ? '#f59e0b' : '#e5e7eb'}`, borderRadius: 10, fontSize: 11.5, fontWeight: 800, cursor: 'pointer', whiteSpace: 'nowrap', fontFamily: 'inherit' }}>{l}</button>
          ))}
        </div>
      </div>

      {loading ? (
        <div style={{ padding: 16 }}><SkeletonList count={3} /></div>
      ) : (
        <div style={{ padding: '0 16px' }}>
          {filtered.length === 0 ? (
            <EmptyState icon="🏆" title={search ? 'لا توجد نتائج' : 'لا توجد مزادات'} description="ستظهر المزادات هنا" actionLabel="← الرئيسية" actionHref="/" />
          ) : filtered.map(a => {
            const isEnded = a.status === 'ended' || (a.ends_at && new Date(a.ends_at) <= now);
            return (
              <div key={a.id} style={{ background: '#fff', borderRadius: 16, overflow: 'hidden', marginBottom: 12, border: '1px solid #e5e7eb', opacity: isEnded ? 0.7 : 1 }}>
                {a.image_url ? <img src={a.image_url} alt="" style={{ width: '100%', height: 160, objectFit: 'cover' }} /> : <div style={{ height: 160, background: 'linear-gradient(135deg,#f59e0b,#b45309)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 60 }}>🏆</div>}
                <div style={{ padding: 14 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                    <h3 style={{ fontSize: 15, fontWeight: 900, color: '#0f172a', flex: 1, lineHeight: 1.4 }}>{a.title}</h3>
                    <span style={{ background: isEnded ? 'rgba(100,116,139,.15)' : 'rgba(16,185,129,.15)', color: isEnded ? '#64748b' : '#10b981', padding: '3px 10px', borderRadius: 6, fontSize: 10, fontWeight: 900, whiteSpace: 'nowrap', marginRight: 8 }}>{isEnded ? 'انتهى' : `⏰ ${timeLeft(a.ends_at)}`}</span>
                  </div>
                  {a.description && <p style={{ fontSize: 12, color: '#64748b', lineHeight: 1.6, marginBottom: 8, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{a.description}</p>}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 10, borderTop: '1px solid #f1f5f9' }}>
                    <div>
                      <div style={{ fontSize: 10, color: '#64748b', fontWeight: 700 }}>السعر الحالي</div>
                      <div style={{ fontSize: 18, fontWeight: 900, color: '#f59e0b' }}>{Number(a.current_price || a.starting_price || 0).toLocaleString()} <span style={{ fontSize: 11 }}>{a.currency || 'SYP'}</span></div>
                    </div>
                    {!isEnded && a.seller_phone && (
                      <a href={`https://wa.me/${String(a.seller_phone).replace(/\D/g, '').replace(/^0/, '963')}?text=${encodeURIComponent(`مرحباً، مهتم بمزاد "${a.title}"`)}`} target="_blank" rel="noopener" style={{ padding: '8px 14px', background: 'rgba(37,211,102,.1)', color: '#059669', border: '1px solid rgba(37,211,102,.3)', borderRadius: 8, textDecoration: 'none', fontSize: 11, fontWeight: 900 }}>📱 مزايدة</a>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
