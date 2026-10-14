'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import CurrencyCalculator from '@/components/CurrencyCalculator';

const CURRENCIES = {
  USD: { flag: '🇺🇸', name: 'دولار' },
  TRY: { flag: '🇹🇷', name: 'ليرة تركية' },
  EUR: { flag: '🇪🇺', name: 'يورو' },
  SAR: { flag: '🇸🇦', name: 'ريال' },
  AED: { flag: '🇦🇪', name: 'درهم' },
};

export default function ExchangePage() {
  const [rates, setRates] = useState([]);
  const [offices, setOffices] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => { load(); }, []);

  async function load() {
    if (!supabase) { setLoading(false); return; }
    const { data } = await supabase
      .from('exchange_rates')
      .select('*')
      .eq('is_active', true)
      .order('updated_at', { ascending: false });
    const list = Array.isArray(data) ? data : [];
    setRates(list);

    // تجميع حسب المكتب
    const map = {};
    list.forEach((r) => {
      if (!map[r.office_name]) map[r.office_name] = { rates: [], updated: r.updated_at };
      map[r.office_name].rates.push(r);
    });
    setOffices(map);
    setLoading(false);
  }

  function timeAgo(ts) {
    const diff = Date.now() - new Date(ts).getTime();
    if (diff < 60000) return 'الآن';
    if (diff < 3600000) return `قبل ${Math.floor(diff / 60000)} دقيقة`;
    if (diff < 86400000) return `قبل ${Math.floor(diff / 3600000)} ساعة`;
    return new Date(ts).toLocaleDateString('ar-EG');
  }

  return (
    <div className="exch-page">
      <header className="exch-hero">
        <div className="exch-hero-inner">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
            <Link href="/" style={{ color: '#fff', fontSize: 22, textDecoration: 'none' }}>→</Link>
            <span style={{ letterSpacing: 3, fontSize: 11, fontWeight: 800, opacity: .7 }}>EXCHANGE</span>
          </div>
          <h1 className="exch-title">💱 الصرافة والحوالات</h1>
          <p className="exch-sub">أسعار حية من مكاتب الصرافة</p>
        </div>
      </header>

      <CurrencyCalculator rates={rates} />

      {loading ? (
        <div className="sect-empty" style={{ padding: 40 }}>
          <span className="em">⏳</span>
          <p>جارٍ التحميل...</p>
        </div>
      ) : Object.keys(offices).length === 0 ? (
        <div className="sect-empty" style={{ padding: 40 }}>
          <span className="em">💱</span>
          <p>لا توجد أسعار محدّثة</p>
          <p style={{ fontSize: 12, marginTop: 8, color: 'var(--n-400)' }}>
            ستظهر أسعار مكاتب الصرافة هنا
          </p>
        </div>
      ) : (
        Object.entries(offices).map(([name, data]) => (
          <div key={name} className="office-card">
            <div className="office-head">
              <div className="office-name">🏦 {name}</div>
              <div className="office-time">⏱ {timeAgo(data.updated)}</div>
            </div>
            {data.rates.map((r) => (
              <div key={r.id} className="rate-row">
                <span className="rate-cur">
                  {CURRENCIES[r.currency]?.flag} {r.currency}
                </span>
                <span className="rate-cell rate-buy">
                  <span className="rate-lbl">شراء</span>
                  {Number(r.buy_price).toLocaleString()}
                </span>
                <span className="rate-cell rate-sell">
                  <span className="rate-lbl">مبيع</span>
                  {Number(r.sell_price).toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        ))
      )}
    </div>
  );
}
