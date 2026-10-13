'use client';

// Safe date for hydration
const __safeDate = (d) => (typeof window !== 'undefined' ? __safeDate(d) : __safeDate(0));

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

const DAYS = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
const MONTHS = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];

const genQR = () => 'APT-' + Date.now().toString(36).toUpperCase() + Math.random().toString(36).slice(2, 6).toUpperCase();

export default function DoctorPage() {
  const params = useParams();
  const router = useRouter();
  const doctorName = decodeURIComponent(params?.name || '');

  const [schedule, setSchedule] = useState([]);
  const [taken, setTaken] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTime, setSelectedTime] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [age, setAge] = useState('');
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!doctorName) return;
    async function load() {
      if (!supabase) { setLoading(false); return; }
      const [schedRes, apptRes] = await Promise.all([
        supabase.from('doctor_schedules').select('*').eq('doctor_name', doctorName).eq('is_active', true),
        supabase.from('appointments').select('appointment_date,appointment_time').eq('doctor_name', doctorName),
      ]);
      setSchedule(Array.isArray(schedRes.data) ? schedRes.data : []);
      setTaken(Array.isArray(apptRes.data) ? apptRes.data : []);
      setLoading(false);
    }
    load();
  }, [doctorName]);

  const days = [];
  const today = __safeDate();
  for (let i = 0; i < 14; i++) {
    const d = __safeDate(today);
    d.setDate(today.getDate() + i);
    days.push(d);
  }

  const slotsForDate = (date) => {
    if (!date) return [];
    const dow = date.getDay();
    const sched = schedule.find((s) => Number(s.day_of_week) === dow);
    if (!sched) return [];
    const [sh, sm] = (sched.start_time || '09:00').split(':').map(Number);
    const [eh, em] = (sched.end_time || '17:00').split(':').map(Number);
    const slot = Number(sched.slot_minutes) || 30;
    const out = [];
    let cur = sh * 60 + sm;
    const end = eh * 60 + em;
    while (cur + slot <= end) {
      const h = String(Math.floor(cur / 60)).padStart(2, '0');
      const m = String(cur % 60).padStart(2, '0');
      out.push(`${h}:${m}`);
      cur += slot;
    }
    return out;
  };

  const dateKey = (d) => {
    if (!d) return '';
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };

  const isTaken = (d, t) => taken.some((x) => x.appointment_date === dateKey(d) && x.appointment_time === t);

  async function submit(e) {
    e.preventDefault();
    setError('');
    if (!selectedDate) { setError('اختر التاريخ'); return; }
    if (!selectedTime) { setError('اختر الوقت'); return; }
    if (!name.trim() || name.trim().length < 3) { setError('الاسم مطلوب'); return; }
    if (!phone.trim() || phone.trim().length < 6) { setError('رقم الهاتف مطلوب'); return; }
    if (!supabase) { setError('قاعدة البيانات غير متصلة'); return; }

    setSubmitting(true);
    const { error: err } = await supabase.from('appointments').insert({
      doctor_name: doctorName,
      patient_name: name.trim(),
      patient_phone: phone.trim(),
      patient_age: Number(age) || null,
      appointment_date: dateKey(selectedDate),
      appointment_time: selectedTime,
      reason: reason.trim() || null,
      status: 'pending',
      qr_code: genQR(),
    });
    setSubmitting(false);
    if (err) { setError('تعذّر الحجز: ' + err.message); return; }
    setDone(true);
  }

  const slots = slotsForDate(selectedDate);

  if (done) {
    return (
      <div className="doc-page">
        <div className="new-service-success">
          <div className="chk-circle">✓</div>
          <h2>تم حجز الموعد</h2>
          <p>سيصلك تأكيد قريباً من العيادة</p>
          <p style={{ fontSize: 13, fontWeight: 800, color: 'var(--f-700)' }}>
            {DAYS[selectedDate.getDay()]} — {dateKey(selectedDate)} — {selectedTime}
          </p>
          <Link href="/" className="new-service-submit" style={{ display: 'block', textAlign: 'center', textDecoration: 'none', marginTop: 20 }}>
            العودة للرئيسية
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="doc-page">
      <header className="doc-hero">
        <div className="doc-hero-inner">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
            <Link href="/" style={{ color: '#fff', fontSize: 22, textDecoration: 'none' }}>→</Link>
            <span style={{ letterSpacing: 3, fontSize: 11, fontWeight: 800, opacity: .7 }}>DOCTOR</span>
          </div>
          <h1 className="doc-title">{doctorName}</h1>
          <p className="doc-sub">احجز موعدك الآن في دقيقة</p>
        </div>
      </header>

      {loading ? (
        <div className="trans-empty"><span className="em">⏳</span><p>جارٍ التحميل...</p></div>
      ) : schedule.length === 0 ? (
        <div className="trans-empty">
          <span className="em">📅</span>
          <p>الطبيب لم يفتح مواعيده بعد</p>
        </div>
      ) : (
        <>
          <div style={{ padding: '20px 20px 0' }}>
            <h3 style={{ fontSize: 16, fontWeight: 900, color: 'var(--n-900)', marginBottom: 4 }}>اختر التاريخ</h3>
          </div>
          <div className="doc-date-row">
            {days.map((d) => {
              const active = selectedDate && dateKey(selectedDate) === dateKey(d);
              const hasSlots = slotsForDate(d).length > 0;
              return (
                <button
                  key={dateKey(d)}
                  className={`doc-date-chip ${active ? 'active' : ''}`}
                  style={!hasSlots ? { opacity: .4 } : {}}
                  onClick={() => { if (hasSlots) { setSelectedDate(d); setSelectedTime(''); } }}
                  disabled={!hasSlots}
                  type="button"
                >
                  <div className="doc-date-day">{DAYS[d.getDay()]}</div>
                  <div className="doc-date-num">{d.getDate()}</div>
                  <div className="doc-date-mon">{MONTHS[d.getMonth()]}</div>
                </button>
              );
            })}
          </div>

          {selectedDate && slots.length > 0 && (
            <>
              <div style={{ padding: '20px 20px 0' }}>
                <h3 style={{ fontSize: 16, fontWeight: 900, color: 'var(--n-900)' }}>اختر الوقت</h3>
              </div>
              <div className="doc-slots">
                {slots.map((t) => {
                  const busy = isTaken(selectedDate, t);
                  return (
                    <button
                      key={t}
                      className={`doc-slot ${selectedTime === t ? 'active' : ''} ${busy ? 'taken' : ''}`}
                      onClick={() => { if (!busy) setSelectedTime(t); }}
                      disabled={busy}
                      type="button"
                    >
                      {t}
                    </button>
                  );
                })}
              </div>
            </>
          )}

          {selectedTime && (
            <form onSubmit={submit} style={{ padding: '0 20px 40px', display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div className="new-service-field">
                <label className="new-service-label">الاسم الكامل <span className="req">*</span></label>
                <input className="new-service-input" value={name} onChange={(e) => setName(e.target.value)} placeholder="محمد أحمد علي" />
              </div>
              <div className="new-service-field">
                <label className="new-service-label">رقم الهاتف <span className="req">*</span></label>
                <input className="new-service-input" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="09XXXXXXXX" />
              </div>
              <div className="new-service-field">
                <label className="new-service-label">العمر</label>
                <input className="new-service-input" type="number" value={age} onChange={(e) => setAge(e.target.value)} placeholder="35" />
              </div>
              <div className="new-service-field">
                <label className="new-service-label">سبب الزيارة</label>
                <textarea className="new-service-textarea" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="وصف موجز..." />
              </div>
              {error && <div style={{ color: '#dc2626', fontSize: 13, fontWeight: 700, padding: 12, background: 'rgba(220,38,38,.1)', borderRadius: 12 }}>{error}</div>}
              <button className="new-service-submit" type="submit" disabled={submitting}>
                {submitting ? '... جارٍ الحجز' : '✓ تأكيد الحجز'}
              </button>
            </form>
          )}
        </>
      )}
    </div>
  );
}
