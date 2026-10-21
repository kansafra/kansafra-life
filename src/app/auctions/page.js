'use client';
import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/components/Toast';

function getTimeLeft(endDate) {
  if (!endDate) return { ended: true, text: 'انتهى', urgent: false };
  const diff = new Date(endDate).getTime() - Date.now();
  if (diff <= 0) return { ended: true, text: 'انتهى', urgent: true };
  const days = Math.floor(diff / 86400000);
  const hours = Math.floor((diff % 86400000) / 3600000);
  const minutes = Math.floor((diff % 3600000) / 60000);
  const seconds = Math.floor((diff % 60000) / 1000);
  if (days > 0) return { ended: false, text: `${days} يوم و ${hours} ساعة`, urgent: false };
  if (hours > 0) return { ended: false, text: `${hours}:${String(minutes).padStart(2,'0')}:${String(seconds).padStart(2,'0')}`, urgent: true };
  return { ended: false, text: `${minutes}:${String(seconds).padStart(2,'0')}`, urgent: true };
}

export default function AuctionsPage() {
  const router = useRouter();
  const { success, error: toastError } = useToast();
  const [auctions, setAuctions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('active');
  const [selected, setSelected] = useState(null);
  const [bidForm, setBidForm] = useState({ bidder_name: '', bidder_phone: '', amount: '' });
  const [submitting, setSubmitting] = useState(false);
  const [tick, setTick] = useState(0);
  const [recentBids, setRecentBids] = useState([]);

  useEffect(() => {
    loadAuctions();
    try {
      const cust = JSON.parse(localStorage.getItem('sanad_customer') || 'null');
      if (cust) setBidForm(f => ({ ...f, bidder_name: cust.name || '', bidder_phone: cust.phone || '' }));
    } catch {}

    const channel = supabase
      .channel('auctions-live')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'auctions' }, (payload) => {
        setAuctions(prev => prev.map(a => a.id === payload.new.id ? { ...a, ...payload.new } : a));
        setSelected(prev => prev && prev.id === payload.new.id ? { ...prev, ...payload.new } : prev);
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'auction_bids' }, (payload) => {
        success('🔔 مزايدة جديدة!');
      })
      .subscribe();

    const interval = setInterval(() => setTick(t => t + 1), 1000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(interval);
    };
  }, []);

  async function loadAuctions() {
    if (!supabase) return;
    setLoading(true);
    try {
      const { data } = await supabase.from('auctions').select('*').order('created_at', { ascending: false });
      setAuctions(data || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }

  async function openAuction(auction) {
    setSelected(auction);
    if (auction.status === 'active') {
      const { data } = await supabase.from('auction_bids').select('*').eq('auction_id', auction.id).order('created_at', { ascending: false }).limit(20);
      setRecentBids(data || []);
    } else {
      setRecentBids([]);
    }
    setBidForm(f => ({ ...f, amount: String(Number(auction.current_price || auction.starting_price) + Number(auction.min_increment || 100)) }));
  }

  async function submitBid(e) {
    e.preventDefault();
    if (!selected) return;
    if (!bidForm.bidder_name.trim() || !bidForm.bidder_phone.trim()) { toastError('الاسم والهاتف مطلوبان'); return; }
    const bidAmount = Number(bidForm.amount);
    if (!bidAmount || bidAmount <= Number(selected.current_price || selected.starting_price)) {
      toastError(`يجب أن تكون المزايدة أعلى من ${Number(selected.current_price || selected.starting_price).toLocaleString()}`);
      return;
    }
    if (bidAmount < Number(selected.current_price || selected.starting_price) + Number(selected.min_increment || 100)) {
      toastError(`الحد الأدنى للزيادة ${Number(selected.min_increment || 100).toLocaleString()}`);
      return;
    }
    setSubmitting(true);
    try {
      const { error: bidErr } = await supabase.from('auction_bids').insert({
        auction_id: selected.id,
        bidder_name: bidForm.bidder_name.trim(),
        bidder_phone: bidForm.bidder_phone.trim(),
        amount: bidAmount,
      });
      if (bidErr) throw bidErr;

      const { error: updErr } = await supabase.from('auctions').update({
        current_price: bidAmount,
        winner_name: bidForm.bidder_name.trim(),
        winner_phone: bidForm.bidder_phone.trim(),
      }).eq('id', selected.id);
      if (updErr) throw updErr;

      success('🎉 تم تسجيل مزايدتك بنجاح!');
      setSelected({ ...selected, current_price: bidAmount, winner_name: bidForm.bidder_name.trim(), winner_phone: bidForm.bidder_phone.trim() });
      const { data } = await supabase.from('auction_bids').select('*').eq('auction_id', selected.id).order('created_at', { ascending: false }).limit(20);
      setRecentBids(data || []);
    } catch (err) { console.error(err); toastError('فشل تسجيل المزايدة'); }
    finally { setSubmitting(false); }
  }

  const stats = useMemo(() => ({
    total: auctions.length,
    active: auctions.filter(a => a.status === 'active' && new Date(a.ends_at) > new Date()).length,
    ended: auctions.filter(a => a.status !== 'active' || new Date(a.ends_at) <= new Date()).length,
  }), [auctions]);

  const filtered = useMemo(() => {
    let list = auctions;
    if (filter === 'active') list = list.filter(a => a.status === 'active' && new Date(a.ends_at) > new Date());
    if (filter === 'ended') list = list.filter(a => a.status !== 'active' || new Date(a.ends_at) <= new Date());
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(a => (a.title || '').toLowerCase().includes(q) || (a.description || '').toLowerCase().includes(q));
    }
    return list;
  }, [auctions, filter, search, tick]);

  if (loading) return <div style={{ padding: 80, textAlign: 'center' }}>⏳</div>;

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', paddingBottom: 40 }}>
      <div style={{ background: 'linear-gradient(135deg, #0f4d3a, #075640)', padding: '20px', color: '#fff', borderBottomLeftRadius: 24, borderBottomRightRadius: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
          <button onClick={() => router.back()} style={{ color: '#fff', background: 'rgba(255,255,255,.15)', border: 'none', width: 40, height: 40, borderRadius: '50%', fontSize: 18, cursor: 'pointer' }}>←</button>
          <div style={{ flex: 1 }}>
            <h1 style={{ fontSize: 20, fontWeight: 900, margin: 0 }}>🏆 المزادات</h1>
            <div style={{ fontSize: 12, opacity: 0.8, marginTop: 2 }}>{stats.active} مزاد نشط</div>
          </div>
          <Link href="/merchant/auctions/new" style={{ background: '#fbbf24', color: '#0f4d3a', padding: '8px 14px', borderRadius: 10, fontSize: 12, fontWeight: 900, textDecoration: 'none' }}>+ مزاد</Link>
        </div>
        <input type="search" placeholder="🔍 ابحث في المزادات..." value={search} onChange={e => setSearch(e.target.value)} style={{ width: '100%', padding: '12px 16px', borderRadius: 12, border: 'none', fontSize: 14, outline: 'none', boxSizing: 'border-box', background: 'rgba(255,255,255,0.95)', fontFamily: 'inherit' }} />
      </div>

      <div style={{ padding: 16, maxWidth: 800, margin: '0 auto' }}>
        <div style={{ display: 'flex', gap: 6, marginBottom: 16, overflowX: 'auto', paddingBottom: 4 }}>
          <button onClick={() => setFilter('active')} style={chip(filter === 'active')}>🔥 النشطة ({stats.active})</button>
          <button onClick={() => setFilter('ended')} style={chip(filter === 'ended')}>⏰ المنتهية ({stats.ended})</button>
          <button onClick={() => setFilter('all')} style={chip(filter === 'all')}>الكل</button>
        </div>

        {filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 60, background: '#fff', borderRadius: 16, color: '#64748b' }}>
            <div style={{ fontSize: 60, marginBottom: 12 }}>🏆</div>
            <div style={{ fontSize: 15, fontWeight: 900 }}>{auctions.length === 0 ? 'لا توجد مزادات بعد' : 'لا نتائج'}</div>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
            {filtered.map(a => {
              const isEnded = a.status !== 'active' || new Date(a.ends_at) <= new Date();
              const timeLeft = getTimeLeft(a.ends_at);
              const currentPrice = Number(a.current_price || a.starting_price || 0);
              const startingPrice = Number(a.starting_price || 0);
              return (
                <div key={a.id} style={{ background: '#fff', borderRadius: 16, overflow: 'hidden', border: '1px solid #e2e8f0', opacity: isEnded ? 0.7 : 1, display: 'flex', flexDirection: 'column' }}>
                  <div style={{ position: 'relative' }}>
                    {a.image_url ? <img src={a.image_url} alt="" style={{ width: '100%', height: 160, objectFit: 'cover' }} /> : <div style={{ width: '100%', height: 160, background: 'linear-gradient(135deg, #fef3c7, #fde68a)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 60 }}>🏆</div>}
                    <div style={{ position: 'absolute', top: 8, right: 8, background: isEnded ? '#94a3b8' : (timeLeft.urgent ? '#ef4444' : '#10b981'), color: '#fff', padding: '4px 10px', borderRadius: 8, fontSize: 10, fontWeight: 900 }}>{isEnded ? '⏰ انتهى' : `⏱️ ${timeLeft.text}`}</div>
                  </div>
                  <div style={{ padding: 14, flex: 1, display: 'flex', flexDirection: 'column' }}>
                    <div style={{ fontSize: 14, fontWeight: 900, color: '#0f172a', marginBottom: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.title}</div>
                    <div style={{ fontSize: 11, color: '#64748b', marginBottom: 8 }}>🏪 {a.provider_name || '—'}</div>
                    {a.description && <div style={{ fontSize: 12, color: '#475569', lineHeight: 1.5, marginBottom: 10, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{a.description}</div>}
                    <div style={{ marginTop: 'auto' }}>
                      <div style={{ background: 'linear-gradient(135deg, #fef3c7, #fde68a)', borderRadius: 10, padding: 10, marginBottom: 10 }}>
                        <div style={{ fontSize: 10, color: '#92400e', fontWeight: 800, marginBottom: 2 }}>السعر الحالي</div>
                        <div style={{ fontSize: 20, fontWeight: 900, color: '#78350f' }}>{currentPrice.toLocaleString()} <span style={{ fontSize: 11 }}>ل.س</span></div>
                        {a.winner_name && <div style={{ fontSize: 10, color: '#92400e', marginTop: 4 }}>👤 {a.winner_name}</div>}
                      </div>
                      {!isEnded && (
                        <button onClick={() => openAuction(a)} style={{ width: '100%', padding: 12, background: 'linear-gradient(135deg, #f59e0b, #d97706)', color: '#fff', border: 'none', borderRadius: 10, fontSize: 13, fontWeight: 900, cursor: 'pointer', fontFamily: 'inherit' }}>🔨 شارك في المزاد</button>
                      )}
                      {isEnded && a.winner_name && (
                        <div style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: 10, padding: 10, textAlign: 'center' }}>
                          <div style={{ fontSize: 10, color: '#10b981', fontWeight: 900 }}>الفائز</div>
                          <div style={{ fontSize: 13, color: '#059669', fontWeight: 900, marginTop: 2 }}>{a.winner_name}</div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {selected && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 100, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
          <div style={{ background: '#fff', width: '100%', maxWidth: 500, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h2 style={{ fontSize: 18, fontWeight: 900, margin: 0 }}>🔨 مزايدة</h2>
              <button onClick={() => setSelected(null)} style={{ background: '#f1f5f9', border: 'none', width: 32, height: 32, borderRadius: '50%', fontSize: 16, cursor: 'pointer' }}>✕</button>
            </div>
            <div style={{ background: '#f8fafc', borderRadius: 12, padding: 14, marginBottom: 16 }}>
              <div style={{ fontSize: 14, fontWeight: 900, color: '#0f172a', marginBottom: 6 }}>{selected.title}</div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}><span style={{ color: '#64748b' }}>السعر الحالي:</span><strong style={{ color: '#f59e0b' }}>{Number(selected.current_price || selected.starting_price).toLocaleString()} ل.س</strong></div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}><span style={{ color: '#64748b' }}>الحد الأدنى للزيادة:</span><strong>{Number(selected.min_increment || 100).toLocaleString()} ل.س</strong></div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}><span style={{ color: '#64748b' }}>الوقت المتبقي:</span><strong style={{ color: getTimeLeft(selected.ends_at).urgent ? '#ef4444' : '#10b981' }}>{getTimeLeft(selected.ends_at).text}</strong></div>
            </div>

            {recentBids.length > 0 && (
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 12, fontWeight: 900, color: '#64748b', marginBottom: 8 }}>📋 آخر المزايدات</div>
                {recentBids.slice(0, 5).map((b, i) => (
                  <div key={b.id} style={{ display: 'flex', justifyContent: 'space-between', padding: 8, background: i === 0 ? 'rgba(16,185,129,0.08)' : '#f8fafc', borderRadius: 8, marginBottom: 4, fontSize: 12 }}>
                    <span style={{ color: '#475569' }}>{b.bidder_name}</span>
                    <strong style={{ color: i === 0 ? '#10b981' : '#64748b' }}>{Number(b.amount).toLocaleString()} ل.س</strong>
                  </div>
                ))}
              </div>
            )}

            {getTimeLeft(selected.ends_at).ended ? (
              <div style={{ background: 'rgba(148,163,184,0.15)', borderRadius: 10, padding: 14, textAlign: 'center', fontSize: 13, fontWeight: 900, color: '#64748b' }}>⏰ انتهى هذا المزاد</div>
            ) : (
              <form onSubmit={submitBid}>
                <div style={{ marginBottom: 12 }}><label style={labelStyle}>الاسم *</label><input value={bidForm.bidder_name} onChange={e => setBidForm({ ...bidForm, bidder_name: e.target.value })} required style={inputStyle} /></div>
                <div style={{ marginBottom: 12 }}><label style={labelStyle}>الهاتف *</label><input type="tel" value={bidForm.bidder_phone} onChange={e => setBidForm({ ...bidForm, bidder_phone: e.target.value })} required style={inputStyle} /></div>
                <div style={{ marginBottom: 16 }}><label style={labelStyle}>مبلغ المزايدة *</label><input type="number" value={bidForm.amount} onChange={e => setBidForm({ ...bidForm, amount: e.target.value })} required style={inputStyle} /></div>
                <button type="submit" disabled={submitting} style={{ width: '100%', padding: 14, background: submitting ? '#94a3b8' : 'linear-gradient(135deg, #f59e0b, #d97706)', color: '#fff', border: 'none', borderRadius: 10, fontWeight: 900, fontSize: 15, cursor: submitting ? 'wait' : 'pointer', fontFamily: 'inherit' }}>
                  {submitting ? '⏳ جارٍ التسجيل...' : '🔨 تقديم مزايدة'}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function chip(active) {
  return { background: active ? '#0f4d3a' : '#fff', color: active ? '#fff' : '#64748b', border: active ? '1px solid #0f4d3a' : '1px solid #e2e8f0', padding: '8px 14px', borderRadius: 20, fontSize: 12, fontWeight: 900, cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap' };
}

const labelStyle = { display: 'block', fontSize: 12, fontWeight: 800, color: '#475569', marginBottom: 6 };
const inputStyle = { width: '100%', padding: '12px 14px', borderRadius: 10, border: '1px solid #cbd5e1', fontSize: 14, fontFamily: 'inherit', boxSizing: 'border-box', outline: 'none', background: '#f8fafc' };
