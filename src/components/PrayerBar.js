'use client';

import { useState, useEffect, useRef } from 'react';
import { calculatePrayerTimes, getLocation, playAdhan, notifyPrayer, getNextPrayer } from '@/lib/prayer';

const PRAYER_LABELS = {
  fajr: 'الفجر',
  dhuhr: 'الظهر',
  asr: 'العصر',
  maghrib: 'المغرب',
  isha: 'العشاء',
};

export default function PrayerBar() {
  const [times, setTimes] = useState(null);
  const [next, setNext] = useState(null);
  const [loading, setLoading] = useState(true);
  const [adhanEnabled, setAdhanEnabled] = useState(true);
  const notifiedRef = useRef({});

  useEffect(() => {
    init();
    const timer = setInterval(init, 60 * 60 * 1000);
    return () => clearInterval(timer);
  }, []);

  async function init() {
    try {
      let loc = null;
      try {
        const saved = localStorage.getItem('sanad_location');
        if (saved) loc = JSON.parse(saved);
      } catch (e) {}

      if (!loc) {
        try {
          loc = await getLocation();
          localStorage.setItem('sanad_location', JSON.stringify(loc));
        } catch (e) {
          loc = { lat: 36.48522, lng: 35.65480 };
        }
      }

      const t = calculatePrayerTimes(loc.lat, loc.lng);
      setTimes(t);
      setNext(getNextPrayer(t));
      setLoading(false);

      try {
        const savedAdhan = localStorage.getItem('sanad_adhan_enabled');
        if (savedAdhan === 'false') setAdhanEnabled(false);
      } catch (e) {}
    } catch (e) {
      console.warn('prayer error:', e);
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!times) return;
    const timer = setInterval(() => {
      const now = new Date();
      const hh = String(now.getHours()).padStart(2, '0');
      const mm = String(now.getMinutes()).padStart(2, '0');
      const currentMinute = hh + ':' + mm;
      const today = now.toDateString();

      const prayers = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'];
      prayers.forEach(function (p) {
        if (times[p] === currentMinute) {
          const key = p + '_' + today;
          if (!notifiedRef.current[key]) {
            notifiedRef.current[key] = true;
            if (adhanEnabled) playAdhan();
            notifyPrayer(p);
          }
        }
      });
    }, 60 * 1000);
    return () => clearInterval(timer);
  }, [times, adhanEnabled]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if ('Notification' in window && Notification.permission === 'default') {
      setTimeout(function () { Notification.requestPermission(); }, 3000);
    }
  }, []);

  function toggleAdhan() {
    const newVal = !adhanEnabled;
    setAdhanEnabled(newVal);
    try { localStorage.setItem('sanad_adhan_enabled', String(newVal)); } catch (e) {}
  }

  if (loading) return null;
  if (!times) return null;

  return (
    <div style={{ display: 'flex', gap: 6, padding: '10px 12px', overflowX: 'auto', background: 'rgba(15,77,58,.05)', borderBottom: '1px solid rgba(15,77,58,.1)', alignItems: 'center' }}>
      {['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'].map(function (p) {
        const isNext = next && next.name === p;
        return (
          <div key={p} style={{ minWidth: 70, padding: '8px 10px', borderRadius: 12, background: isNext ? 'linear-gradient(135deg, #0f4d3a, #0a6b50)' : '#fff', color: isNext ? '#fff' : '#0f4d3a', textAlign: 'center', boxShadow: '0 2px 8px rgba(0,0,0,.06)' }}>
            <div style={{ fontSize: 10, opacity: .8, marginBottom: 4 }}>
              {PRAYER_LABELS[p]}
              {isNext ? ' •' : ''}
            </div>
            <div style={{ fontSize: 14, fontWeight: 900, direction: 'ltr' }}>
              {times[p]}
            </div>
          </div>
        );
      })}

      <button
        onClick={toggleAdhan}
        type="button"
        title={adhanEnabled ? 'إيقاف صوت الأذان' : 'تفعيل صوت الأذان'}
        style={{ minWidth: 40, height: 40, borderRadius: 12, background: adhanEnabled ? 'rgba(34,197,94,.15)' : 'rgba(255,255,255,.06)', border: adhanEnabled ? '1px solid rgba(34,197,94,.3)' : '1px solid rgba(255,255,255,.1)', fontSize: 18, cursor: 'pointer', flexShrink: 0 }}
      >
        {adhanEnabled ? '🔔' : '🔕'}
      </button>
    </div>
  );
}
