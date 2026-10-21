'use client';
import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { useCurrentUser } from '@/lib/useCurrentUser';
import { useToast } from '@/components/Toast';

export default function MerchantAuctionsPage() {
  const router = useRouter();
  const { success } = useToast();
  const { user, loading: userLoading, dataOwnerName } = useCurrentUser();
  const [auctions, setAuctions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(null);
  const [viewingBids, setViewingBids] = useState(null);
  const [bids, setBids] = useState([]);
  const [loadingBids, setLoadingBids] = useState(false);

  useEffect(() => {
    if (userLoading) return;
    if (!user || !dataOwnerName) { setLoading(false); return; }
    loadAuctions();
  }, [user, userLoading, dataOwnerName]);

  async function loadAuctions() {
    if (!supabase || !dataOwnerName) return;
    setLoading(true);
    try {
      const { data } = await supabase.from('auctions').select('*').eq('provider_name', dataOwnerName).order('created_at', { ascending: false });
      setAuctions(data || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }

  async function deleteAuction(a) {
    if (!confirm(`حذف المزاد "${a.title}"؟ سيتم حذف كل المزايدات المرتبطة به.`)) return;
    setDeleting(a.id);
    await supabase.from('auction_bids').delete().eq('auction_id', a.id);
    const { error } = await supabase.from('auctions').delete().eq('id', a.id);
    if (!error) { success('🗑️ تم الحذف'); setAuctions(prev => prev.filter(x => x.id !== a.id)); }
    setDeleting(null);
  }

  async function endAuction(a) {
    if (!confirm('إنهاء المزاد الآن؟')) return;
    const { error } = await supabase.from('auctions').update({ status: 'ended' }).eq('id', a.id);
    if (!error) { success('✅ تم إنهاء المزاد'); loadAuctions(); }
  }

  async function openBids(a) {
    setViewingBids(a);
    setLoadingBids(true);
    try {
      const { data } = await supabase.from('auction_bids').select('*').eq('auction_id', a.id).order('amount', { ascending: false });
      setBids(data || []);
    } catch (e) { console.error(e); }
    finally { setLoadingBids(false); }
  }

  const stats = useMemo(() => ({
    total: auctions.length,
    active: auctions.filter(a => a.status === 'active' && new Date(a.ends_at) > new Date()).length,
    ended: auctions.filter(a => a.status !== 'active' || new Date(a.ends_at) <= new Date()).length,
  }), [auctions]);

  if (userLoading || loading) return <div style={{ padding: 80, textAlign: 'center' }}>⏳</div>;

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', paddingBottom: 100 }}>
      <div style={{ background: '#0f4d3a', padding: '16px 20px', position: 'sticky', top: 0, zIndex: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Link href="/merchant" style={{ color: '#fff', textDecoration: 'none', fontSize: 20 }}>←</Link>
          <div style={{ flex: 1 }}><h1 style={{ color: '#fff', fontSize: 18, fontWeight: 900, margin: 0 }}>🏆 مزاداتي</h1></div>
          <Link href="/merchant/auctions/new" style={{ background: '#fbbf24', color: '#0f4d3a', padding: '8px 14px', borderRadius: 10, fontSize: 12, fontWeight: 900, textDecoration: 'none' }}>+ جديد</Link>
        </div>
      </div>

      <div style={{ padding: 16, maxWidth: 800, margin: '0 auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 16 }}>
          <StatBox label="الكل" value={stats.total} color="#0f4d3a" />
          <StatBox label="نشطة" value={stats.active} color="#10b981" />
          <StatBox label="منتهية" value={stats.ended} color="#94a3b8" />
        </div>

        {auctions.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 40, background: '#fff', borderRadius: 16, color: '#64748b' }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>🏆</div>
            <div style={{ fontSize: 15, fontWeight: 900, marginBottom: 8 }}>لم تنشئ مزادات بعد</div>
            <Link href="/merchant/auctions/new" style={{ display: 'inline-block', background: '#0f4d3a', color: '#fff', padding: '10px 20px', borderRadius: 10, textDecoration: 'none', fontSize: 13, fontWeight: 900 }}>+ أنشئ مزادك الأول</Link>
          </div>
        ) : auctions.map(a => {
          const isEnded = a.status !== 'active' || new Date(a.ends_at) <= new Date();
          return (
            <div key={a.id} style={{ background: '#fff', borderRadius: 14, padding: 14, marginBottom: 10, border: '1px solid #e2e8f0', opacity: isEnded ? 0.8 : 1 }}>
              <div style={{ display: 'flex', gap: 12, marginBottom: 10 }}>
                <div style={{ width: 70, height: 70, borderRadius: 12, overflow: 'hidden', background: '#f1f5f9', flexShrink: 0 }}>
                  {a.image_url ? <img src={a.image_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28 }}>🏆</div>}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 900, color: '#0f172a', marginBottom: 4 }}>{a.title}</div>
                  <div style={{ fontSize: 11, color: '#f59e0b', fontWeight: 900 }}>السعر الحالي: {Number(a.current_price).toLocaleString()} ل.س</div>
                  <div style={{ fontSize: 10.5, color: isEnded ? '#ef4444' : '#10b981', fontWeight: 900, marginTop: 2 }}>
                    {isEnded ? '⏰ منتهي' : `⏱️ ينتهي: ${new Date(a.ends_at).toLocaleString('ar-SY')}`}
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                <button onClick={() => openBids(a)} style={btnStyle('rgba(139,92,246,0.1)', '#8b5cf6')}>📋 المزايدات</button>
                {!isEnded && <button onClick={() => endAuction(a)} style={btnStyle('rgba(245,158,11,0.1)', '#f59e0b')}>⏸️ إنهاء</button>}
                <button onClick={() => deleteAuction(a)} disabled={deleting === a.id} style={btnStyle('rgba(239,68,68,0.1)', '#ef4444')}>{deleting === a.id ? '⏳' : '🗑️'}</button>
              </div>
            </div>
          );
        })}
      </div>

      {viewingBids && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 100, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
          <div style={{ background: '#fff', width: '100%', maxWidth: 500, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, maxHeight: '80vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h2 style={{ fontSize: 16, fontWeight: 900, margin: 0 }}>📋 مزايدات: {viewingBids.title}</h2>
              <button onClick={() => setViewingBids(null)} style={{ background: '#f1f5f9', border: 'none', width: 32, height: 32, borderRadius: '50%', fontSize: 16, cursor: 'pointer' }}>✕</button>
            </div>
            {loadingBids ? <div style={{ textAlign: 'center', padding: 20 }}>⏳</div> : bids.length === 0 ? <div style={{ textAlign: 'center', padding: 20, color: '#64748b' }}>لا توجد مزايدات بعد</div> : (
              bids.map((b, i) => (
                <div key={b.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 12, background: i === 0 ? 'rgba(16,185,129,0.08)' : '#f8fafc', borderRadius: 10, marginBottom: 8, border: i === 0 ? '1px solid rgba(16,185,129,0.3)' : '1px solid #e2e8f0' }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 900, color: '#0f172a' }}>{i === 0 ? '👑 ' : ''}{b.bidder_name}</div>
                    <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>📱 {b.bidder_phone}</div>
                    <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 2 }}>{new Date(b.created_at).toLocaleString('ar-SY')}</div>
                  </div>
                  <div style={{ fontSize: 15, fontWeight: 900, color: i === 0 ? '#10b981' : '#475569' }}>{Number(b.amount).toLocaleString()} ل.س</div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      <Link href="/merchant/auctions/new" style={{ position: 'fixed', bottom: 20, left: 20, right: 20, background: 'linear-gradient(135deg, #10b981, #059669)', color: '#fff', padding: 16, borderRadius: 14, textAlign: 'center', textDecoration: 'none', fontSize: 15, fontWeight: 900, boxShadow: '0 10px 30px rgba(16,185,129,0.4)', zIndex: 30 }}>+ مزاد جديد</Link>
    </div>
  );
}

function StatBox({ label, value, color }) {
  return <div style={{ background: '#fff', borderRadius: 12, padding: 12, textAlign: 'center', border: '1px solid #e2e8f0' }}><div style={{ fontSize: 18, fontWeight: 900, color, marginBottom: 2 }}>{value}</div><div style={{ fontSize: 9.5, color: '#64748b', fontWeight: 800 }}>{label}</div></div>;
}

const btnStyle = (bg, color) => ({ flex: 1, minWidth: 60, padding: 10, background: bg, color, border: 'none', borderRadius: 8, fontSize: 11, fontWeight: 900, cursor: 'pointer', fontFamily: 'inherit' });
