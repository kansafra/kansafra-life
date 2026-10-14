'use client';
import { useState, useEffect } from 'react';

const DEFAULT_PRAYERS = [
  { key: 'fajr', ar: 'الفجر', time: '05:30' },
  { key: 'dhuhr', ar: 'الظهر', time: '12:30' },
  { key: 'asr', ar: 'العصر', time: '15:45' },
  { key: 'maghrib', ar: 'المغرب', time: '18:15' },
  { key: 'isha', ar: 'العشاء', time: '19:45' },
];

function nextPrayer() {
  const now = new Date();
  const curMin = now.getHours() * 60 + now.getMinutes();
  for (const p of DEFAULT_PRAYERS) {
    const [h, m] = p.time.split(':').map(Number);
    if (h * 60 + m > curMin) return p.key;
  }
  return 'fajr';
}

export default function PrayerBar() {
  const [active, setActive] = useState('fajr');

  useEffect(() => {
    setActive(nextPrayer());
  }, []);

  return (
    <div className="prayer-bar">
      {DEFAULT_PRAYERS.map((p) => (
        <div key={p.key} className={`prayer-chip ${p.key === active ? 'active' : ''}`}>
          <div className="pname">{p.ar}</div>
          <div className="ptime">{p.time}</div>
        </div>
      ))}
    </div>
  );
}
