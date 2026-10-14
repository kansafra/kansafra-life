'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getRates, setRates, DEFAULT_RATES_EXPORT } from '@/lib/currency';

export default function CurrencyPage() {
  const router = useRouter();
  const [rates, setLocalRates] = useState(DEFAULT_RATES_EXPORT);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    let stored = null;
    try { stored = JSON.parse(localStorage.getItem('sanad_admin') || 'null'); } catch {}
    if (!stored) { router.replace('/admin/login'); return; }
    setLocalRates(getRates());
  }, [router]);

  function save() {
    setRates(rates);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  const SYMBOLS = { SYP: 'ل.س', USD: '$', TRY: '₺', EUR: '€', SAR: 'ر.س', AED: 'د.إ' };

  return (
    <div className="admin-page">
      <div className="admin-sub-header">
        <Link href="/admin" className="admin-sub-back">→</Link>
        <span className="admin-sub-title">💱 أسعار العملات</span>
      </div>

      <div style={{ padding: '14px 20px 0', fontSize: 12, color: 'rgba(255,255,255,.5)', fontWeight: 600, lineHeight: 1.6 }}>
        الأسعار مقابل 1 من العملة الأساسية (ليرة سورية)
      </div>

      <div style={{ padding: '20px' }}>
        {Object.entries(rates).map(([code, rate]) => (
          <div key={code} className="currency-row" style={{ background: 'rgba(255,255,255,.03)', border: '1px solid rgba(255,255,255,.06)' }}>
            <span className="currency-code" style={{ color: '#e8b923' }}>{code} {SYMBOLS[code]}</span>
            <input
              type="number"
              value={rate}
              onChange={(e) => setLocalRates({ ...rates, [code]: Number(e.target.value) })}
              style={{
                background: 'rgba(255,255,255,.06)',
                border: '1px solid rgba(255,255,255,.1)',
                borderRadius: 10,
                padding: '8px 12px',
                color: '#fff',
                fontFamily: 'monospace',
                fontWeight: 800,
                width: 140,
                textAlign: 'left',
                direction: 'ltr',
              }}
            />
          </div>
        ))}
      </div>

      <div style={{ padding: '0 20px 30px' }}>
        <button className="mng-btn primary" onClick={save} type="button" style={{ width: '100%', padding: 16 }}>
          {saved ? '✓ تم الحفظ' : '✓ حفظ الأسعار'}
        </button>
      </div>
    </div>
  );
}
