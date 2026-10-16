'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { getSession } from '@/lib/auth';
import { sendNotification } from '@/lib/notify';

const STATUS_LABELS = {
  pending:   { label: 'قيد المراجعة', color: '#f59e0b', icon: '⏳' },
  confirmed: { label: 'مؤكد',         color: '#22c55e', icon: '✅' },
  rejected:  { label: 'مرفوض',        color: '#dc2626', icon: '❌' },
  done:      { label: 'مكتمل',        color: '#0ea5e9', icon: '✔️' },
  cancelled: { label: 'ملغي',         color: '#666',    icon: '🚫' },
};

export default function MerchantAppointments() {
  const router = useRouter();
  const [session, setSession] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [selectedDate, setSelectedDate] = useState('');

  useEffect(() => {
    const s = getSession();
    if (!s) { router.replace('/login'); return; }
    setSession(s);
    load(s);
  }, [router]);

  async function load(s) {
    if (!supabase) { setLoading(false); return; }
    let query = supabase
      .from('appointments')
      .select('*')
      .eq('doctor_name', s.display_name)
      .order('appointment_date', { ascending: false });
    
    const { data } = await query;
    setAppointments(Array.isArray(data) ? data : []);
    setLoading(false);
  }

  async function updateStatus(apt, newStatus, reason = null) {
    const { error } = await supabase
      .from('appointments')
      .update({ 
        status: newStatus, 
        approval_status: newStatus === 'confirmed' ? 'approved' : newStatus === 'rejected' ? 'rejected' : undefined,
        rejection_reason: reason,
        approved_at: newStatus === 'confirmed' ? new Date().toISOString() : null,
      })
      .eq('id', apt.id);
    
    if (!error) {
      setAppointments((arr) => arr.map((a) => a.id === apt.id ? { ...a, status: newStatus } : a));
      
      // إشعار المريض
      try {
        const titles = {
          confirmed: '✅ تم تأكيد موعدك',
          rejected: '❌ تم رفض موعدك',
          done: '✔️ اكتمل موعدك',
          cancelled: '🚫 تم إلغاء موعدك',
        };
        const bodies = {
          confirmed: `موعدك مع ${apt.doctor_name} يوم ${apt.appointment_date} الساعة ${apt.appointment_time} تم تأكيده`,
          rejected: reason ? `سبب الرفض: ${reason}` : 'يرجى حجز موعد آخر',
          done: 'شكراً لزيارتك — نتمنى لكن الشفاء',
          cancelled: 'تم إلغاء الموعد من قبل الطبيب',
        };
        
        await sendNotification({
          recipient: apt.patient_phone,
          title: titles[newStatus] || '📅 تحديث موعدك',
          body: bodies[newStatus] || 'تم تحديث حالة موعدك',
          type: newStatus === 'rejected' || newStatus === 'cancelled' ? 'error' : 'success',
          targetUrl: '/my-appointments',
          playAudio: true,
        });
      } catch (e) {
        console.warn('notify patient:', e);
      }
    }
  }

  const filtered = appointments.filter((a) => {
    if (filter !== 'all' && a.status !== filter) return false;
    if (selectedDate && a.appointment_date !== selectedDate) return false;
    return true;
  });

  const counts = {
    all: appointments.length,
    pending: appointments.filter((a) => a.status === 'pending').length,
    confirmed: appointments.filter((a) => a.status === 'confirmed').length,
    rejected: appointments.filter((a) => a.status === 'rejected').length,
  };

  return (
    <div className="sect-page" style={{ paddingBottom: 60 }}>
      <div className="inv-header">
        <Link href="/merchant" className="inv-back">→</Link>
        <span className="inv-title">📅 المواعيد</span>
        <span className="inv-count">{counts.pending}</span>
      </div>

      <div className="chips-scroll" style={{ padding: '12px 16px 8px' }}>
        <button className={`chip ${filter === 'all' ? 'active' : ''}`} onClick={() => setFilter('all')} type="button">الكل ({counts.all})</button>
        <button className={`chip ${filter === 'pending' ? 'active' : ''}`} onClick={() => setFilter('pending')} type="button">⏳ قيد المراجعة ({counts.pending})</button>
        <button className={`chip ${filter === 'confirmed' ? 'active' : ''}`} onClick={() => setFilter('confirmed')} type="button">✅ مؤكد ({counts.confirmed})</button>
      </div>

      <div style={{ padding: '0 16px 12px' }}>
        <input
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          className="new-service-input"
          placeholder="فلترة بالتاريخ"
        />
      </div>

      {loading ? (
        <div className="sect-empty"><span className="em">⏳</span></div>
      ) : filtered.length === 0 ? (
        <div className="sect-empty"><span className="em">📅</span><p>لا توجد مواعيد</p></div>
      ) : (
        <div style={{ padding: 16 }}>
          {filtered.map((apt) => {
            const st = STATUS_LABELS[apt.status] || STATUS_LABELS.pending;
            return (
              <div key={apt.id} className="debt-card" style={{ borderRightColor: st.color, marginBottom: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 15, fontWeight: 900, marginBottom: 4 }}>
                      👤 {apt.patient_name}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--n-500)' }}>
                      📞 {apt.patient_phone}
                      {apt.patient_age && ` · 🎂 ${apt.patient_age} سنة`}
                    </div>
                  </div>
                  <div style={{ padding: '4px 10px', borderRadius: 999, background: st.color + '22', color: st.color, fontSize: 10.5, fontWeight: 900 }}>
                    {st.icon} {st.label}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 12, fontSize: 12, padding: '10px 12px', background: 'rgba(255,255,255,.04)', borderRadius: 10, marginBottom: 10 }}>
                  <span>📅 {new Date(apt.appointment_date).toLocaleDateString('ar-EG', { weekday: 'short', month: 'short', day: 'numeric' })}</span>
                  <span>⏰ {apt.appointment_time}</span>
                </div>

                {apt.reason && (
                  <div style={{ fontSize: 12, color: 'var(--n-400)', marginBottom: 10, padding: '8px 12px', background: 'rgba(255,255,255,.03)', borderRadius: 8, lineHeight: 1.6 }}>
                    📝 {apt.reason}
                  </div>
                )}

                {apt.status === 'pending' && (
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button
                      onClick={() => updateStatus(apt, 'confirmed')}
                      type="button"
                      style={{ flex: 1, padding: 10, background: 'linear-gradient(135deg, #22c55e, #16a34a)', color: '#fff', border: 'none', borderRadius: 10, fontSize: 13, fontWeight: 900, cursor: 'pointer' }}
                    >
                      ✅ تأكيد
                    </button>
                    <button
                      onClick={() => {
                        const reason = prompt('سبب الرفض:');
                        updateStatus(apt, 'rejected');
                      }}
                      type="button"
                      style={{ flex: 1, padding: 10, background: 'rgba(220,38,38,.15)', color: '#dc2626', border: '1px solid rgba(220,38,38,.3)', borderRadius: 10, fontSize: 13, fontWeight: 900, cursor: 'pointer' }}
                    >
                      ❌ رفض
                    </button>
                  </div>
                )}

                {apt.status === 'confirmed' && (
                  <div style={{ display: 'flex', gap: 8 }}>
                    <a
                      href={`tel:${apt.patient_phone}`}
                      style={{ flex: 1, padding: 10, background: 'rgba(34,197,94,.15)', color: '#22c55e', border: '1px solid rgba(34,197,94,.3)', borderRadius: 10, fontSize: 13, fontWeight: 900, textDecoration: 'none', textAlign: 'center' }}
                    >
                      📞 اتصال
                    </a>
                    <a
                      href={`https://wa.me/${apt.patient_phone.replace(/[^0-9]/g, '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ flex: 1, padding: 10, background: 'linear-gradient(135deg, #25D366, #128C7E)', color: '#fff', border: 'none', borderRadius: 10, fontSize: 13, fontWeight: 900, textDecoration: 'none', textAlign: 'center' }}
                    >
                      💬 واتساب
                    </a>
                    <button
                      onClick={() => updateStatus(apt, 'done')}
                      type="button"
                      style={{ padding: 10, background: 'rgba(14,165,233,.15)', color: '#0ea5e9', border: '1px solid rgba(14,165,233,.3)', borderRadius: 10, fontSize: 13, fontWeight: 900, cursor: 'pointer' }}
                    >
                      ✔️
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
