'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

const STATUS_LABELS = {
  pending:   { label: 'قيد المراجعة', color: '#f59e0b', icon: '⏳' },
  confirmed: { label: 'مؤكد',         color: '#22c55e', icon: '✅' },
  rejected:  { label: 'مرفوض',        color: '#dc2626', icon: '❌' },
  done:      { label: 'مكتمل',        color: '#0ea5e9', icon: '✔️' },
  cancelled: { label: 'ملغي',         color: '#666',    icon: '🚫' },
};

export default function MyAppointments() {
  const router = useRouter();
  const [phone, setPhone] = useState('');
  const [inputPhone, setInputPhone] = useState('');
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('sanad_my_phone');
      if (saved) {
        setPhone(saved);
        load(saved);
      }
    } catch {}
  }, []);

  async function load(p) {
    if (!supabase || !p) return;
    setLoading(true);
    const { data } = await supabase
      .from('appointments')
      .select('*')
      .eq('patient_phone', p)
      .order('appointment_date', { ascending: false });
    setAppointments(Array.isArray(data) ? data : []);
    setLoading(false);
  }

  function handleSearch(e) {
    e.preventDefault();
    const clean = inputPhone.replace(/[^0-9]/g, '');
    if (clean.length < 9) return;
    setPhone(clean);
    try { localStorage.setItem('sanad_my_phone', clean); } catch {}
    load(clean);
  }

  return (
    <div className="sect-page" style={{ paddingBottom: 60 }}>
      <div className="inv-header">
        <button className="inv-back" onClick={() => router.back()} type="button">→</button>
        <span className="inv-title">📅 مواعيدي</span>
        <span style={{ width: 40 }} />
      </div>

      {!phone && (
        <form onSubmit={handleSearch} style={{ padding: 20 }}>
          <div style={{ textAlign: 'center', marginBottom: 24 }}>
            <div style={{ fontSize: 56, marginBottom: 12 }}>🔍</div>
            <h2 style={{ fontSize: 18, fontWeight: 900, marginBottom: 8 }}>ادخل رقم هاتفك</h2>
            <p style={{ fontSize: 13, color: 'var(--n-500)' }}>لعرض جميع مواعيدك</p>
          </div>
          <input
            type="tel"
            value={inputPhone}
            onChange={(e) => setInputPhone(e.target.value)}
            placeholder="09XXXXXXXX"
            className="new-service-input"
            style={{ direction: 'ltr', textAlign: 'right', fontSize: 16, padding: 14, marginBottom: 12 }}
          />
          <button type="submit" className="new-service-submit">🔍 بحث</button>
        </form>
      )}

      {phone && (
        <>
          <div style={{ padding: '12px 16px', background: 'rgba(15,77,58,.08)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 12, color: 'var(--n-500)' }}>📞 {phone}</span>
            <button
              onClick={() => { setPhone(''); setInputPhone(''); setAppointments([]); localStorage.removeItem('sanad_my_phone'); }}
              type="button"
              style={{ fontSize: 11, color: '#dc2626', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 800 }}
            >
              تغيير الرقم
            </button>
          </div>

          {loading ? (
            <div className="sect-empty"><span className="em">⏳</span></div>
          ) : appointments.length === 0 ? (
            <div className="sect-empty"><span className="em">📅</span><p>لا توجد مواعيد</p></div>
          ) : (
            <div style={{ padding: 16 }}>
              {appointments.map((apt) => {
                const st = STATUS_LABELS[apt.status] || STATUS_LABELS.pending;
                return (
                  <div key={apt.id} className="debt-card" style={{ borderRightColor: st.color, marginBottom: 12 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                      <div style={{ fontSize: 15, fontWeight: 900 }}>👨‍⚕️ {apt.doctor_name}</div>
                      <div style={{ padding: '4px 10px', borderRadius: 999, background: st.color + '22', color: st.color, fontSize: 11, fontWeight: 900 }}>
                        {st.icon} {st.label}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 12, fontSize: 12, padding: '10px 12px', background: 'rgba(255,255,255,.04)', borderRadius: 10 }}>
                      <span>📅 {new Date(apt.appointment_date).toLocaleDateString('ar-EG', { weekday: 'short', day: 'numeric', month: 'short' })}</span>
                      <span>⏰ {apt.appointment_time}</span>
                    </div>
                    {apt.status === 'rejected' && apt.rejection_reason && (
                      <div style={{ marginTop: 10, padding: 10, background: 'rgba(220,38,38,.1)', borderRadius: 10, fontSize: 12, color: '#f87171' }}>
                        ❌ {apt.rejection_reason}
                      </div>
                    )}
                    {apt.status === 'confirmed' && (
                      <div style={{ marginTop: 10, padding: 10, background: 'rgba(34,197,94,.1)', borderRadius: 10, fontSize: 12, color: '#4ade80' }}>
                        ✅ موعدك مؤكد — يرجى الحضور في الوقت المحدد
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}
