'use client';


import { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

function countdown(ends) {
  if (!ends) return '—';
  const d = new Date(ends).getTime() - Date.now();
  if (d <= 0) return 'منتهي';
  const days = Math.floor(d / 86400000);
  const h = Math.floor((d % 86400000) / 3600000);
  const m = Math.floor((d % 3600000) / 60000);
  if (days > 0) return `${days}ي ${h}س`;
  return `${h}:${String(m).padStart(2,'0')}`;
}

export default function AuctionsPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('active');

  useEffect(() => { load(); }, []);

  async function load() {
    if (!supabase) { setLoading(false); return; }
    const { data } = await supabase.from('auctions').select('*').order('created_at', { ascending: false });
    setItems(Array.isArray(data) ? data : []);
    setLoading(false);
  }

  async function bid(item) {
    const amount = prompt(`السعر الحالي: ${item.current_price || item.starting_price}\n\nأدخل مزايدتك:`);
    if (!amount || isNaN(Number(amount))) return;
    const name = prompt('اسمك:');
    if (!name) return;
    const phone = prompt('رقم هاتفك:');
    if (!phone) return;
    const newPrice = Number(amount);
    const curPrice = Number(item.current_price || item.starting_price || 0);
    if (newPrice <= curPrice) { alert('يجب أن تكون المزايدة أعلى من السعر الحالي'); return; }
    await supabase.from('auctions_bids').insert({
      auction_id: item.id,
      bidder_name: name,
      bidder_phone: phone,
      amount: newPrice,
    });
    await supabase.from('auctions').update({ current_price: newPrice }).eq('id', item.id);
    alert('✅ تم تسجيل مزايدتك');
    load();
  }

  const filtered = items.filter((x) => tab === 'active' ? x.status === 'active' : x.status === 'ended');

  return (
    <div className="ent-page">
      <div className="inv-header">
        <Link href="/" className="inv-back">→</Link>
        <span className="inv-title">🏆 المزادات</span>
        <span className="mng-count">{items.length}</span>
      </div>

      <div className="store-cat-scroll" style={{ paddingTop: 14 }}>
        <button className={`store-cat-chip ${tab === 'active' ? 'active' : ''}`} onClick={() => setTab('active')} type="button">🔥 نشطة</button>
        <button className={`store-cat-chip ${tab === 'ended' ? 'active' : ''}`} onClick={() => setTab('ended')} type="button">⏱️ منتهية</button>
      </div>

      {loading ? (
        <div className="sect-empty"><span className="em">⏳</span></div>
      ) : filtered.length === 0 ? (
        <div className="sect-empty"><span className="em">🏆</span><p>لا توجد مزادات</p></div>
      ) : (
        <div className="auc-grid">
          {filtered.map((a) => (
            <div key={a.id} className="auc-card">
              <div className="auc-img">
                {a.image_url ? <img src={a.image_url} alt="" /> : '🏆'}
                {a.status === 'active' && <span className="auc-timer">⏱ {countdown(a.ends_at)}</span>}
              </div>
              <div className="auc-body">
                <div className="auc-title">{a.title}</div>
                <div className="auc-price-row">
                  <span className="auc-price">{Number(a.current_price || a.starting_price || 0).toLocaleString()}</span>
                  <span style={{ fontSize: 10, color: 'var(--n-500)', fontWeight: 700 }}>{a.currency || 'SYP'}</span>
                </div>
                {a.current_price && a.starting_price && a.current_price > a.starting_price && (
                  <div style={{ fontSize: 10.5, color: 'var(--n-400)', fontWeight: 700, marginTop: 4 }}>
                    بداية: {Number(a.starting_price).toLocaleString()}
                  </div>
                )}
                {a.status === 'active' && (
                  <button className="auc-bid" onClick={() => bid(a)} type="button">💰 زايد الآن</button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
