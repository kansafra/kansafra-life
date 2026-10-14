'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

const CURRENCIES = {
  USD: { name: 'دولار أمريكي', flag: '🇺🇸' },
  EUR: { name: 'يورو', flag: '🇪🇺' },
  TRY: { name: 'ليرة تركية', flag: '🇹🇷' },
  SAR: { name: 'ريال سعودي', flag: '🇸🇦' },
  AED: { name: 'درهم إماراتي', flag: '🇦🇪' },
  SYP: { name: 'ليرة سورية', flag: '🇸🇾' },
};

export default function ExchangePage() {
  const router = useRouter();
  const [rates, setRates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [offices, setOffices] = useState([]);
  const [selectedOffice, setSelectedOffice] = useState('all');
  const [tab, setTab] = useState('compare'); // compare | calculator
  const [calc, setCalc] = useState({ amount: 1, from: 'USD', to: 'SYP', office: '' });
  const [converted, setConverted] = useState(null);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    if (!supabase) { setLoading(false); return; }
    const { data } = await supabase
      .from('exchange_rates')
      .select('*')
      .eq('is_active', true)
      .order('office_name');
    const list = Array.isArray(data) ? data : [];
    setRates(list);
    setOffices([...new Set(list.map((r) => r.office_name))]);
    setLoading(false);
  }

  // مقارنة: تجميع حسب العملة
  const byCurrency = useMemo(() => {
    const groups = {};
    rates.forEach((r) => {
      if (selectedOffice !== 'all' && r.office_name !== selectedOffice) return;
      if (!groups[r.currency]) groups[r.currency] = [];
      groups[r.currency].push(r);
    });
    return groups;
  }, [rates, selectedOffice]);

  // حاسبة
  const computeConversion = () => {
    const amt = parseFloat(calc.amount) || 0;
    const sourceRates = rates.filter((r) => r.currency === calc.from);
    if (!sourceRates.length) { setConverted({ error: 'لا يوجد سعر للعملة المحددة' }); return; }

    let pickedRate;
    if (calc.office) {
      pickedRate = sourceRates.find((r) => r.office_name === calc.office);
    } else {
      // خد أرخص سعر بيع (أفضل للعميل)
      pickedRate = sourceRates.reduce((min, r) => (r.sell_price < min.sell_price ? r : min), sourceRates[0]);
    }
    if (!pickedRate) { setConverted({ error: 'لم يُوجد سعر' }); return; }

    const result = amt * pickedRate.sell_price;
    setConverted({
      result,
      office: pickedRate.office_name,
      rate: pickedRate.sell_price,
      from: calc.from,
      to: 'SYP',
      amount: amt,
    });
  };

  return (
    <div className="sect-page" style={{ paddingBottom: 40 }}>
      <div className="inv-header">
        <button className="inv-back" onClick={() => router.back()} type="button">→</button>
        <span className="inv-title">💱 الصرافة والحوالات</span>
        <span style={{ width: 40 }} />
      </div>

      {/* ═══ التابات ═══ */}
      <div className="chips-scroll" style={{ padding: '12px 16px' }}>
        <button className={`chip ${tab === 'compare' ? 'active' : ''}`} onClick={() => setTab('compare')} type="button">
          📊 مقارنة الأسعار
        </button>
        <button className={`chip ${tab === 'calculator' ? 'active' : ''}`} onClick={() => setTab('calculator')} type="button">
          🧮 الحاسبة
        </button>
      </div>

      {loading ? (
        <div className="sect-empty"><span className="em">⏳</span></div>
      ) : tab === 'compare' ? (
        <>
          {/* فلتر المكاتب */}
          <div className="chips-scroll" style={{ padding: '0 16px 12px' }}>
            <button
              className={`chip ${selectedOffice === 'all' ? 'active' : ''}`}
              onClick={() => setSelectedOffice('all')}
              type="button"
            >
              كل المكاتب
            </button>
            {offices.map((o) => (
              <button
                key={o}
                className={`chip ${selectedOffice === o ? 'active' : ''}`}
                onClick={() => setSelectedOffice(o)}
                type="button"
              >
                {o}
              </button>
            ))}
          </div>

          {Object.keys(byCurrency).length === 0 ? (
            <div className="sect-empty">
              <span className="em">💱</span>
              <p>لا توجد أسعار صرف متاحة حالياً</p>
            </div>
          ) : (
            <div style={{ padding: 16 }}>
              {Object.entries(byCurrency).map(([code, list]) => {
                const cur = CURRENCIES[code] || { name: code, flag: '💵' };
                return (
                  <div key={code} className="debt-card" style={{ borderRightColor: '#14b8a6', marginBottom: 12 }}>
                    <div className="debt-customer" style={{ fontSize: 16 }}>
                      {cur.flag} {cur.name}
                      <span style={{ fontSize: 11, color: 'var(--n-500)', fontWeight: 700, marginInlineStart: 8 }}>
                        ({code})
                      </span>
                    </div>

                    <div style={{ marginTop: 12 }}>
                      {list.map((r) => (
                        <div
                          key={r.id}
                          style={{
                            display: 'flex', alignItems: 'center', gap: 12,
                            padding: '8px 0', borderTop: '1px solid rgba(255,255,255,.06)'
                          }}
                        >
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--n-200)' }}>
                              🏢 {r.office_name}
                            </div>
                            <div style={{ fontSize: 10, color: 'var(--n-500)', marginTop: 2 }}>
                              {new Date(r.updated_at).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}
                            </div>
                          </div>
                          <div style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: 9, color: 'var(--n-500)', fontWeight: 700 }}>شراء</div>
                            <div style={{ fontSize: 13, fontWeight: 900, color: '#14b8a6', direction: 'ltr' }}>
                              {Number(r.buy_price || 0).toLocaleString()}
                            </div>
                          </div>
                          <div style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: 9, color: 'var(--n-500)', fontWeight: 700 }}>بيع</div>
                            <div style={{ fontSize: 13, fontWeight: 900, color: '#dc2626', direction: 'ltr' }}>
                              {Number(r.sell_price || 0).toLocaleString()}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      ) : (
        /* ═══ الحاسبة ═══ */
        <div style={{ padding: 16 }}>
          <div className="debt-card" style={{ borderRightColor: '#14b8a6', padding: 20 }}>
            <div className="new-service-field">
              <label className="new-service-label">المبلغ</label>
              <input
                className="new-service-input"
                type="number"
                step="any"
                value={calc.amount}
                onChange={(e) => setCalc({ ...calc, amount: e.target.value })}
                style={{ fontSize: 20, fontWeight: 900, textAlign: 'center' }}
              />
            </div>

            <div className="new-service-field">
              <label className="new-service-label">من عملة</label>
              <select className="new-service-select" value={calc.from} onChange={(e) => setCalc({ ...calc, from: e.target.value })}>
                {Object.entries(CURRENCIES).map(([code, c]) => (
                  <option key={code} value={code}>{c.flag} {c.name}</option>
                ))}
              </select>
            </div>

            <div className="new-service-field">
              <label className="new-service-label">من مكتب (اختياري)</label>
              <select className="new-service-select" value={calc.office} onChange={(e) => setCalc({ ...calc, office: e.target.value })}>
                <option value="">🏆 الأفضل سعراً (تلقائي)</option>
                {offices.map((o) => (<option key={o} value={o}>{o}</option>))}
              </select>
            </div>

            <button
              className="mng-btn primary"
              onClick={computeConversion}
              type="button"
              style={{ width: '100%', marginTop: 12, padding: 14, fontSize: 15 }}
            >
              🧮 احسب
            </button>
          </div>

          {converted && (
            <div
              className="debt-card"
              style={{
                borderRightColor: converted.error ? '#dc2626' : '#14b8a6',
                marginTop: 16, background: converted.error ? 'rgba(220,38,38,.08)' : 'rgba(20,184,166,.08)'
              }}
            >
              {converted.error ? (
                <div style={{ color: '#dc2626', fontWeight: 800, textAlign: 'center', padding: 20 }}>
                  ⚠️ {converted.error}
                </div>
              ) : (
                <div style={{ padding: 20, textAlign: 'center' }}>
                  <div style={{ fontSize: 12, color: 'var(--n-500)', fontWeight: 700 }}>النتيجة</div>
                  <div style={{ fontSize: 32, fontWeight: 900, color: '#14b8a6', direction: 'ltr', margin: '8px 0' }}>
                    {Number(converted.result).toLocaleString()}
                  </div>
                  <div style={{ fontSize: 14, color: 'var(--n-300)', fontWeight: 800 }}>
                    ليرة سورية
                  </div>
                  <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px dashed rgba(255,255,255,.1)', fontSize: 11, color: 'var(--n-500)' }}>
                    <div>🏢 {converted.office}</div>
                    <div style={{ marginTop: 4 }}>
                      سعر الصرف: <span style={{ direction: 'ltr', display: 'inline-block', fontWeight: 900 }}>
                        1 {converted.from} = {converted.rate} SYP
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
