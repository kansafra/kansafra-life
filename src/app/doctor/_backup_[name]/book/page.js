'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import CustomerAuthModal from '@/components/CustomerAuthModal';
import { getCustomer, saveGuestSession } from '@/lib/customerAuth';

export default function BookAppointmentPage() {
  const router = useRouter();
  const params = useParams();
  const doctorName = decodeURIComponent(params?.name || '');

  const [doctor, setDoctor] = useState(null);
  const [schedules, setSchedules] = useState([]);
  const [existingAppointments, setExistingAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [form, setForm] = useState({
    patient_name: '',
    patient_phone: '',
    patient_age: '',
    reason: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [customer, setCustomer] = useState(null);

  useEffect(() => {
    const c = getCustomer();
    if (c) {
      setCustomer(c);
      setForm((f) => ({ ...f, patient_name: c.full_name || '', patient_phone: c.phone || '' }));
    }
  }, []);

  useEffect(() => {
    load();
  }, [doctorName]);

  async function load() {
    if (!supabase) { setLoading(false); return; }

    // 1) الطبيب
    const { data: ent } = await supabase
      .from('entities')
      .select('*')
      .eq('display_name', doctorName)
      .maybeSingle();
    setDoctor(ent);

    // 2) جدول العمل
    if (ent?.id) {
      const { data: sch } = await supabase
        .from('doctor_schedules')
        .select('*')
        .eq('entity_id', ent.id)
        .eq('is_active', true);
      setSchedules(Array.isArray(sch) ? sch : []);
    }

    setLoading(false);
  }

  // نجيب المواعيد المحجوزة عند اختيار التاريخ
  async function loadBookedSlots(date) {
    if (!supabase || !doctor?.id || !date) return;
    const { data } = await supabase
      .from('appointments')
      .select('appointment_time, status, approval_status')
      .eq('entity_id', doctor.id)
      .eq('appointment_date', date)
      .in('status', ['pending', 'confirmed']);
    setExistingAppointments(Array.isArray(data) ? data : []);
  }

  useEffect(() => {
    if (selectedDate) loadBookedSlots(selectedDate);
  }, [selectedDate, doctor?.id]);

  // توليد أوقات اليوم المختار
  function getAvailableSlots() {
    if (!selectedDate || schedules.length === 0) return [];
    
    const dayOfWeek = new Date(selectedDate).getDay(); // 0=الأحد ... 6=السبت
    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const dayName = dayNames[dayOfWeek];

    const slots = [];
    schedules.forEach((sch) => {
      // إذا الجدول يشمل هذا اليوم
      const days = Array.isArray(sch.days_of_week) ? sch.days_of_week : [];
      if (days.length > 0 && !days.includes(dayName)) return;

      // نجيب بداية ونهاية الوقت
      const start = sch.start_time || '09:00';
      const end = sch.end_time || '17:00';
      const duration = sch.slot_duration || 30;

      const [sh, sm] = start.split(':').map(Number);
      const [eh, em] = end.split(':').map(Number);
      let cur = sh * 60 + sm;
      const endMin = eh * 60 + em;

      while (cur < endMin) {
        const h = Math.floor(cur / 60);
        const m = cur % 60;
        const timeStr = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
        slots.push(timeStr);
        cur += duration;
      }
    });

    return slots;
  }

  // هل الوقت محجوز؟
  function isSlotBooked(time) {
    return existingAppointments.some((apt) => 
      apt.appointment_time === time && 
      (apt.status === 'pending' || apt.status === 'confirmed')
    );
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    if (!form.patient_name.trim()) { setError('الاسم مطلوب'); return; }
    if (!form.patient_phone.trim()) { setError('رقم الهاتف مطلوب'); return; }
    
    // نطلب حساب
    if (!customer) {
      saveGuestSession({ full_name: form.patient_name, phone: form.patient_phone });
      setShowAuthModal(true);
      return;
    }
    if (!selectedDate) { setError('اختر التاريخ'); return; }
    if (!selectedTime) { setError('اختر الوقت'); return; }

    setSubmitting(true);
    try {
      const { error: insErr } = await supabase.from('appointments').insert({
        entity_id: doctor?.id,
        doctor_name: doctorName,
        patient_name: form.patient_name.trim(),
        patient_phone: form.patient_phone.trim(),
        patient_age: parseInt(form.patient_age) || null,
        appointment_date: selectedDate,
        appointment_time: selectedTime,
        reason: form.reason.trim() || null,
        status: 'pending',
        approval_status: 'pending',
      });

      if (insErr) throw insErr;

      setSuccess({
        doctor: doctorName,
        date: selectedDate,
        time: selectedTime,
        patient: form.patient_name.trim(),
      });
    } catch (err) {
      if (err.message?.includes('duplicate')) {
        setError('هذا الوقت محجوز — اختر وقتاً آخر');
      } else {
        setError('تعذّر الحجز: ' + (err.message || 'خطأ'));
      }
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <div className="sect-empty" style={{ padding: 80 }}><span className="em">⏳</span></div>;
  if (!doctor) return <div className="sect-empty" style={{ padding: 80 }}><span className="em">🔍</span><p>الطبيب غير موجود</p></div>;

  if (success) {
    return (
      <div className="sect-page" style={{ paddingBottom: 40 }}>
        <div style={{ padding: 40, textAlign: 'center' }}>
          <div style={{ fontSize: 72, marginBottom: 16 }}>✅</div>
          <h1 style={{ fontSize: 22, fontWeight: 900, marginBottom: 12 }}>تم إرسال طلب الحجز</h1>
          <p style={{ fontSize: 13, color: 'var(--n-500)', lineHeight: 1.8, marginBottom: 24 }}>
            سيتم تأكيد موعدك من قبل الطبيب. تابع حالته يوجد صفحة "مواعيدي".
          </p>

          <div style={{ padding: 20, background: 'rgba(15,77,58,.08)', borderRadius: 16, textAlign: 'right', maxWidth: 340, margin: '0 auto 24px' }}>
            <div style={{ marginBottom: 12, fontSize: 13 }}>
              <strong>👨‍⚕️ الطبيب:</strong> {success.doctor}
            </div>
            <div style={{ marginBottom: 12, fontSize: 13 }}>
              <strong>📅 التاريخ:</strong> {new Date(success.date).toLocaleDateString('ar-EG', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </div>
            <div style={{ marginBottom: 12, fontSize: 13 }}>
              <strong>⏰ الوقت:</strong> {success.time}
            </div>
            <div style={{ fontSize: 13 }}>
              <strong>👤 المريض:</strong> {success.patient}
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxWidth: 340, margin: '0 auto' }}>
            <Link
              href="/doctor"
              style={{ padding: 14, background: 'linear-gradient(135deg, #22c55e, #16a34a)', color: '#fff', borderRadius: 12, fontSize: 14, fontWeight: 900, textDecoration: 'none', textAlign: 'center' }}
            >
              → قائمة الأطباء
            </Link>
            <Link
              href="/"
              style={{ padding: 12, background: 'rgba(255,255,255,.06)', color: '#fff', border: '1px solid rgba(255,255,255,.15)', borderRadius: 12, fontSize: 13, fontWeight: 800, textDecoration: 'none', textAlign: 'center' }}
            >
              🏠 الرئيسية
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const availableSlots = getAvailableSlots();
  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="sect-page" style={{ paddingBottom: 40 }}>
      <div className="inv-header">
        <button className="inv-back" onClick={() => router.back()} type="button">→</button>
        <span className="inv-title">📅 حجز موعد</span>
        <span style={{ width: 40 }} />
      </div>

      <div style={{ padding: 16, textAlign: 'center', background: 'rgba(15,77,58,.08)' }}>
        <div style={{ fontSize: 48, marginBottom: 8 }}>👨‍⚕️</div>
        <div style={{ fontSize: 18, fontWeight: 900 }}>{doctor.display_name}</div>
        {doctor.bio && (
          <div style={{ fontSize: 12, color: 'var(--n-500)', marginTop: 6 }}>{doctor.bio}</div>
        )}
      </div>

      <form onSubmit={handleSubmit} style={{ padding: 16 }}>
        {/* التاريخ */}
        <div className="new-service-field" style={{ marginBottom: 12 }}>
          <label className="new-service-label">📅 التاريخ</label>
          <input
            type="date"
            min={today}
            value={selectedDate}
            onChange={(e) => { setSelectedDate(e.target.value); setSelectedTime(''); }}
            className="new-service-input"
          />
        </div>

        {/* الأوقات */}
        {selectedDate && (
          <div className="new-service-field" style={{ marginBottom: 12 }}>
            <label className="new-service-label">⏰ الوقت</label>
            {availableSlots.length === 0 ? (
              <div style={{ padding: 12, background: 'rgba(220,38,38,.1)', borderRadius: 10, fontSize: 12, color: '#f87171', textAlign: 'center' }}>
                لا توجد أوقات متاحة يوجد هذا اليوم
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6 }}>
                {availableSlots.map((time) => {
                  const booked = isSlotBooked(time);
                  const selected = selectedTime === time;
                  return (
                    <button
                      key={time}
                      type="button"
                      disabled={booked}
                      onClick={() => setSelectedTime(time)}
                      style={{
                        padding: '10px 6px',
                        background: booked ? 'rgba(220,38,38,.08)' : selected ? '#22c55e' : 'rgba(255,255,255,.04)',
                        border: selected ? '2px solid #22c55e' : '1px solid rgba(255,255,255,.1)',
                        borderRadius: 10,
                        color: booked ? '#666' : selected ? '#fff' : '#fff',
                        fontSize: 12,
                        fontWeight: 800,
                        cursor: booked ? 'not-allowed' : 'pointer',
                        textDecoration: booked ? 'line-through' : 'none',
                      }}
                    >
                      {time}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* بيانات المريض */}
        <div className="new-service-field" style={{ marginBottom: 12 }}>
          <label className="new-service-label">👤 الاسم الكامل *</label>
          <input
            type="text"
            value={form.patient_name}
            onChange={(e) => setForm({ ...form, patient_name: e.target.value })}
            placeholder="الاسم الثلاثي"
            className="new-service-input"
          />
        </div>

        <div className="new-prod-row">
          <div className="new-service-field">
            <label className="new-service-label">📞 الهاتف *</label>
            <input
              type="tel"
              value={form.patient_phone}
              onChange={(e) => setForm({ ...form, patient_phone: e.target.value })}
              placeholder="09XXXXXXXX"
              className="new-service-input"
              style={{ direction: 'ltr', textAlign: 'right' }}
            />
          </div>
          <div className="new-service-field">
            <label className="new-service-label">🎂 العمر</label>
            <input
              type="number"
              value={form.patient_age}
              onChange={(e) => setForm({ ...form, patient_age: e.target.value })}
              placeholder="اختياري"
              className="new-service-input"
            />
          </div>
        </div>

        <div className="new-service-field" style={{ marginBottom: 12 }}>
          <label className="new-service-label">📝 سبب الزيارة (اختياري)</label>
          <textarea
            value={form.reason}
            onChange={(e) => setForm({ ...form, reason: e.target.value })}
            placeholder="صف الأعراض بإيجاز..."
            className="new-service-textarea"
          />
        </div>

        {error && (
          <div style={{ padding: 12, background: 'rgba(220,38,38,.15)', borderRadius: 12, color: '#f87171', fontSize: 12.5, marginBottom: 12, textAlign: 'center' }}>
            ⚠️ {error}
          </div>
        )}

        <button
          type="submit"
          disabled={submitting || !selectedDate || !selectedTime}
          className="new-service-submit"
        >
          {submitting ? '... جارٍ الحجز' : '✓ تأكيد الحجز'}
        </button>
      </form>

      <CustomerAuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onSuccess={(c) => {
          setCustomer(c);
          setForm((f) => ({ ...f, patient_name: c.full_name || f.patient_name, patient_phone: c.phone || f.patient_phone }));
          setShowAuthModal(false);
          setTimeout(() => {
            document.querySelector('form')?.requestSubmit?.();
          }, 300);
        }}
        defaultPhone={form.patient_phone}
        defaultName={form.patient_name}
      />
    </div>
  );
}
