'use client';
import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { useCurrentUser } from '@/lib/useCurrentUser';
import { useToast } from '@/components/Toast';
import { SkeletonList } from '@/components/Skeleton';
import EmptyState from '@/components/EmptyState';

export default function MyAuctionsPage() {
  const router = useRouter();
  const { user, loading: uL, dataOwnerName } = useCurrentUser();
  const { success, error: tE } = useToast();
  const [auctions, setAuctions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    if (uL) return;
    if (!user) { router.replace('/login'); return; }
    load();
  }, [user, uL]);

  async function load() {
    if (!supabase || !dataOwnerName) { setLoading(false); return; }
    const { data } = await supabase.from('auctions').select('*').eq('seller_name', dataOwnerName).order('created_at', { ascending: false });
    setAuctions(data || []);
    setLoading(false);
  }

  const filtered = useMemo(() => {
    let list = auctions;
    const now = new Date();
    if (filter === 'active') list = list.filter(a => a.status !== 'ended' && a.ends_at && new Date(a.ends_at) > now);
    if (filter === 'ended') list = list.filter(a => a.status === 'ended' || (a.ends_at && new Date(a.ends_at) <= now));
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(a => (a.title || '').toLowerCase().includes(q));
    }
    return list;
  }, [auctions, search, filter]);

  async function del(a) {
    if (!confirm(`حذف مزاد "${a.title}"؟`)) return;
    await supabase.from('auctions').delete().eq('id', a.id);
    success('✅ تم الحذف'); load();
  }

  async function endAuction(a) {
    if (!confirm('إنهاء المزاد الآن؟')) return;
    await supabase.from('auctions').update({ status: 'ended', ends_at: new Date().toISOString() }).eq('id', a.id);
    success('✅ تم إنهاء المزاد'); load();
  }

  if (uL || loading) return <div style={{ padding: 16, background: '#f8fafc', minHeight: '100vh' }}><SkeletonList count={3} /></div>;

  const now = new Date();
  const isActive = (a) => a.status !== 'ended' && a.ends_at && new Date(a.ends_at) > now;
  const isEnded = (a) => a.status === 'ended' || (a.ends_at && new Date(a.ends_at) <= now);

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', paddingBottom: 80 }}>
      <div style={{ position: 'sticky', top: 0, zIndex: 10, background: 'linear-gradient(135deg,#f59e0b,#d97706)', padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <Link href="/merchant" style={{ color: '#fff', textDecoration: 'none', fontSize: 20, width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,.15)', borderRadius: '50%' }}>→</Link>
        <div style={{ flex: 1 }}>
          <div style={{ color: '#fff', fontSize: 16, fontWeight: 900 }}>🏆 مزاداتي</div>
          <div style={{ color: 'rgba(255,255,255,.8)', fontSize: 11, marginTop: 2 }}>{auctions.length} مزاد</div>
        </div>
        <Link href="/merchant/auctions/new" style={{ background: '#fff', color: '#d97706', border: 'none', padding: '8px 14px', borderRadius: 10, fontSize: 12, fontWeight: 900, textDecoration: 'none' }}>+ مزاد</Link>
      </div>

      <div style={{ padding: 16 }}>
        <input type="text" placeholder="🔍 ابحث في مزاداتك..." value={search} onChange={(e) => setSearch(e.target.value)}
          style={{ width: '100%', padding: '12px 14px', border: '1px solid #e5e7eb', borderRadius: 12, fontSize: 13, fontFamily: 'inherit', boxSizing: 'border-box', outline: 'none', background: '#fff', marginBottom: 10 }} />
        <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 4 }}>
          {[['all','الكل'], ['active','🟢 نشطة'], ['ended','⚫ منتهية']].map(([k, l]) => (
            <button key={k} onClick={() => setFilter(k)} style={{ padding: '8px 14px', background: filter === k ? '#f59e0b' : '#fff', color: filter === k ? '#fff' : '#64748b', border: `1px solid ${filter === k ? '#f59e0b' : '#e5e7eb'}`, borderRadius: 10, fontSize: 11.5, fontWeight: 800, cursor: 'pointer', whiteSpace: 'nowrap', fontFamily: 'inherit' }}>{l}</button>
          ))}
        </div>
      </div>

      <div style={{ padding: '0 16px' }}>
        {filtered.length === 0 ? (
          <EmptyState icon="🏆" title="لا توجد مزادات" description="أضف مزادك الأول لجذب المشترين" actionLabel="+ إضافة مزاد" actionHref="/merchant/auctions/new" />
        ) : filtered.map(a => {
          const active = isActive(a);
          return (
            <div key={a.id} style={{ background: '#fff', borderRadius: 14, padding: 14, marginBottom: 10, border: `1px solid ${active ? '#f59e0b' : '#e5e7eb'}` }}>
              <div style={{ display: 'flex', gap: 12, marginBottom: 10 }}>
                {a.image_url ? (
                  <img src={a.image_url} alt="" style={{ width: 60, height: 60, borderRadius: 10, objectFit: 'cover' }} />
                ) : (
                  <div style={{ width: 60, height: 60, borderRadius: 10, background: 'rgba(245,158,11,.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26 }}>🏆</div>
                )}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 900, color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.title}</div>
                  <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>
                    {active ? '🟢 نشط' : '⚫ منتهي'} · {a.bid_count || 0} مزايدة
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 900, color: '#f59e0b', marginTop: 4 }}>
                    {Number(a.current_price || a.starting_price || 0).toLocaleString()} {a.currency || 'SYP'}
                  </div>
                </div>
                {active && <span style={{ background: 'rgba(16,185,129,.15)', color: '#10b981', padding: '3px 10px', borderRadius: 6, fontSize: 9.5, fontWeight: 900, height: 'fit-content' }}>حي</span>}
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                <Link href={`/auction/${a.id}`} style={{ flex: 1, padding: 8, background: '#f1f5f9', color: '#475569', borderRadius: 8, fontSize: 11, fontWeight: 800, textDecoration: 'none', textAlign: 'center' }}>👁️ عرض</Link>
                {active && <button onClick={() => endAuction(a)} style={{ flex: 1, padding: 8, background: 'rgba(220,38,38,.1)', color: '#dc2626', border: 'none', borderRadius: 8, fontSize: 11, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit' }}>⏹ إنهاء</button>}
                <button onClick={() => del(a)} style={{ padding: 8, background: 'rgba(220,38,38,.1)', color: '#dc2626', border: 'none', borderRadius: 8, fontSize: 11, cursor: 'pointer', fontFamily: 'inherit' }}>🗑️</button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
