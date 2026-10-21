'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { useCurrentUser } from '@/lib/useCurrentUser';
import { useToast } from '@/components/Toast';

const DAYS = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];

export default function DoctorSchedulesPage() {
  const router = useRouter();
  const { success, error: toastError } = useToast();
  const { user, loading: userLoading, dataOwnerName } = useCurrentUser();

  const [entityId, setEntityId] = useState(null);
  const [schedules, setSchedules] = useState({});
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (userLoading) return;
    if (!user || !dataOwnerName) { setLoading(false); return; }
    const stored = JSON.parse(localStorage.getItem('sanad_entity') || 'null');
    if (stored?.parent_entity_id) setEntityId(stored.parent_entity_id);
    else if (dataOwnerName) {
      supabase.from('entities').select('id').eq('display_name', dataOwnerName).maybeSingle().then(({ data }) => { if (data) setEntityId(data.id); });
    }
    loadSchedules();
  }, [user, userLoading, dataOwnerName]);

  async function loadSchedules() {
    if (!supabase || !dataOwnerName) return;
    setLoading(true);
    try {
      const { data } = await supabase.from('doctor_schedules').select('*').eq('provider_name', dataOwnerName);
      const map = {};
      (data || []).forEach(s => { map[s.day_of_week] = s; });
      setSchedules(map);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }

  function openEdit(day) {
    const existing = schedules[day];
    setEditing({
      day,
      start_time: existing?.start_time || '09:00',
      end_time: existing?.end_time || '17:00',
      max_appointments: existing?.max_appointments || 20,
      is_open: existing?.is_open || false,
      notes: existing?.notes || '',
      id: existing?.id,
    });
  }

  async function saveSchedule() {
    if (!editing) return;
    if (editing.is_open && editing.start_time >= editing.end_time) {
      toastError('وقت البداية يجب أن يكون قبل النهاية');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        entity_id: entityId,
        provider_name: dataOwnerName,
        day_of_week: editing.day,
        start_time: editing.start_time,
        end_time: editing.end_time,
        max_appointments: Number(editing.max_appointments) || 20,
        is_open: editing.is_open,
        notes: editing.notes.trim() || null,
      };
      if (editing.id) {
        const { error } = await supabase.from('doctor_schedules').update(payload).eq('id', editing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('doctor_schedules').insert(payload);
        if (error) throw error;
      }
      success('✅ تم الحفظ');
      setEditing(null);
      loadSchedules();
    } catch (err) { console.error(err); toastError('فشل الحفظ'); }
    finally { setSaving(false); }
  }

  if (userLoading || loading) return <div style={{ padding: 80, textAlign: 'center' }}>⏳</div>;

  const openDays = Object.values(schedules).filter(s => s.is_open).length;

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', paddingBottom: 40 }}>
      <div style={{ background: '#0f4d3a', padding: '16px 20px', position: 'sticky', top: 0, zIndex: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Link href="/merchant" style={{ color: '#fff', textDecoration: 'none', fontSize: 20 }}>←</Link>
          <div style={{ flex: 1 }}>
            <h1 style={{ color: '#fff', fontSize: 18, fontWeight: 900, margin: 0 }}>📅 جدول المواعيد</h1>
            <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: 11, marginTop: 2 }}>{dataOwnerName}</div>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 6, padding: '10px 16px', background: '#fff', borderBottom: '1px solid #e2e8f0', overflowX: 'auto' }}>
        <Link href="/merchant/doctor_schedules" style={navStyle(true)}>📅 الجدول</Link>
        <Link href="/merchant/medical_records" style={navStyle(false)}>📋 السجلات</Link>
        <Link href="/merchant/prescriptions" style={navStyle(false)}>💊 الوصفات</Link>
      </div>

      <div style={{ padding: 16, maxWidth: 700, margin: '0 auto' }}>
        <div style={{ background: 'linear-gradient(135deg, #0ea5e9, #0284c7)', borderRadius: 16, padding: 20, color: '#fff', marginBottom: 16, textAlign: 'center' }}>
          <div style={{ fontSize: 40, marginBottom: 8 }}>📅</div>
          <div style={{ fontSize: 20, fontWeight: 900 }}>{openDays} / 7 أيام مفتوحة</div>
          <div style={{ fontSize: 12, opacity: 0.9, marginTop: 4 }}>اضغط على أي يوم لتعديل المواعيد</div>
        </div>

        {DAYS.map((dayName, idx) => {
          const s = schedules[idx];
          const isOpen = s?.is_open;
          return (
            <button
              key={idx}
              onClick={() => openEdit(idx)}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: 16,
                marginBottom: 8,
                background: '#fff',
                border: isOpen ? '2px solid #10b981' : '1px solid #e2e8f0',
                borderRadius: 14,
                cursor: 'pointer',
                fontFamily: 'inherit',
                textAlign: 'right',
              }}
            >
              <div style={{
                width: 44, height: 44, borderRadius: 12,
                background: isOpen ? 'rgba(16,185,129,0.1)' : '#f1f5f9',
                color: isOpen ? '#10b981' : '#94a3b8',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 20, fontWeight: 900, flexShrink: 0,
              }}>
                {isOpen ? '✓' : '×'}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 900, color: '#0f172a' }}>{dayName}</div>
                {isOpen ? (
                  <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>
                    ⏰ {s.start_time} - {s.end_time} · 👥 {s.max_appointments} موعد
                  </div>
                ) : (
                  <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 4 }}>مغلق</div>
                )}
              </div>
              <div style={{ color: '#94a3b8', fontSize: 20 }}>›</div>
            </button>
          );
        })}
      </div>

      {editing && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 100, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
          <div style={{ background: '#fff', width: '100%', maxWidth: 500, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h2 style={{ fontSize: 18, fontWeight: 900, margin: 0 }}>📅 {DAYS[editing.day]}</h2>
              <button onClick={() => setEditing(null)} style={{ background: '#f1f5f9', border: 'none', width: 32, height: 32, borderRadius: '50%', fontSize: 16, cursor: 'pointer' }}>✕</button>
            </div>

            <label style={{ display: 'flex', alignItems: 'center', gap: 10, padding: 14, background: editing.is_open ? 'rgba(16,185,129,0.08)' : '#f8fafc', border: editing.is_open ? '2px solid #10b981' : '1px solid #e2e8f0', borderRadius: 12, cursor: 'pointer', marginBottom: 16 }}>
              <input type="checkbox" checked={editing.is_open} onChange={e => setEditing({ ...editing, is_open: e.target.checked })} style={{ width: 20, height: 20 }} />
              <span style={{ fontSize: 14, fontWeight: 900, color: editing.is_open ? '#059669' : '#475569' }}>🟢 اليوم مفتوح لاستقبال المرضى</span>
            </label>

            {editing.is_open && (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
                  <div>
                    <label style={labelStyle}>وقت البداية</label>
                    <input type="time" value={editing.start_time} onChange={e => setEditing({ ...editing, start_time: e.target.value })} style={inputStyle} />
                  </div>
                  <div>
                    <label style={labelStyle}>وقت النهاية</label>
                    <input type="time" value={editing.end_time} onChange={e => setEditing({ ...editing, end_time: e.target.value })} style={inputStyle} />
                  </div>
                </div>
                <div style={{ marginBottom: 12 }}>
                  <label style={labelStyle}>الحد الأقصى للمواعيد</label>
                  <input type="number" value={editing.max_appointments} onChange={e => setEditing({ ...editing, max_appointments: e.target.value })} style={inputStyle} min={1} />
                </div>
                <div style={{ marginBottom: 12 }}>
                  <label style={labelStyle}>ملاحظات</label>
                  <input value={editing.notes} onChange={e => setEditing({ ...editing, notes: e.target.value })} style={inputStyle} placeholder="مثال: فترة استراحة 1-2 ظهراً" />
                </div>
              </>
            )}

            <button onClick={saveSchedule} disabled={saving} style={{ width: '100%', padding: 14, marginTop: 8, background: saving ? '#94a3b8' : '#0f4d3a', color: '#fff', border: 'none', borderRadius: 12, fontWeight: 900, fontSize: 15, cursor: saving ? 'wait' : 'pointer', fontFamily: 'inherit' }}>
              {saving ? '⏳ جارٍ الحفظ...' : '💾 حفظ'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function navStyle(active) {
  return { background: active ? '#0f4d3a' : '#fff', color: active ? '#fff' : '#64748b', border: active ? '1px solid #0f4d3a' : '1px solid #e2e8f0', padding: '8px 14px', borderRadius: 20, fontSize: 12, fontWeight: 900, textDecoration: 'none', whiteSpace: 'nowrap' };
}

const labelStyle = { display: 'block', fontSize: 12, fontWeight: 800, color: '#475569', marginBottom: 6 };
const inputStyle = { width: '100%', padding: '12px 14px', borderRadius: 10, border: '1px solid #cbd5e1', fontSize: 14, fontFamily: 'inherit', boxSizing: 'border-box', outline: 'none', background: '#f8fafc' };
