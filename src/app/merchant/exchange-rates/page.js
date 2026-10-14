'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

const CURRENCIES = ['USD', 'TRY', 'EUR', 'SAR', 'AED'];

export default function ExchangeRatesAdmin() {
  const router = useRouter();
  const [entity, setEntity] = useState(null);
  const [rates, setRates] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    let stored = null;
    try { stored = JSON.parse(localStorage.getItem('sanad_entity') || 'null'); } catch {}
    if (!stored) { router.replace('/login'); return; }
    setEntity(stored);
    load(stored);
  }, [router]);

  async function load(ent) {
    if (!supabase) return;
    const { data } = await supabase
      .from('exchange_rates')
      .select('*')
      .eq('office_name', ent.display_name);
    const map = {};
    (data || []).forEach((r) => {
      map[r.currency] = { buy: r.buy_price, sell: r.sell_price, id: r.id };
    });
    // ضمان وجود كل العملات
    CURRENCIES.forEach((c) => {
      if (!map[c]) map[c] = { buy: 0, sell: 0, id: null };
    });
    setRates(map);
    setLoading(false);
  }

  function update(code, field, value) {
    setRates((old) => ({
      ...old,
      [code]: { ...old[code], [field]: Number(value) || 0 },
    }));
  }

  async function save() {
    if (!entity) return;
    setSaving(true);
    for (const cur of CURRENCIES) {
      const r = rates[cur];
      if (!r || (r.buy === 0 && r.sell === 0)) continue;
      const payload = {
        office_name: entity.display_name,
        currency: cur,
        buy_price: r.buy,
        sell_price: r.sell,
        is_active: true,
        updated_at: new Date().toISOString(),
      };
      if (r.id) {
        await supabase.from('exchange_rates').update(payload).eq('id', r.id);
      } else {
        await supabase.from('exchange_rates').insert(payload);
      }
    }
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
    load(entity);
  }

  if (!entity) return <div className="sect-empty" style={{ padding: 80 }}><span className="em">⏳</span></div>;

  return (
    <div className="mng-page">
      <div className="mng-header">
        <Link href="/merchant" className="mng-back">→</Link>
        <span className="mng-title">💱 أسعار الصرف</span>
        <span className="mng-count" style={{ fontSize: 10 }}>{entity.display_name}</span>
      </div>

      <div style={{ padding: '14px 20px 0', fontSize: 12.5, color: 'var(--n-600)', fontWeight: 600, lineHeight: 1.7 }}>
        حدّث أسعار <strong>الشراء</strong> (ما تشتري به من الزبون) و<strong>المبيع</strong> (ما تبيع به للزبون).
        <br />الأسعار مقابل 1 من العملة الأجنبية = كم ليرة سورية.
      </div>

      {loading ? (
        <div className="sect-empty"><span className="em">⏳</span></div>
      ) : (
        <div style={{ padding: 20 }}>
          {CURRENCIES.map((cur) => (
            <div key={cur} className="office-card" style={{ margin: '0 0 12px' }}>
              <div className="office-head" style={{ marginBottom: 10, paddingBottom: 10 }}>
                <div className="office-name" style={{ fontSize: 16 }}>{cur}</div>
                <div style={{ fontSize: 11, color: 'var(--n-400)', fontWeight: 700 }}>ل.س / {cur}</div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div className="new-service-field">
                  <label className="new-service-label" style={{ color: '#16a34a' }}>شراء (Buy)</label>
                  <input
                    className="new-service-input"
                    type="number"
                    inputMode="decimal"
                    value={rates[cur]?.buy || ''}
                    onChange={(e) => update(cur, 'buy', e.target.value)}
                    placeholder="0"
                    style={{ direction: 'ltr', textAlign: 'center', fontSize: 16, fontWeight: 900 }}
                  />
                </div>
                <div className="new-service-field">
                  <label className="new-service-label" style={{ color: '#dc2626' }}>مبيع (Sell)</label>
                  <input
                    className="new-service-input"
                    type="number"
                    inputMode="decimal"
                    value={rates[cur]?.sell || ''}
                    onChange={(e) => update(cur, 'sell', e.target.value)}
                    placeholder="0"
                    style={{ direction: 'ltr', textAlign: 'center', fontSize: 16, fontWeight: 900 }}
                  />
                </div>
              </div>
            </div>
          ))}

          <button
            onClick={save}
            disabled={saving}
            type="button"
            className="new-service-submit"
            style={{ width: '100%', marginTop: 8 }}
          >
            {saving ? '... جارٍ الحفظ' : saved ? '✓ تم الحفظ' : '✓ حفظ الأسعار'}
          </button>
        </div>
      )}
    </div>
  );
}
