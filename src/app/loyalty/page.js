'use client';

// Safe date for hydration
const __safeDate = (d) => (typeof window !== 'undefined' ? __safeDate(d) : __safeDate(0));

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

const TIERS = [
  { key: 'bronze', label: 'برونزي', min: 0, max: 500, icon: '🥉' },
  { key: 'silver', label: 'فضي', min: 500, max: 2000, icon: '🥈' },
  { key: 'gold', label: 'ذهبي', min: 2000, max: 5000, icon: '🥇' },
  { key: 'platinum', label: 'بلاتيني', min: 5000, max: 100000, icon: '💎' },
];

export default function LoyaltyPage() {
  const [phone, setPhone] = useState('');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('sanad_loyalty_phone');
    if (saved) { setPhone(saved); lookup(saved); }
  }, []);

  async function lookup(p) {
    if (!p || !supabase) return;
    setLoading(true);
    const { data: d } = await supabase.from('loyalty_points').select('*').eq('user_phone', p).maybeSingle();
    setData(d || { user_phone: p, points: 0, tier: 'bronze', total_spent: 0, history: [] });
    setLoading(false);
  }

  function submit(e) {
    e.preventDefault();
    localStorage.setItem('sanad_loyalty_phone', phone);
    lookup(phone);
  }

  const points = Number(data?.points) || 0;
  const currentTier = TIERS.slice().reverse().find((t) => points >= t.min) || TIERS[0];
  const nextTier = TIERS.find((t) => t.min > points);
  const progress = nextTier
    ? ((points - currentTier.min) / (nextTier.min - currentTier.min)) * 100
    : 100;

  return (
    <div className="ent-page">
      <div className="inv-header">
        <Link href="/" className="inv-back">→</Link>
        <span className="inv-title">🎁 نقاط الولاء</span>
      </div>

      <div className="loyalty-hero">
        <div className="loyalty-icon">🎁</div>
        <div className="loyalty-points">{points.toLocaleString()}</div>
        <div className="loyalty-label">نقطة ولاء</div>
        <div className={`loyalty-tier ${currentTier.key}`}>
          {currentTier.icon} مستوى {currentTier.label}
        </div>
      </div>

      <form onSubmit={submit} style={{ padding: '20px' }}>
        <div className="search-box">
          <span className="ico">📱</span>
          <input type="tel" placeholder="أدخل رقم هاتفك لعرض نقاطك" value={phone} onChange={(e) => setPhone(e.target.value)} />
          <button className="submit" type="submit">عرض</button>
        </div>
      </form>

      {loading ? (
        <div className="sect-empty"><span className="em">⏳</span></div>
      ) : data && (
        <>
          <div className="loyalty-progress">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 13, fontWeight: 900, color: 'var(--n-900)' }}>المستوى التالي</span>
              <span style={{ fontSize: 13, fontWeight: 900, color: 'var(--g-600)' }}>
                {nextTier ? `${nextTier.icon} ${nextTier.label}` : '🎉 أقصى مستوى!'}
              </span>
            </div>
            <div className="loyalty-bar">
              <div className="loyalty-fill" style={{ width: `${Math.min(progress, 100)}%` }} />
            </div>
            {nextTier && (
              <div style={{ fontSize: 11.5, color: 'var(--n-500)', fontWeight: 600, textAlign: 'center' }}>
                متبقي {nextTier.min - points} نقطة للمستوى التالي
              </div>
            )}
          </div>

          <div className="loyalty-progress">
            <div style={{ fontSize: 14, fontWeight: 900, color: 'var(--n-900)', marginBottom: 12 }}>💰 إجمالي الشراء</div>
            <div style={{ fontSize: 26, fontWeight: 900, color: 'var(--f-700)', direction: 'ltr', textAlign: 'right' }}>
              {Number(data.total_spent || 0).toLocaleString()} <span style={{ fontSize: 14 }}>ل.س</span>
            </div>
          </div>

          <div className="loyalty-progress">
            <div style={{ fontSize: 14, fontWeight: 900, color: 'var(--n-900)', marginBottom: 12 }}>📋 كيف تكسب النقاط؟</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[
                { icon: '🛍️', text: 'كل عملية شراء = 1 نقطة لكل 1000 ل.س' },
                { icon: '⭐', text: 'تقييم المنتجات = +20 نقطة' },
                { icon: '👥', text: 'دعوة صديق = +100 نقطة' },
                { icon: '🎁', text: 'استبدل النقاط بخصومات وكوبونات' },
              ].map((x, i) => (
                <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'center', padding: 10, background: 'var(--c-50)', borderRadius: 10 }}>
                  <span style={{ fontSize: 20 }}>{x.icon}</span>
                  <span style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--n-700)', lineHeight: 1.5 }}>{x.text}</span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
