'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { SkeletonList } from '@/components/Skeleton';
import EmptyState from '@/components/EmptyState';

export default function ExchangePage() {
  const [rates, setRates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [amount, setAmount] = useState(100);
  const [fromCurrency, setFromCurrency] = useState('USD');
  const [toCurrency, setToCurrency] = useState('SYP');

  useEffect(() => { load(); }, []);

  async function load() {
    if (!supabase) { setLoading(false); return; }
    try {
      const { data } = await supabase.from('currency_rates').select('*').eq('is_active', true).order('code');
      setRates(data || []);
    } catch (e) { console.error(e); }
    setLoading(false);
  }

  function getRate(code, field = 'sell_price') {
    const r = rates.find(x => x.code === code);
    return r ? Number(r[field]) || 0 : 0;
  }

  function convert() {
    if (fromCurrency === toCurrency) return Number(amount);
    const fromRate = getRate(fromCurrency);
    const toRate = getRate(toCurrency);
    if (!fromRate || !toRate) return 0;
    // تحويل بسيط عبر SYP
    return (Number(amount) * fromRate) / toRate;
  }

  const converted = convert();
  const currencies = rates.length > 0 ? rates : [{ code: 'SYP', name_ar: 'ليرة سورية' }, { code: 'USD', name_ar: 'دولار' }];

  if (loading) return <div style={{ padding: 16, background: '#f8fafc', minHeight: '100vh' }}><SkeletonList count={3} /></div>;

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', paddingBottom: 80 }}>
      <div style={{ background: 'linear-gradient(135deg,#ca8a04,#854d0e)', padding: '20px 16px', color: '#fff' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Link href="/" style={{ color: '#fff', textDecoration: 'none', fontSize: 20, width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,.15)', borderRadius: '50%' }}>→</Link>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 20, fontWeight: 900 }}>💱 الصرافة والحوالات</div>
            <div style={{ fontSize: 12, opacity: 0.85, marginTop: 2 }}>أسعار العملات اليوم</div>
          </div>
          <div style={{ fontSize: 40 }}>💱</div>
        </div>
      </div>

      {/* Calculator */}
      <div style={{ padding: 16 }}>
        <div style={{ background: '#fff', borderRadius: 16, padding: 16, border: '1px solid #e5e7eb', marginBottom: 16 }}>
          <div style={{ fontSize: 14, fontWeight: 900, marginBottom: 12 }}>🧮 حاسبة التحويل</div>
          <div style={{ marginBottom: 10 }}>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 800, color: '#334155', marginBottom: 4 }}>المبلغ</label>
            <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} style={{ width: '100%', padding: 12, border: '1px solid #e5e7eb', borderRadius: 10, fontSize: 16, fontFamily: 'inherit', boxSizing: 'border-box', outline: 'none', fontWeight: 900 }} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: 8, alignItems: 'center', marginBottom: 12 }}>
            <select value={fromCurrency} onChange={(e) => setFromCurrency(e.target.value)} style={{ padding: 12, border: '1px solid #e5e7eb', borderRadius: 10, fontSize: 13, fontFamily: 'inherit', boxSizing: 'border-box', outline: 'none', fontWeight: 800 }}>
              {currencies.map(c => <option key={c.code} value={c.code}>{c.code} - {c.name_ar}</option>)}
            </select>
            <div style={{ fontSize: 20 }}>→</div>
            <select value={toCurrency} onChange={(e) => setToCurrency(e.target.value)} style={{ padding: 12, border: '1px solid #e5e7eb', borderRadius: 10, fontSize: 13, fontFamily: 'inherit', boxSizing: 'border-box', outline: 'none', fontWeight: 800 }}>
              {currencies.map(c => <option key={c.code} value={c.code}>{c.code} - {c.name_ar}</option>)}
            </select>
          </div>
          <div style={{ background: 'linear-gradient(135deg,#fef3c7,#fde68a)', borderRadius: 10, padding: 16, textAlign: 'center' }}>
            <div style={{ fontSize: 11, color: '#92400e', fontWeight: 700, marginBottom: 4 }}>النتيجة</div>
            <div style={{ fontSize: 24, fontWeight: 900, color: '#ca8a04', direction: 'ltr' }}>
              {converted.toLocaleString('en-US', { maximumFractionDigits: 2 })} <span style={{ fontSize: 14, color: '#92400e' }}>{toCurrency}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Rates Table */}
      <div style={{ padding: '0 16px' }}>
        <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #e5e7eb', overflow: 'hidden' }}>
          <div style={{ padding: 14, borderBottom: '1px solid #e5e7eb', background: '#f8fafc' }}>
            <div style={{ fontSize: 14, fontWeight: 900 }}>📊 أسعار الصرف الحالية</div>
          </div>
          {rates.length === 0 ? (
            <EmptyState icon="💱" title="لا توجد أسعار" description="سيتم تحديث الأسعار قريباً" />
          ) : (
            <div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', padding: 12, fontSize: 11, fontWeight: 900, color: '#64748b', background: '#f8fafc', borderBottom: '1px solid #e5e7eb' }}>
                <span>العملة</span>
                <span style={{ textAlign: 'center' }}>شراء</span>
                <span style={{ textAlign: 'left' }}>بيع</span>
              </div>
              {rates.map(r => (
                <div key={r.id} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', padding: 14, borderBottom: '1px solid #f1f5f9', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 900, color: '#0f4d3a', direction: 'ltr', textAlign: 'right' }}>{r.code}</div>
                    <div style={{ fontSize: 10.5, color: '#64748b' }}>{r.name_ar}</div>
                  </div>
                  <div style={{ textAlign: 'center', fontSize: 13, fontWeight: 900, color: '#10b981' }}>{Number(r.buy_price || 0).toLocaleString()}</div>
                  <div style={{ textAlign: 'left', fontSize: 13, fontWeight: 900, color: '#ef4444' }}>{Number(r.sell_price || 0).toLocaleString()}</div>
                </div>
              ))}
            </div>
          )}
        </div>
        <div style={{ marginTop: 12, padding: 12, background: 'rgba(251,191,36,.1)', border: '1px solid rgba(251,191,36,.3)', borderRadius: 10, fontSize: 11, color: '#92400e', fontWeight: 700, lineHeight: 1.7, textAlign: 'center' }}>
          ⚠️ الأسعار تقريبية وقد تتغير. تحقق من مكتب الصرافة قبل التحويل.
        </div>
      </div>
    </div>
  );
}
