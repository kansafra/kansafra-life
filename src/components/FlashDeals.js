'use client';
import { useState, useEffect } from 'react';

function countdown(endTs) {
  const diff = Math.max(0, endTs - Date.now());
  const h = Math.floor(diff / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  const s = Math.floor((diff % 60000) / 1000);
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export default function FlashDeals({ deals = [] }) {
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  if (!deals.length) return null;

  return (
    <section style={{ padding: '0 16px 16px', maxWidth: 640, margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <h3 style={{ fontSize: 17, fontWeight: 900, color: 'var(--n-900)', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
          ⚡ <span>عروض سريعة</span>
        </h3>
        <span style={{ fontSize: 11, fontWeight: 800, color: '#dc2626', background: 'rgba(220,38,38,.1)', padding: '4px 10px', borderRadius: 999 }}>
          ينتهي قريباً
        </span>
      </div>
      <div style={{ display: 'flex', gap: 12, overflowX: 'auto', paddingBottom: 8, scrollbarWidth: 'none' }}>
        {deals.map((d, i) => (
          <a
            key={d.id || i}
            href={`/service/${d.id}`}
            className="flash-deal"
            style={{ textDecoration: 'none' }}
          >
            <span className="flash-timer">
              ⏱ {countdown(now + 3600000 * (i + 2))}
            </span>
            <div className="flash-title">{d.title}</div>
            <div className="flash-price">
              {Number(d.price || 0).toLocaleString()} <small style={{ fontSize: 10 }}>{d.currency || 'ل.س'}</small>
            </div>
          </a>
        ))}
      </div>
    </section>
  );
}
