'use client';

// Safe date for hydration
const __safeDate = (d) => (typeof window !== 'undefined' ? __safeDate(d) : __safeDate(0));

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

export default function OnCallPage() {
  const [shifts, setShifts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      if (!supabase) { setLoading(false); return; }
      const today = __safeDate().toISOString().slice(0, 10);
      const { data } = await supabase
        .from('oncall_shifts')
        .select('*')
        .gte('shift_date', today)
        .order('shift_date', { ascending: true })
        .limit(30);
      setShifts(Array.isArray(data) ? data : []);
      setLoading(false);
    }
    load();
  }, []);

  return (
    <div className="doc-page">
      <header className="doc-hero" style={{ background: 'linear-gradient(160deg, #ec4899 0%, #db2777 60%, #be185d 100%)' }}>
        <div className="doc-hero-inner">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
            <Link href="/" style={{ color: '#fff', fontSize: 22, textDecoration: 'none' }}>→</Link>
            <span style={{ letterSpacing: 3, fontSize: 11, fontWeight: 800, opacity: .7 }}>PHARMACY</span>
          </div>
          <h1 className="doc-title">مناوبات الصيدليات</h1>
          <p className="doc-sub">تعرف على الصيدلية المناوبة اليوم</p>
        </div>
      </header>

      {loading ? (
        <div className="trans-empty"><span className="em">⏳</span><p>جارٍ التحميل...</p></div>
      ) : shifts.length === 0 ? (
        <div className="trans-empty">
          <span className="em">💊</span>
          <p>لا توجد مناوبات مسجلة</p>
        </div>
      ) : (
        <div className="pharm-oncall-list">
          {shifts.map((s) => (
            <div key={s.id} className={`pharm-oncall-card ${s.is_night ? 'night' : ''}`}>
              <div className={`pharm-oncall-icon ${s.is_night ? 'night' : ''}`}>
                {s.is_night ? '🌙' : '☀️'}
              </div>
              <div className="pharm-oncall-info">
                <div className="pharm-oncall-name">{s.pharmacy_name}</div>
                <div style={{ fontSize: 12, color: 'var(--n-500)', fontWeight: 700 }}>
                  {__safeDate(s.shift_date).toLocaleDateString('ar-EG', { weekday: 'long', day: 'numeric', month: 'long' })}
                </div>
                <div className="pharm-oncall-time">{s.start_time} — {s.end_time}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
