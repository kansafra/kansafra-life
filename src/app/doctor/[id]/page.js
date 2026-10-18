'use client';
import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/components/Toast';
import ReviewsSummary from '@/components/ReviewsSummary';
import Reviews from '@/components/Reviews';

const WEEK_DAYS = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];

export default function DoctorDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { success, error: tE } = useToast();
  const [doctor, setDoctor] = useState(null);
  const [schedules, setSchedules] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState(false);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedSlot, setSelectedSlot] = useState('');
  const [form, setForm] = useState({ patient_name: '', patient_phone: '', notes: '' });
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    if (params?.id) load(decodeURIComponent(params.id));
  }, [params?.id]);

  async function load(name) {
    if (!supabase) { setLoading(false); return; }
    try {
      const [dRes, sRes, aRes] = await Promise.all([
        supabase.from('entities').select('*').eq('display_name', name).eq('entity_type', 'doctor').maybeSingle(),
        supabase.from('doctor_schedules').select('*').eq('entity_name', name),
        supabase.from('appointments').select('appointment_date, appointment_time').eq('provider_name', name).in('status', ['pending', 'confirmed']),
      ]);
      setDoctor(dRes.data);
      setSchedules(sRes.data || []);
      setAppointments(aRes.data || []);
    } catch (e) { console.error(e); }
    setLoading(false);
  }

  // توليد الأيام القادمة (14 يوم)
  const nextDays = [];
  for (let i = 0; i < 14; i++) {
    const d = new Date();
    d.setDate(d.getDate() + i);
    nextDays.push(d);
  }

  function getAvailableSlots(dateStr) {
    if (!dateStr) return [];
    const date = new Date(dateStr);
    const dayIdx = date.getDay();
    const schedule = schedules.find(s => s.day_of_week === dayIdx || s.weekday === dayIdx);
    if (!schedule) return [];
    
    const start = schedule.start_time || '09:00';
    const end = schedule.end_time || '17:00';
    const duration = Number(schedule.slot_duration) || 30;
    
    const slots = [];
    const [sh, sm] = start.split(':').map(Number);
    const [eh, em] = end.split(':').map(Number);
    let current = sh * 60 + sm;
    const endMins = eh * 60 + em;
    
    while (current + duration <= endMins) {
      const hh = String(Math.floor(current / 60)).padStart(2, '0');
      const mm = String(current % 60).padStart(2, '0');
      const timeStr = `${hh}:${mm}`;
      
      const isBooked = appointments.some(a => a.appointment_date === dateStr && a.appointment_time === timeStr);
      if (!isBooked) slots.push(timeStr);
      
      current += duration;
    }
    return slots;
  }

  const availableSlots = getAvailableSlots(selectedDate);

  async function handleBooking() {
    if (!selectedDate) { tE('اختر التاريخ'); return; }
    if (!selectedSlot) { tE('اختر الوقت'); return; }
    if (!form.patient_name.trim()) { tE('الاسم مطلوب'); return; }
    if (!form.patient_phone.trim()) { tE('الهاتف مطلوب'); return; }

    setBooking(true);
    try {
      const { error } = await supabase.from('appointments').insert({
        provider_name: doctor.display_name,
        doctor_name: doctor.display_name,
        customer_name: form.patient_name.trim(),
        customer_phone: form.patient_phone.trim(),
        appointment_date: selectedDate,
        appointment_time: selectedSlot,
        notes: form.notes.trim() || null,
        status: 'pending',
      });
      if (error) throw error;
      success('✅ تم حجز الموعد بنجاح');
      setShowModal(false);
      setForm({ patient_name: '', patient_phone: '', notes: '' });
      setSelectedDate('');
      setSelectedSlot('');
      load(doctor.display_name);
    } catch (e) { tE('تعذّر: ' + e.message); }
    setBooking(false);
  }

  function call() {
    if (!doctor?.phone) return;
    window.location.href = `tel:${doctor.phone}`;
  }

  function whatsapp() {
    if (!doctor?.phone) return;
    const clean = String(doctor.phone).replace(/\D/g, '');
    const phone = clean.startsWith('0') ? '963' + clean.slice(1) : clean;
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(`مرحباً د. ${doctor.display_name}`)}`, '_blank');
  }

  if (loading) return <div style={{ padding: 80, textAlign: 'center' }}>⏳</div>;
  if (!doctor) return (
    <div style={{ padding: 60, textAlign: 'center' }}>
      <div style={{ fontSize: 64, marginBottom: 16 }}>🔍</div>
      <div style={{ fontSize: 18, fontWeight: 900, marginBottom: 16 }}>الطبيب غير موجود</div>
      <Link href="/doctor" style={{ display: 'inline-block', padding: '12px 24px', background: '#0f4d3a', color: '#fff', borderRadius: 12, textDecoration: 'none', fontWeight: 900 }}>← الأطباء</Link>
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', paddingBottom: 100 }}>
      {/* Cover */}
      <div style={{ height: 140, background: 'linear-gradient(135deg,#dc2626,#7f1d1d)', position: 'relative' }}>
        <button onClick={() => router.back()} style={{ position: 'absolute', top: 16, right: 16, background: 'rgba(255,255,255,.2)', color: '#fff', border: 'none', width: 40, height: 40, borderRadius: '50%', fontSize: 18, cursor: 'pointer', fontFamily: 'inherit' }}>→</button>
      </div>

      {/* Profile */}
      <div style={{ padding: '0 16px', marginTop: -60, position: 'relative', zIndex: 1 }}>
        <div style={{ background: '#fff', borderRadius: 20, padding: 20, boxShadow: '0 4px 20px rgba(0,0,0,.08)' }}>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 14, marginBottom: 16 }}>
            {doctor.logo_url ? (
              <img src={doctor.logo_url} alt="" style={{ width: 80, height: 80, borderRadius: 20, objectFit: 'cover', border: '4px solid #fff', background: '#fff' }} />
            ) : (
              <div style={{ width: 80, height: 80, borderRadius: 20, background: 'linear-gradient(135deg,#dc2626,#7f1d1d)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 40, border: '4px solid #fff' }}>🩺</div>
            )}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                <h1 style={{ fontSize: 20, fontWeight: 900, color: '#0f172a' }}>د. {doctor.display_name}</h1>
                {doctor.is_verified && <span style={{ fontSize: 14 }}>✅</span>}
              </div>
              <div style={{ fontSize: 12, color: '#dc2626', fontWeight: 800 }}>🩺 طبيب / عيادة</div>
            </div>
          </div>

          {doctor.bio && (
            <div style={{ fontSize: 13, color: '#64748b', lineHeight: 1.7, marginBottom: 14, padding: 12, background: '#f8fafc', borderRadius: 10 }}>
              {doctor.bio}
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 14 }}>
            {doctor.city && (
              <div style={{ padding: 10, background: '#f8fafc', borderRadius: 10, textAlign: 'center' }}>
                <div style={{ fontSize: 18 }}>📍</div>
                <div style={{ fontSize: 11, color: '#64748b', fontWeight: 700, marginTop: 2 }}>{doctor.city}</div>
              </div>
            )}
            {doctor.opening_hours && (
              <div style={{ padding: 10, background: '#f8fafc', borderRadius: 10, textAlign: 'center' }}>
                <div style={{ fontSize: 18 }}>🕐</div>
                <div style={{ fontSize: 11, color: '#64748b', fontWeight: 700, marginTop: 2 }}>{doctor.opening_hours}</div>
              </div>
            )}
          </div>

          {doctor.address && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: 12, background: '#f8fafc', borderRadius: 10, marginBottom: 14 }}>
              <span style={{ fontSize: 16 }}>🏠</span>
              <span style={{ fontSize: 12, color: '#334155' }}>{doctor.address}</span>
            </div>
          )}

          {doctor.phone && (
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={call} style={{ flex: 1, padding: 12, background: 'rgba(59,130,246,.1)', color: '#3b82f6', border: '1px solid rgba(59,130,246,.3)', borderRadius: 10, fontSize: 13, fontWeight: 900, cursor: 'pointer', fontFamily: 'inherit' }}>📞 اتصال</button>
              <button onClick={whatsapp} style={{ flex: 1, padding: 12, background: 'rgba(37,211,102,.1)', color: '#059669', border: '1px solid rgba(37,211,102,.3)', borderRadius: 10, fontSize: 13, fontWeight: 900, cursor: 'pointer', fontFamily: 'inherit' }}>📱 واتساب</button>
            </div>
          )}
        </div>
      </div>

      {/* Booking Calendar */}
      <div style={{ padding: 16 }}>
        <div style={{ background: '#fff', borderRadius: 16, padding: 16 }}>
          <h2 style={{ fontSize: 16, fontWeight: 900, marginBottom: 14 }}>📅 احجز موعدك</h2>
          
          {/* Date Selection */}
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 12, fontWeight: 800, color: '#334155', marginBottom: 8 }}>اختر التاريخ</div>
            <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4 }}>
              {nextDays.map((d, i) => {
                const dateStr = d.toISOString().slice(0, 10);
                const slots = getAvailableSlots(dateStr);
                const isDisabled = slots.length === 0;
                return (
                  <button key={i} onClick={() => { if (!isDisabled) { setSelectedDate(dateStr); setSelectedSlot(''); } }} disabled={isDisabled} style={{
                    flexShrink: 0, width: 64, padding: 10, borderRadius: 12,
                    background: selectedDate === dateStr ? '#dc2626' : isDisabled ? '#f8fafc' : '#fff',
                    color: selectedDate === dateStr ? '#fff' : isDisabled ? '#cbd5e1' : '#334155',
                    border: `1px solid ${selectedDate === dateStr ? '#dc2626' : '#e5e7eb'}`,
                    cursor: isDisabled ? 'not-allowed' : 'pointer', fontFamily: 'inherit',
                    opacity: isDisabled ? 0.5 : 1,
                  }}>
                    <div style={{ fontSize: 11, fontWeight: 700 }}>{WEEK_DAYS[d.getDay()].slice(0, 3)}</div>
                    <div style={{ fontSize: 20, fontWeight: 900, marginTop: 2 }}>{d.getDate()}</div>
                    <div style={{ fontSize: 9, marginTop: 2, opacity: 0.7 }}>{slots.length > 0 ? `${slots.length} وقت` : 'مغلق'}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Time Slots */}
          {selectedDate && (
            <div>
              <div style={{ fontSize: 12, fontWeight: 800, color: '#334155', marginBottom: 8 }}>اختر الوقت</div>
              {availableSlots.length === 0 ? (
                <div style={{ textAlign: 'center', padding: 20, color: '#64748b', fontSize: 13 }}>لا توجد أوقات متاحة</div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                  {availableSlots.map(slot => (
                    <button key={slot} onClick={() => setSelectedSlot(slot)} style={{
                      padding: '10px', borderRadius: 10,
                      background: selectedSlot === slot ? '#dc2626' : '#f8fafc',
                      color: selectedSlot === slot ? '#fff' : '#334155',
                      border: `1px solid ${selectedSlot === slot ? '#dc2626' : '#e5e7eb'}`,
                      fontSize: 13, fontWeight: 900, cursor: 'pointer', fontFamily: 'inherit',
                    }}>{slot}</button>
                  ))}
                </div>
              )}
            </div>
          )}

          {selectedDate && selectedSlot && (
            <button onClick={() => setShowModal(true)} style={{ width: '100%', marginTop: 16, padding: 14, background: 'linear-gradient(135deg,#dc2626,#991b1b)', color: '#fff', border: 'none', borderRadius: 12, fontSize: 14, fontWeight: 900, cursor: 'pointer', fontFamily: 'inherit' }}>
              ✓ متابعة الحجز — {selectedDate} · {selectedSlot}
            </button>
          )}
        </div>
      </div>

      {/* Reviews */}
      <div style={{ padding: '0 16px 20px' }}>
        <div style={{ background: '#fff', borderRadius: 16, padding: 16 }}>
          <Reviews targetType="doctor" targetId={doctor.id} targetName={doctor.display_name} />
        </div>
      </div>

      {/* Booking Modal */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.6)', zIndex: 100, display: 'flex', alignItems: 'flex-end' }} onClick={() => setShowModal(false)}>
          <div style={{ background: '#fff', borderRadius: '24px 24px 0 0', width: '100%', maxWidth: 500, margin: '0 auto', padding: '24px 20px 30px' }} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ fontSize: 18, fontWeight: 900, marginBottom: 16 }}>تأكيد الحجز</h3>
            
            <div style={{ padding: 12, background: '#f8fafc', borderRadius: 10, marginBottom: 16 }}>
              <div style={{ fontSize: 12, color: '#64748b' }}>الموعد المحدد</div>
              <div style={{ fontSize: 14, fontWeight: 900, color: '#dc2626', marginTop: 4 }}>{selectedDate} · {selectedSlot}</div>
            </div>

            <input type="text" placeholder="اسمك الكامل *" value={form.patient_name} onChange={(e) => setForm({ ...form, patient_name: e.target.value })} style={{ width: '100%', padding: 12, border: '1px solid #e5e7eb', borderRadius: 10, fontSize: 13, marginBottom: 10, boxSizing: 'border-box', fontFamily: 'inherit' }} />
            <input type="tel" placeholder="رقم الهاتف *" value={form.patient_phone} onChange={(e) => setForm({ ...form, patient_phone: e.target.value })} style={{ width: '100%', padding: 12, border: '1px solid #e5e7eb', borderRadius: 10, fontSize: 13, marginBottom: 10, boxSizing: 'border-box', fontFamily: 'inherit', direction: 'ltr', textAlign: 'right' }} />
            <textarea placeholder="ملاحظات أو سبب الزيارة (اختياري)" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} style={{ width: '100%', padding: 12, border: '1px solid #e5e7eb', borderRadius: 10, fontSize: 13, marginBottom: 16, boxSizing: 'border-box', fontFamily: 'inherit', resize: 'vertical' }} />

            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setShowModal(false)} style={{ flex: 1, padding: 12, background: '#f1f5f9', border: 'none', borderRadius: 10, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit' }}>إلغاء</button>
              <button onClick={handleBooking} disabled={booking} style={{ flex: 1, padding: 12, background: 'linear-gradient(135deg,#dc2626,#991b1b)', color: '#fff', border: 'none', borderRadius: 10, fontWeight: 900, cursor: booking ? 'not-allowed' : 'pointer', fontFamily: 'inherit' }}>{booking ? '...' : '✓ تأكيد الحجز'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
