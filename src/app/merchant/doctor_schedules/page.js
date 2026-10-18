'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { useCurrentUser } from '@/lib/useCurrentUser';
import { useToast } from '@/components/Toast';
import { SkeletonList } from '@/components/Skeleton';

const WEEK_DAYS = [
  { id: 0, label: 'الأحد', icon: '☀️' },
  { id: 1, label: 'الإثنين', icon: '🌤️' },
  { id: 2, label: 'الثلاثاء', icon: '☀️' },
  { id: 3, label: 'الأربعاء', icon: '⛅' },
  { id: 4, label: 'الخميس', icon: '🌤️' },
  { id: 5, label: 'الجمعة', icon: '🕌' },
  { id: 6, label: 'السبت', icon: '🌙' },
];

export default function DoctorSchedulesPage() {
  const router = useRouter();
  const { user, loading: userLoading, isOwner, dataOwnerName } = useCurrentUser();
  const { success, error: tE } = useToast();
  const [schedules, setSchedules] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (userLoading) return;
    if (!user) { router.replace('/login'); return; }
    load();
  }, [user, userLoading]);

  async function load() {
    if (!supabase || !dataOwnerName) { setLoading(false); return; }
    try {
      const { data } = await supabase.from('doctor_schedules').select('*').eq('entity_name', dataOwnerName);
      const map = {};
      (data || []).forEach(s => { map[s.day_of_week || s.weekday] = s; });
      setSchedules(map);
    } catch (e) { tE('تعذّر التحميل'); }
    setLoading(false);
  }

  function toggleDay(dayId) {
    if (schedules[dayId]) {
      const copy = { ...schedules };
      delete copy[dayId];
      setSchedules(copy);
    } else {
      setSchedules({ ...schedules, [dayId]: { start_time: '09:00', end_time: '17:00', slot_duration: 30 } });
    }
  }

  function updateDay(dayId, field, value) {
    setSchedules({
      ...schedules,
      [dayId]: { ...schedules[dayId], [field]: value }
    });
  }

  async function saveAll() {
    setSaving(true);
    try {
      // مسح الجدول القديم
      await supabase.from('doctor_schedules').delete().eq('entity_name', dataOwnerName);

      // إضافة الجديد
      const toInsert = Object.keys(schedules).map(dayId => ({
        entity_name: dataOwnerName,
        day_of_week: parseInt(dayId),
        weekday: parseInt(dayId),
        start_time: schedules[dayId].start_time,
        end_time: schedules[dayId].end_time,
        slot_duration: parseInt(schedules[dayId].slot_duration) || 30,
      }));

      if (toInsert.length > 0) {
        const { error } = await supabase.from('doctor_schedules').insert(toInsert);
        if (error) throw error;
      }
      success('✅ تم حفظ الجدول بنجاح');
    } catch (e) { tE('تعذّر: ' + e.message); }
    setSaving(false);
  }

  if (userLoading || loading) return <div style={{ padding: 16, background: '#f8fafc', minHeight: '100vh' }}><SkeletonList count={4} /></div>;

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', paddingBottom: 80 }}>
      <div style={{ position: 'sticky', top: 0, zIndex: 10, background: '#dc2626', padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <Link href="/merchant" style={{ color: '#fff', textDecoration: 'none', fontSize: 20, width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,.15)', borderRadius: '50%' }}>→</Link>
        <div style={{ flex: 1, color: '#fff', fontSize: 16, fontWeight: 900 }}>🕐 جدول العمل</div>
        <button onClick={saveAll} disabled={saving} style={{ background: '#fff', color: '#dc2626', border: 'none', padding: '8px 14px', borderRadius: 10, fontSize: 12, fontWeight: 900, cursor: saving ? 'not-allowed' : 'pointer', fontFamily: 'inherit' }}>{saving ? '...' : 'حفظ'}</button>
      </div>

      <div style={{ padding: 16 }}>
        <div style={{ background: 'rgba(220,38,38,.1)', border: '1px solid rgba(220,38,38,.2)', borderRadius: 12, padding: 12, marginBottom: 16, fontSize: 12, color: '#991b1b', lineHeight: 1.6 }}>
          💡 قم بتفعيل الأيام التي تعمل بها وحدد ساعات الدوام. سيتم تقسيم الوقت إلى فترات (مواعيد) بناءً على مدة الجلسة.
        </div>

        {WEEK_DAYS.map(day => {
          const isActive = !!schedules[day.id];
          const sch = schedules[day.id] || {};
          return (
            <div key={day.id} style={{ background: '#fff', borderRadius: 14, padding: 14, marginBottom: 10, border: `1px solid ${isActive ? '#dc2626' : '#e5e7eb'}`, opacity: isActive ? 1 : 0.7 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: isActive ? 12 : 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 20 }}>{day.icon}</span>
                  <span style={{ fontSize: 14, fontWeight: 900, color: '#0f172a' }}>{day.label}</span>
                </div>
                <button onClick={() => toggleDay(day.id)} style={{
                  width: 48, height: 28, borderRadius: 14, border: 'none',
                  background: isActive ? '#dc2626' : '#cbd5e1',
                  position: 'relative', cursor: 'pointer', transition: 'background .2s',
                }}>
                  <div style={{ position: 'absolute', top: 3, left: isActive ? 23 : 3, width: 22, height: 22, borderRadius: '50%', background: '#fff', transition: 'left .2s' }} />
                </button>
              </div>

              {isActive && (
                <div style={{ paddingTop: 12, borderTop: '1px dashed #e5e7eb', display: 'grid', gap: 10 }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                    <div>
                      <label style={{ display: 'block', fontSize: 11, color: '#64748b', fontWeight: 700, marginBottom: 4 }}>من الساعة</label>
                      <input type="time" value={sch.start_time || '09:00'} onChange={(e) => updateDay(day.id, 'start_time', e.target.value)} style={{ width: '100%', padding: 10, border: '1px solid #e5e7eb', borderRadius: 8, fontSize: 13, fontFamily: 'inherit', boxSizing: 'border-box' }} />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: 11, color: '#64748b', fontWeight: 700, marginBottom: 4 }}>إلى الساعة</label>
                      <input type="time" value={sch.end_time || '17:00'} onChange={(e) => updateDay(day.id, 'end_time', e.target.value)} style={{ width: '100%', padding: 10, border: '1px solid #e5e7eb', borderRadius: 8, fontSize: 13, fontFamily: 'inherit', boxSizing: 'border-box' }} />
                    </div>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 11, color: '#64748b', fontWeight: 700, marginBottom: 4 }}>مدة الجلسة (دقيقة)</label>
                    <select value={sch.slot_duration || 30} onChange={(e) => updateDay(day.id, 'slot_duration', e.target.value)} style={{ width: '100%', padding: 10, border: '1px solid #e5e7eb', borderRadius: 8, fontSize: 13, fontFamily: 'inherit', boxSizing: 'border-box' }}>
                      <option value="15">15 دقيقة</option>
                      <option value="20">20 دقيقة</option>
                      <option value="30">30 دقيقة</option>
                      <option value="45">45 دقيقة</option>
                      <option value="60">60 دقيقة</option>
                    </select>
                  </div>
                </div>
              )}
            </div>
          );
        })}

        <button onClick={saveAll} disabled={saving} style={{ width: '100%', marginTop: 10, padding: 16, background: 'linear-gradient(135deg,#dc2626,#991b1b)', color: '#fff', border: 'none', borderRadius: 12, fontSize: 15, fontWeight: 900, cursor: saving ? 'not-allowed' : 'pointer', fontFamily: 'inherit', boxShadow: '0 8px 24px rgba(220,38,38,.3)' }}>
          {saving ? '... جارٍ الحفظ' : '✓ حفظ الجدول'}
        </button>
      </div>
    </div>
  );
}
