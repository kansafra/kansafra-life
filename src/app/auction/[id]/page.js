'use client';
import { useState, useEffect, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/components/Toast';

export default function AuctionDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { success, error: tE } = useToast();
  const [auction, setAuction] = useState(null);
  const [bids, setBids] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showBidModal, setShowBidModal] = useState(false);
  const [form, setForm] = useState({ bidder_name: '', bidder_phone: '', amount: '' });
  const [bidding, setBidding] = useState(false);
  const [timeLeft, setTimeLeft] = useState(null);
  const [isEnded, setIsEnded] = useState(false);
  const subscriptionRef = useRef(null);

  useEffect(() => {
    if (params?.id) {
      load(decodeURIComponent(params.id));
      setupRealtime(decodeURIComponent(params.id));
    }
    const timer = setInterval(() => updateTimeLeft(), 1000);
    return () => {
      clearInterval(timer);
      if (subscriptionRef.current) supabase.removeChannel(subscriptionRef.current);
    };
  }, [params?.id]);

  async function load(id) {
    if (!supabase) { setLoading(false); return; }
    try {
      const [aRes, bRes] = await Promise.all([
        supabase.from('auctions').select('*').eq('id', id).maybeSingle(),
        supabase.from('auction_bids').select('*').eq('auction_id', id).order('created_at', { ascending: false }).limit(20),
      ]);
      setAuction(aRes.data);
      setBids(bRes.data || []);
    } catch (e) { tE('تعذّر التحميل'); }
    setLoading(false);
    updateTimeLeft();
  }

  function setupRealtime(id) {
    if (!supabase) return;
    subscriptionRef.current = supabase
      .channel(`auction-${id}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'auction_bids', filter: `auction_id=eq.${id}` },
        (payload) => { setBids(prev => [payload.new, ...prev]); load(id); }
      )
      .subscribe();
  }

  function updateTimeLeft() {
    setAuction(prev => {
      if (!prev?.ends_at) return prev;
      const diff = new Date(prev.ends_at) - new Date();
      if (diff <= 0) {
        setIsEnded(true);
        setTimeLeft({ days: 0, hours: 0, mins: 0, secs: 0, ended: true });
      } else {
        setIsEnded(false);
        setTimeLeft({
          days: Math.floor(diff / (1000 * 60 * 60 * 24)),
          hours: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
          mins: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
          secs: Math.floor((diff % (1000 * 60)) / 1000),
          ended: false,
        });
      }
      return prev;
    });
  }

  async function placeBid() {
    if (!form.bidder_name?.trim()) { tE('الاسم مطلوب'); return; }
    if (!form.bidder_phone?.trim()) { tE('الهاتف مطلوب'); return; }
    const amount = Number(form.amount);
    const currentPrice = Number(auction.current_price || auction.starting_price || 0);
    const minBid = currentPrice + Number(auction.min_increment || 100);
    if (!amount || amount < minBid) { tE(`الحد الأدنى للمزايدة: ${minBid.toLocaleString()}`); return; }
    if (isEnded) { tE('انتهى المزاد'); return; }

    setBidding(true);
    try {
      const { error: bidErr } = await supabase.from('auction_bids').insert({
        auction_id: auction.id,
        bidder_name: form.bidder_name.trim(),
        bidder_phone: form.bidder_phone.trim(),
        amount,
      });
      if (bidErr) throw bidErr;

      const { error: updErr } = await supabase.from('auctions').update({
        current_price: amount,
        bid_count: (auction.bid_count || 0) + 1,
        winner_name: form.bidder_name.trim(),
        winner_phone: form.bidder_phone.trim(),
      }).eq('id', auction.id);
      if (updErr) throw updErr;

      success('🎉 تمت مزايدتك بنجاح!');
      setShowBidModal(false);
      setForm({ bidder_name: '', bidder_phone: '', amount: '' });
      load(auction.id);
    } catch (e) { tE('تعذّر: ' + e.message); }
    setBidding(false);
  }

  if (loading) return <div style={{ padding: 80, textAlign: 'center' }}>⏳</div>;
  if (!auction) return (
    <div style={{ padding: 60, textAlign: 'center' }}>
      <div style={{ fontSize: 64, marginBottom: 16 }}>🏆</div>
      <div style={{ fontSize: 18, fontWeight: 900, marginBottom: 16 }}>المزاد غير موجود</div>
      <Link href="/auctions" style={{ display: 'inline-block', padding: '12px 24px', background: '#0f4d3a', color: '#fff', borderRadius: 12, textDecoration: 'none', fontWeight: 900 }}>← المزادات</Link>
    </div>
  );

  const currentPrice = Number(auction.current_price || auction.starting_price || 0);
  const minBid = currentPrice + Number(auction.min_increment || 100);
  const isActive = !isEnded && auction.status !== 'ended';

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', paddingBottom: 100 }}>
      {/* Header */}
      <div style={{ position: 'sticky', top: 0, zIndex: 10, background: '#fff', borderBottom: '1px solid #e5e7eb', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <button onClick={() => router.back()} style={{ background: '#f1f5f9', border: 'none', width: 40, height: 40, borderRadius: '50%', fontSize: 18, cursor: 'pointer', fontFamily: 'inherit' }}>→</button>
        <div style={{ flex: 1, fontSize: 15, fontWeight: 900, color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{auction.title}</div>
        {isActive ? (
          <span style={{ background: 'rgba(16,185,129,.15)', color: '#10b981', padding: '4px 10px', borderRadius: 6, fontSize: 10.5, fontWeight: 900 }}>🔴 حي</span>
        ) : (
          <span style={{ background: '#f1f5f9', color: '#64748b', padding: '4px 10px', borderRadius: 6, fontSize: 10.5, fontWeight: 900 }}>⚫ منتهي</span>
        )}
      </div>

      {/* Image */}
      {auction.image_url ? (
        <img src={auction.image_url} alt={auction.title} style={{ width: '100%', maxHeight: 300, objectFit: 'cover', background: '#f1f5f9' }} />
      ) : (
        <div style={{ height: 200, background: 'linear-gradient(135deg,#f59e0b,#b45309)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 72 }}>🏆</div>
      )}

      <div style={{ padding: 16 }}>
        {/* Countdown */}
        {timeLeft && (
          <div style={{ background: isEnded ? 'linear-gradient(135deg,#64748b,#475569)' : 'linear-gradient(135deg,#f59e0b,#d97706)', borderRadius: 16, padding: 20, color: '#fff', marginBottom: 16, textAlign: 'center' }}>
            <div style={{ fontSize: 11, opacity: 0.9, fontWeight: 700, marginBottom: 10 }}>
              {isEnded ? '⏱️ انتهى المزاد' : '⏱️ ينتهي خلال'}
            </div>
            {!isEnded && (
              <div style={{ display: 'flex', justifyContent: 'center', gap: 8 }}>
                {[
                  { v: timeLeft.days, l: 'يوم' },
                  { v: timeLeft.hours, l: 'ساعة' },
                  { v: timeLeft.mins, l: 'دقيقة' },
                  { v: timeLeft.secs, l: 'ثانية' },
                ].map((t, i) => (
                  <div key={i} style={{ background: 'rgba(255,255,255,.2)', borderRadius: 10, padding: '8px 12px', minWidth: 52 }}>
                    <div style={{ fontSize: 22, fontWeight: 900 }}>{String(t.v).padStart(2, '0')}</div>
                    <div style={{ fontSize: 9, opacity: 0.9, fontWeight: 700, marginTop: 2 }}>{t.l}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Current Price */}
        <div style={{ background: '#fff', borderRadius: 16, padding: 20, marginBottom: 12, border: '1px solid #e5e7eb', textAlign: 'center' }}>
          <div style={{ fontSize: 11, color: '#64748b', fontWeight: 700, marginBottom: 6 }}>
            {auction.bid_count > 0 ? `السعر الحالي (${auction.bid_count} مزايدة)` : 'السعر الابتدائي'}
          </div>
          <div style={{ fontSize: 36, fontWeight: 900, color: '#f59e0b', direction: 'ltr' }}>
            {currentPrice.toLocaleString()} <span style={{ fontSize: 16, color: '#64748b' }}>{auction.currency || 'SYP'}</span>
          </div>
          {isActive && (
            <div style={{ fontSize: 12, color: '#64748b', marginTop: 8, fontWeight: 700 }}>
              الحد الأدنى للمزايدة: <strong style={{ color: '#f59e0b' }}>{minBid.toLocaleString()} {auction.currency || 'SYP'}</strong>
            </div>
          )}
        </div>

        {/* Description */}
        {auction.description && (
          <div style={{ background: '#fff', borderRadius: 16, padding: 16, marginBottom: 12, border: '1px solid #e5e7eb' }}>
            <div style={{ fontSize: 13, fontWeight: 900, marginBottom: 8 }}>📝 التفاصيل</div>
            <p style={{ fontSize: 13, color: '#334155', lineHeight: 1.7, margin: 0 }}>{auction.description}</p>
          </div>
        )}

        {/* Bids History */}
        {bids.length > 0 && (
          <div style={{ background: '#fff', borderRadius: 16, padding: 16, border: '1px solid #e5e7eb' }}>
            <div style={{ fontSize: 13, fontWeight: 900, marginBottom: 12, display: 'flex', justifyContent: 'space-between' }}>
              <span>📊 سجل المزايدات</span>
              <span style={{ fontSize: 11, color: '#64748b' }}>{bids.length} مزايدة</span>
            </div>
            {bids.slice(0, 10).map((b, i) => (
              <div key={b.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: i < Math.min(bids.length, 10) - 1 ? '1px solid #f1f5f9' : 'none' }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 900, color: '#0f172a' }}>{b.bidder_name}</div>
                  <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 2 }}>{new Date(b.created_at).toLocaleString('ar-EG')}</div>
                </div>
                <div style={{ fontSize: 14, fontWeight: 900, color: i === 0 ? '#10b981' : '#64748b' }}>
                  {Number(b.amount).toLocaleString()} {auction.currency || 'SYP'}
                  {i === 0 && <span style={{ fontSize: 9, marginRight: 4, padding: '2px 6px', background: 'rgba(16,185,129,.15)', borderRadius: 4 }}>الأعلى</span>}
                </div>
              </div>
            ))}
          </div>
        )}

        {isEnded && auction.winner_name && (
          <div style={{ background: 'linear-gradient(135deg,#10b981,#059669)', borderRadius: 16, padding: 16, marginTop: 12, color: '#fff', textAlign: 'center' }}>
            <div style={{ fontSize: 11, opacity: 0.9, fontWeight: 700, marginBottom: 4 }}>🎉 الفائز</div>
            <div style={{ fontSize: 16, fontWeight: 900 }}>{auction.winner_name}</div>
          </div>
        )}
      </div>

      {/* Bottom Action */}
      <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: '#fff', borderTop: '1px solid #e5e7eb', padding: 12, boxShadow: '0 -4px 12px rgba(0,0,0,.05)' }}>
        {isActive ? (
          <button onClick={() => { setForm({ bidder_name: '', bidder_phone: '', amount: minBid }); setShowBidModal(true); }} style={{ width: '100%', padding: 16, background: 'linear-gradient(135deg,#f59e0b,#d97706)', color: '#fff', border: 'none', borderRadius: 12, fontSize: 15, fontWeight: 900, cursor: 'pointer', fontFamily: 'inherit', boxShadow: '0 4px 12px rgba(245,158,11,.3)' }}>
            🔨 زايد الآن
          </button>
        ) : (
          <button disabled style={{ width: '100%', padding: 16, background: '#e5e7eb', color: '#94a3b8', border: 'none', borderRadius: 12, fontSize: 15, fontWeight: 900, fontFamily: 'inherit', cursor: 'not-allowed' }}>
            ⚫ انتهى المزاد
          </button>
        )}
      </div>

      {/* Bid Modal */}
      {showBidModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.6)', zIndex: 100, display: 'flex', alignItems: 'flex-end' }} onClick={() => setShowBidModal(false)}>
          <div style={{ background: '#fff', borderRadius: '24px 24px 0 0', width: '100%', maxWidth: 500, margin: '0 auto', padding: '24px 20px 30px' }} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ fontSize: 18, fontWeight: 900, marginBottom: 8, textAlign: 'center' }}>🔨 زايد الآن</h3>
            <p style={{ fontSize: 12, color: '#64748b', textAlign: 'center', marginBottom: 20 }}>الحد الأدنى: {minBid.toLocaleString()} {auction.currency || 'SYP'}</p>

            <input type="text" placeholder="اسمك *" value={form.bidder_name} onChange={(e) => setForm({ ...form, bidder_name: e.target.value })} style={{ width: '100%', padding: 14, border: '1px solid #e5e7eb', borderRadius: 10, fontSize: 14, marginBottom: 10, boxSizing: 'border-box', fontFamily: 'inherit' }} />
            <input type="tel" placeholder="رقم الهاتف *" value={form.bidder_phone} onChange={(e) => setForm({ ...form, bidder_phone: e.target.value })} style={{ width: '100%', padding: 14, border: '1px solid #e5e7eb', borderRadius: 10, fontSize: 14, marginBottom: 10, boxSizing: 'border-box', fontFamily: 'inherit', direction: 'ltr', textAlign: 'right' }} />
            
            <label style={{ display: 'block', fontSize: 12, fontWeight: 800, color: '#334155', marginBottom: 6 }}>مبلغ المزايدة *</label>
            <div style={{ display: 'flex', gap: 6, marginBottom: 6 }}>
              {[minBid, minBid + 1000, minBid + 5000, minBid + 10000].map(v => (
                <button key={v} type="button" onClick={() => setForm({ ...form, amount: v })} style={{ flex: 1, padding: 8, background: Number(form.amount) === v ? '#f59e0b' : '#f1f5f9', color: Number(form.amount) === v ? '#fff' : '#64748b', border: 'none', borderRadius: 6, fontSize: 11, fontWeight: 900, cursor: 'pointer', fontFamily: 'inherit' }}>{v.toLocaleString()}</button>
              ))}
            </div>
            <input type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} style={{ width: '100%', padding: 16, border: '2px solid #f59e0b', borderRadius: 12, fontSize: 22, fontWeight: 900, marginBottom: 20, boxSizing: 'border-box', fontFamily: 'inherit', textAlign: 'center', color: '#f59e0b' }} />

            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setShowBidModal(false)} style={{ flex: 1, padding: 14, background: '#f1f5f9', border: 'none', borderRadius: 10, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit' }}>إلغاء</button>
              <button onClick={placeBid} disabled={bidding} style={{ flex: 2, padding: 14, background: 'linear-gradient(135deg,#f59e0b,#d97706)', color: '#fff', border: 'none', borderRadius: 10, fontWeight: 900, cursor: bidding ? 'not-allowed' : 'pointer', fontFamily: 'inherit' }}>{bidding ? '...' : `✓ زايد ${Number(form.amount || 0).toLocaleString()}`}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
