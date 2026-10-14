'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

const STATUSES = [
  { k: 'present', l: '✅ حاضر', color: '#16a34a' },
  { k: 'absent', l: '❌ غائب', color: '#dc2626' },
  { k: 'late', l: '⏰ متأخر', color: '#f59e0b' },
  { k: 'excused', l: '📝 إذن', color: '#0891b2' },
];

export default function AttendancePage() {
  const router = useRouter();
  const [entity, setEntity] = useState(null);
  const [students, setStudents] = useState([]);
  const [classes, setClasses] = useState([]);
  const [attendance, setAttendance] = useState({});
  const [selectedClass, setSelectedClass] = useState('');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    let stored = null;
    try { stored = JSON.parse(localStorage.getItem('sanad_entity') || 'null'); } catch {}
    if (!stored) { router.replace('/login'); return; }
    setEntity(stored);
    load(stored);
  }, [router]);

  useEffect(() => {
    if (selectedClass) loadAttendance();
  }, [selectedClass, date]);

  async function load(ent) {
    if (!supabase) return;
    const [s, c] = await Promise.all([
      supabase.from('students').select('*').eq('school_name', ent.display_name).eq('is_active', true).order('full_name'),
      supabase.from('classes').select('*').eq('entity_name', ent.display_name).order('grade'),
    ]);
    setStudents(Array.isArray(s.data) ? s.data : []);
    setClasses(Array.isArray(c.data) ? c.data : []);
    setLoading(false);
  }

  async function loadAttendance() {
    if (!supabase) return;
    const { data } = await supabase
      .from('student_attendance')
      .select('*')
      .eq('class_id', selectedClass)
      .eq('attendance_date', date);
    const map = {};
    (data || []).forEach((a) => { map[a.student_id] = a; });
    setAttendance(map);
  }

  const classStudents = students.filter((s) => s.class_id === selectedClass);

  function setStatus(studentId, status) {
    setAttendance({ ...attendance, [studentId]: { ...(attendance[studentId] || {}), student_id: studentId, class_id: selectedClass, attendance_date: date, status } });
    setSaved(false);
  }

  async function save() {
    if (!selectedClass) { alert('اختر الصف أولاً'); return; }
    setSaving(true);
    const records = Object.values(attendance).map((a) => ({
      student_id: a.student_id,
      class_id: a.class_id,
      attendance_date: a.attendance_date,
      status: a.status,
      notes: a.notes || null,
    }));

    // احذف القديم لنفس اليوم
    await supabase.from('student_attendance').delete().eq('class_id', selectedClass).eq('attendance_date', date);

    if (records.length > 0) {
      const { error } = await supabase.from('student_attendance').insert(records);
      if (error) { alert('تعذّر الحفظ: ' + error.message); setSaving(false); return; }
    }
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  function markAll(status) {
    const next = { ...attendance };
    classStudents.forEach((s) => { next[s.id] = { student_id: s.id, class_id: selectedClass, attendance_date: date, status }; });
    setAttendance(next);
  }

  if (!entity || loading) return <div className="sect-empty" style={{ padding: 80 }}><span className="em">⏳</span></div>;

  const presentCount = classStudents.filter((s) => attendance[s.id]?.status === 'present').length;
  const absentCount = classStudents.filter((s) => attendance[s.id]?.status === 'absent').length;

  return (
    <div className="sect-page" style={{ paddingBottom: 120 }}>
      <div className="inv-header">
        <Link href="/merchant" className="inv-back">→</Link>
        <span className="inv-title">📋 حضور الطلاب</span>
      </div>

      <div style={{ padding: 20 }}>
        <div className="new-prod-row">
          <div className="new-service-field">
            <label className="new-service-label">الصف</label>
            <select className="new-service-select" value={selectedClass} onChange={(e) => setSelectedClass(e.target.value)}>
              <option value="">— اختر —</option>
              {classes.map((c) => (
                <option key={c.id} value={c.id}>{c.grade} {c.section || ''}</option>
              ))}
            </select>
          </div>
          <div className="new-service-field">
            <label className="new-service-label">التاريخ</label>
            <input className="new-service-input" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
        </div>

        {saved && (
          <div style={{ marginTop: 12, padding: 12, background: 'rgba(22,163,74,.1)', border: '1px solid rgba(22,163,74,.25)', borderRadius: 12, color: '#16a34a', fontSize: 13, fontWeight: 800, textAlign: 'center' }}>
            ✓ تم حفظ الحضور
          </div>
        )}
      </div>

      {selectedClass && classStudents.length > 0 && (
        <>
          <div style={{ padding: '0 20px 12px', display: 'flex', gap: 8 }}>
            <button onClick={() => markAll('present')} type="button" className="mng-btn ghost" style={{ flex: 1, fontSize: 12 }}>✅ الجميع حاضر</button>
            <button onClick={() => markAll('absent')} type="button" className="mng-btn ghost" style={{ flex: 1, fontSize: 12 }}>❌ الجميع غائب</button>
          </div>

          <div style={{ padding: '0 20px 12px', display: 'flex', gap: 10 }}>
            <div className="debt-stat" style={{ flex: 1, padding: 10 }}>
              <div className="debt-stat-val" style={{ color: '#16a34a', fontSize: 22 }}>{presentCount}</div>
              <div className="debt-stat-lbl">حاضر</div>
            </div>
            <div className="debt-stat" style={{ flex: 1, padding: 10 }}>
              <div className="debt-stat-val" style={{ color: '#dc2626', fontSize: 22 }}>{absentCount}</div>
              <div className="debt-stat-lbl">غائب</div>
            </div>
          </div>

          <div style={{ padding: '0 20px' }}>
            {classStudents.map((s) => (
              <div key={s.id} style={{ background: '#fff', borderRadius: 14, padding: 12, marginBottom: 8, border: '1px solid var(--c-200)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                  <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg, var(--f-800), var(--f-600))', color: '#fff', display: 'grid', placeItems: 'center', fontSize: 14, fontWeight: 900 }}>
                    {s.full_name.charAt(0)}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13.5, fontWeight: 800, color: 'var(--n-900)' }}>{s.full_name}</div>
                    {s.parent_phone && <div style={{ fontSize: 11, color: 'var(--n-500)' }}>{s.parent_phone}</div>}
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 4 }}>
                  {STATUSES.map((st) => {
                    const active = attendance[s.id]?.status === st.k;
                    return (
                      <button
                        key={st.k}
                        onClick={() => setStatus(s.id, st.k)}
                        type="button"
                        style={{
                          padding: 8,
                          borderRadius: 8,
                          background: active ? st.color : 'var(--c-50)',
                          color: active ? '#fff' : 'var(--n-600)',
                          border: 'none',
                          fontSize: 11,
                          fontWeight: 800,
                          cursor: 'pointer',
                        }}
                      >
                        {st.l}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, maxWidth: 680, margin: '0 auto', padding: '16px 20px calc(16px + env(safe-area-inset-bottom, 0px))', background: '#fff', borderTop: '1px solid var(--c-200)', zIndex: 40 }}>
            <button onClick={save} disabled={saving} className="new-service-submit" type="button" style={{ width: '100%' }}>
              {saving ? '... جارٍ' : saved ? '✓ تم الحفظ' : '✓ حفظ الحضور'}
            </button>
          </div>
        </>
      )}

      {selectedClass && classStudents.length === 0 && (
        <div className="sect-empty"><span className="em">👥</span><p>لا يوجد طلاب في هذا الصف</p></div>
      )}

      {!selectedClass && !loading && (
        <div className="sect-empty"><span className="em">📋</span><p>اختر الصف لعرض الطلاب</p></div>
      )}
    </div>
  );
}
