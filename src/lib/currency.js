// ═══════════ Currency Rates ═══════════

const DEFAULT_RATES = {
  SYP: 1,
  USD: 15000,   // ليرة سورية للدولار
  TRY: 450,     // ليرة سورية لليرة تركية
  EUR: 16000,
  SAR: 4000,
  AED: 4100,
};

export function convert(amount, from, to, rates = DEFAULT_RATES) {
  const f = rates[from] || 1;
  const t = rates[to] || 1;
  return (Number(amount) * f) / t;
}

export function formatCurrency(amount, currency = 'SYP') {
  const sym = { SYP: 'ل.س', USD: '$', TRY: '₺', EUR: '€', SAR: 'ر.س', AED: 'د.إ' };
  return `${Number(amount).toLocaleString()} ${sym[currency] || currency}`;
}

export function getRates() {
  if (typeof window === 'undefined') return DEFAULT_RATES;
  try {
    const saved = JSON.parse(localStorage.getItem('sanad_rates') || 'null');
    return saved || DEFAULT_RATES;
  } catch { return DEFAULT_RATES; }
}

export function setRates(rates) {
  if (typeof window === 'undefined') return;
  try { localStorage.setItem('sanad_rates', JSON.stringify(rates)); } catch {}
  window.dispatchEvent(new Event('sanad-rates-change'));
}

export const DEFAULT_RATES_EXPORT = DEFAULT_RATES;
