'use client';
import { useState, useEffect } from 'react';

const HIJRI_MONTHS = [
  'مُحَرَّم', 'صَفَر', 'رَبيع الأول', 'رَبيع الآخر',
  'جُمادى الأولى', 'جُمادى الآخِرة', 'رَجَب', 'شَعْبان',
  'رَمَضان', 'شَوّال', 'ذو القَعْدة', 'ذو الحِجّة'
];

const DAYS_SHORT = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
const GREG_MONTHS_SHORT = ['يناير','فبراير','مارس','أبريل','مايو','يونيو','يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر'];

function toHijri(date) {
  try {
    const fmt = new Intl.DateTimeFormat('ar-SA-u-ca-islamic-umalqura-nu-latn', {
      day: 'numeric', month: 'numeric', year: 'numeric'
    });
    const parts = fmt.formatToParts(date);
    const get = (t) => parts.find(p => p.type === t)?.value;
    return {
      day: parseInt(get('day'), 10),
      month: parseInt(get('month'), 10),
      year: parseInt(get('year'), 10)
    };
  } catch {
    const d = new Date(date);
    const jd = Math.floor(d.getTime() / 86400000 + 2440587.5);
    const l = jd - 1948440 + 10632;
    const n = Math.floor((l - 1) / 10631);
    const l2 = l - 10631 * n + 354;
    const j = Math.floor((10985 - l2) / 5316) * Math.floor((50 * l2) / 17719)
            + Math.floor(l2 / 5670) * Math.floor((43 * l2) / 15238);
    const l3 = l2 - Math.floor((30 - j) / 15) * Math.floor((17719 * j) / 50)
             - Math.floor(j / 16) * Math.floor((15238 * j) / 43) + 29;
    const month = Math.floor((24 * l3) / 709);
    const day = l3 - Math.floor((709 * month) / 24);
    const year = 30 * n + j - 30;
    return { day, month, year };
  }
}

export default function HijriDate({ compact = false, style = {} }) {
  const [now, setNow] = useState(null);

  useEffect(() => {
    setNow(new Date());
    const t = setInterval(() => setNow(new Date()), 3600000);
    return () => clearInterval(t);
  }, []);

  if (!now) return null;

  const h = toHijri(now);
  const dayName = DAYS_SHORT[now.getDay()];
  const hijriMonth = HIJRI_MONTHS[h.month - 1] || '';
  const gregMonth = GREG_MONTHS_SHORT[now.getMonth()];

  // ============ COMPACT ============
  if (compact) {
    return (
      <span style={{
        display: 'inline-flex', gap: 5, alignItems: 'center',
        fontSize: 10.5, fontWeight: 800, color: 'var(--ink-600)',
        whiteSpace: 'nowrap', ...style
      }}>
        <span>{dayName}</span>
        <span style={{ opacity: .35 }}>·</span>
        <span>{h.day} {hijriMonth} {h.year}هـ</span>
      </span>
    );
  }

  // ============ FULL — pill أنيق inline ============
  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 10,
        padding: '8px 16px',
        background: 'rgba(255,255,255,.10)',
        backdropFilter: 'blur(14px)',
        WebkitBackdropFilter: 'blur(14px)',
        borderRadius: 999,
        border: '1px solid rgba(255,255,255,.20)',
        boxShadow: '0 2px 12px rgba(0,0,0,.12), inset 0 1px 0 rgba(255,255,255,.10)',
        color: '#fff',
        fontSize: 12.5,
        fontWeight: 700,
        margin: '0 auto',
        whiteSpace: 'nowrap',
        direction: 'rtl',
        ...style,
      }}
    >
      {/* اليوم */}
      <span style={{ opacity: .8, fontSize: 11.5 }}>{dayName}</span>

      {/* فاصل */}
      <span style={{
        width: 1, height: 14,
        background: 'rgba(255,255,255,.25)',
        display: 'inline-block',
      }} />

      {/* الهجري */}
      <span style={{ display: 'inline-flex', alignItems: 'baseline', gap: 3 }}>
        <span style={{
          color: '#fbbf24', fontWeight: 900, fontSize: 14,
          fontVariantNumeric: 'tabular-nums'
        }}>{h.day}</span>
        <span style={{ opacity: .95 }}>{hijriMonth}</span>
        <span style={{
          color: '#fbbf24', fontWeight: 900, fontSize: 12.5
        }}>{h.year}هـ</span>
      </span>

      {/* فاصل */}
      <span style={{
        width: 1, height: 14,
        background: 'rgba(255,255,255,.25)',
        display: 'inline-block',
      }} />

      {/* الميلادي */}
      <span style={{ opacity: .7, fontSize: 11.5, fontVariantNumeric: 'tabular-nums' }}>
        {now.getDate()} {gregMonth}
      </span>
    </div>
  );
}
