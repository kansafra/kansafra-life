'use client';
import { useState, useEffect } from 'react';

const CURRENCIES = {
  SYP: { name: 'ليرة سورية', symbol: 'ل.س', flag: '🇸🇾' },
  USD: { name: 'دولار أمريكي', symbol: '$', flag: '🇺🇸' },
  TRY: { name: 'ليرة تركية', symbol: '₺', flag: '🇹🇷' },
  EUR: { name: 'يورو', symbol: '€', flag: '🇪🇺' },
  SAR: { name: 'ريال سعودي', symbol: 'ر.س', flag: '🇸🇦' },
  AED: { name: 'درهم إماراتي', symbol: 'د.إ', flag: '🇦🇪' },
};

const DEFAULT_RATES = { SYP: 1, USD: 15000, TRY: 450, EUR: 16000, SAR: 4000, AED: 4100 };

export default function CurrencyCalculator({ rates, onResult }) {
  const [from, setFrom] = useState('USD');
  const [to, setTo] = useState('SYP');
  const [amount, setAmount] = useState('100');
  const [result, setResult] = useState(0);
  const [usedRates, setUsedRates] = useState(DEFAULT_RATES);
  const [updatedAt, setUpdatedAt] = useState(null);

  useEffect(() => {
    // احسب بأفضل سعر متاح من قائمة الأسعار
    if (rates && rates.length > 0) {
      const bestRates = { SYP: 1 };
      rates.forEach((r) => {
        if (r.currency === 'USD' && r.sell_price > 0) bestRates.USD = Number(r.sell_price);
        if (r.currency === 'TRY' && r.sell_price > 0) bestRates.TRY = Number(r.sell_price);
        if (r.currency === 'EUR' && r.sell_price > 0) bestRates.EUR = Number(r.sell_price);
        if (r.currency === 'SAR' && r.sell_price > 0) bestRates.SAR = Number(r.sell_price);
        if (r.currency === 'AED' && r.sell_price > 0) bestRates.AED = Number(r.sell_price);
      });
      setUsedRates({ ...DEFAULT_RATES, ...bestRates });
      setUpdatedAt(new Date());
    } else {
      try {
        const saved = JSON.parse(localStorage.getItem('sanad_rates') || 'null');
        if (saved) setUsedRates(saved);
      } catch {}
    }
  }, [rates]);

  useEffect(() => {
    const fromRate = usedRates[from] || 1;
    const toRate = usedRates[to] || 1;
    const res = (Number(amount) || 0) * fromRate / toRate;
    setResult(res);
    onResult?.(res);
  }, [from, to, amount, usedRates]);

  function swap() {
    setFrom(to);
    setTo(from);
  }

  return (
    <div className="calc-card">
      <div className="calc-row">
        <div className="calc-field">
          <label className="calc-label">من</label>
          <select className="calc-select" value={from} onChange={(e) => setFrom(e.target.value)}>
            {Object.entries(CURRENCIES).map(([k, v]) => (
              <option key={k} value={k}>{v.flag} {k}</option>
            ))}
          </select>
          <input
            className="calc-input"
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            inputMode="decimal"
          />
        </div>

        <button className="calc-swap" onClick={swap} type="button" aria-label="عكس">
          ⇄
        </button>

        <div className="calc-field">
          <label className="calc-label">إلى</label>
          <select className="calc-select" value={to} onChange={(e) => setTo(e.target.value)}>
            {Object.entries(CURRENCIES).map(([k, v]) => (
              <option key={k} value={k}>{v.flag} {k}</option>
            ))}
          </select>
          <input
            className="calc-input"
            type="text"
            value={Math.round(result).toLocaleString()}
            readOnly
          />
        </div>
      </div>

      <div className="calc-result">
        <div className="calc-result-label">النتيجة</div>
        <div className="calc-result-value">
          {Math.round(result).toLocaleString()} {CURRENCIES[to].symbol}
        </div>
        {updatedAt && (
          <div className="calc-updated">
            محدّث الآن — سعر {from}/SYP: {Math.round(usedRates[from] || 1).toLocaleString()}
          </div>
        )}
      </div>
    </div>
  );
}
