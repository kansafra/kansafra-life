'use client';
import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { useCurrentUser } from '@/lib/useCurrentUser';
import { useToast } from '@/components/Toast';

const GRADE_LEVELS = ['الأول', 'الثاني', 'الثالث', 'الرابع', 'الخامس', 'السادس', 'السابع', 'الثامن', 'التاسع', 'العاشر', 'الحادي عشر', 'الثاني عشر'];

export default function MerchantClassesPage() {
  const router = useRouter();
  const { success, error: toastError } = useToast();
  const { user, loading: userLoading, dataOwnerName } = useCurrentUser();

  const [entityId, setEntityId] = useState(null);
  const [classes, setClasses] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [studentCounts, setStudentCounts] = useState({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [deleting, setDeleting] = useState(null);

  const [showForm, setShowForm] = useState(false);
  const [editClass, setEditClass] = useState(null);
  const [form, setForm] = useState({ name: '', grade_level: 'الأول', teacher_id: '', room: '', schedule: '', capacity: '30', notes: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (userLoading) return;
    if (!user || !dataOwnerName) { setLoading(false); return; }
    const stored = JSON.parse(localStorage.getItem('sanad_entity') || 'null');
    if (stored?.parent_entity_id) setEntityId(stored.parent_entity_id);
    else if (dataOwnerName) {
      supabase.from('entities').select('id').eq('display_name', dataOwnerName).maybeSingle().then(({ data }) => {
        if (data) setEntityId(data.id);
      });
    }
    loadAll();
  }, [user, userLoading, dataOwnerName]);

  async function loadAll() {
    if (!supabase || !dataOwnerName) return;
    setLoading(true);
    try {
      const [cRes, tRes, sRes] = await Promise.all([
        supabase.from('classes').select('*').eq('provider_name', dataOwnerName).order('created_at', { ascending: false }),
        supabase.from('teachers').select('id, name, subject').eq('provider_name', dataOwnerName).eq('is_active', true),
        supabase.from('students').select('class_id').eq('provider_name', dataOwnerName),
      ]);
      setClasses(cRes.data || []);
      setTeachers(tRes.data || []);
      const counts = {};
      (sRes.data || []).forEach(s => { if (s.class_id) counts[s.class_id] = (counts[s.class_id] || 0) + 1; });
      setStudentCounts(counts);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }

  function openAdd() {
    setForm({ name: '', grade_level: 'الأول', teacher_id: '', room: '', schedule: '', capacity: '30', notes: '' });
    setEditClass(null);
    setShowForm(true);
  }

  function openEdit(c) {
    setForm({
      name: c.name || '', grade_level: c.grade_level || 'الأول',
      teacher_id: c.teacher_id || '', room: c.room || '', schedule: c.schedule || '',
      capacity: String(c.capacity || 30), notes: c.notes || '',
    });
    setEditClass(c);
    setShowForm(true);
  }

  async function saveClass(e) {
    e.preventDefault();
    if (!form.name.trim()) { toastError('اسم الصف مطلوب'); return; }
    setSaving(true);
    try {
      const payload = {
        entity_id: entityId, provider_name: dataOwnerName,
        name: form.name.trim(), grade_level: form.grade_level,
        teacher_id: form.teacher_id || null, room: form.room.trim() || null,
        schedule: form.schedule.trim() || null,
        capacity: Number(form.capacity) || 30, notes: form.notes.trim() || null,
        is_active: true,
      };
      if (editClass) {
        const { error } = await supabase.from('classes').update(payload).eq('id', editClass.id);
        if (error) throw error;
        success('✅ تم التعديل');
      } else {
        const { error } = await supabase.from('classes').insert(payload);
        if (error) throw error;
        success('🎉 تم إنشاء الصف');
      }
      setShowForm(false);
      loadAll();
    } catch (err) { console.error(err); toastError('فشل الحفظ'); }
    finally { setSaving(false); }
  }

  async function toggleActive(c) {
    const { error } = await supabase.from('classes').update({ is_active: !c.is_active }).eq('id', c.id);
    if (!error) {
      success(c.is_active ? '⏸️ تم التعطيل' : '✅ تم التفعيل');
      setClasses(prev => prev.map(x => x.id === c.id ? { ...x, is_active: !x.is_active } : x));
    }
  }

  async function deleteClass(c) {
    if (!confirm(`حذف الصف "${c.name}"؟ سيتم فصل الطلاب عنه.`)) return;
    setDeleting(c.id);
    await supabase.from('students').update({ class_id: null }).eq('class_id', c.id);
    const { error } = await supabase.from('classes').delete().eq('id', c.id);
    if (!error) { success('🗑️ تم الحذف'); setClasses(prev => prev.filter(x => x.id !== c.id)); }
    setDeleting(null);
  }

  const filtered = useMemo(() => {
    if (!search.trim()) return classes;
    const q = search.trim().toLowerCase();
    return classes.filter(c => (c.name || '').toLowerCase().includes(q) || (c.grade_level || '').toLowerCase().includes(q));
  }, [classes, search]);

  const stats = useMemo(() => ({
    total: classes.length,
    active: classes.filter(c => c.is_active).length,
    totalStudents: Object.values(studentCounts).reduce((a, b) => a + b, 0),
  }), [classes, studentCounts]);

  function getTeacherName(id) {
    if (!id) return null;
    return teachers.find(t => t.id === id)?.name || null;
  }

  if (userLoading || loading) return <div style={{ padding: 80, textAlign: 'center' }}>⏳</div>;

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', paddingBottom: 100 }}>
      <div style={{ background: '#0f4d3a', padding: '16px 20px', position: 'sticky', top: 0, zIndex: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
          <Link href="/merchant" style={{ color: '#fff', textDecoration: 'none', fontSize: 20 }}>←</Link>
          <div style={{ flex: 1 }}>
            <h1 style={{ color: '#fff', fontSize: 18, fontWeight: 900, margin: 0 }}>📚 الصفوف</h1>
            <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: 11, marginTop: 2 }}>{dataOwnerName}</div>
          </div>
          <button onClick={openAdd} style={{ background: '#fbbf24', color: '#0f4d3a', border: 'none', padding: '8px 14px', borderRadius: 10, fontSize: 12, fontWeight: 900, cursor: 'pointer', fontFamily: 'inherit' }}>+ جديد</button>
        </div>
        <input type="search" placeholder="🔍 ابحث في الصفوف..." value={search} onChange={e => setSearch(e.target.value)} style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: 'none', fontSize: 13, outline: 'none', boxSizing: 'border-box', background: 'rgba(255,255,255,0.95)' }} />
      </div>

      <div style={{ display: 'flex', gap: 6, padding: '10px 16px', background: '#fff', borderBottom: '1px solid #e2e8f0', overflowX: 'auto' }}>
        <Link href="/merchant/teachers" style={navStyle(false)}>👨‍🏫 المعلمون</Link>
        <Link href="/merchant/classes" style={navStyle(true)}>📚 الصفوف</Link>
        <Link href="/merchant/students" style={navStyle(false)}>👨‍🎓 الطلاب</Link>
        <Link href="/merchant/grades" style={navStyle(false)}>📊 العلامات</Link>
      </div>

      <div style={{ padding: 16, maxWidth: 800, margin: '0 auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 16 }}>
          <StatBox label="الصفوف" value={stats.total} color="#0f4d3a" />
          <StatBox label="نشطة" value={stats.active} color="#10b981" />
          <StatBox label="الطلاب" value={stats.totalStudents} color="#8b5cf6" />
        </div>

        {filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 40, background: '#fff', borderRadius: 16, color: '#64748b' }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>📚</div>
            <div style={{ fontSize: 15, fontWeight: 900, marginBottom: 8 }}>{classes.length === 0 ? 'لم تنشئ صفوفاً بعد' : 'لا نتائج'}</div>
            {classes.length === 0 && (
              <button onClick={openAdd} style={{ background: '#0f4d3a', color: '#fff', padding: '10px 20px', borderRadius: 10, border: 'none', fontSize: 13, fontWeight: 900, cursor: 'pointer', fontFamily: 'inherit' }}>+ أضف أول صف</button>
            )}
          </div>
        ) : filtered.map(c => {
          const studentCount = studentCounts[c.id] || 0;
          const teacherName = getTeacherName(c.teacher_id);
          const fillPercent = c.capacity ? Math.round((studentCount / c.capacity) * 100) : 0;
          return (
            <div key={c.id} style={{ background: '#fff', borderRadius: 14, padding: 14, marginBottom: 10, border: '1px solid #e2e8f0', opacity: c.is_active ? 1 : 0.6 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 15, fontWeight: 900, color: '#0f172a', marginBottom: 4 }}>{c.name}</div>
                  <div style={{ fontSize: 11, color: '#64748b' }}>🎓 {c.grade_level}</div>
                  {teacherName && <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>👨‍🏫 {teacherName}</div>}
                  {c.room && <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>🚪 {c.room}</div>}
                  {c.schedule && <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>⏰ {c.schedule}</div>}
                </div>
                <div style={{ background: 'rgba(139,92,246,0.1)', color: '#8b5cf6', padding: '4px 10px', borderRadius: 8, fontSize: 11, fontWeight: 900, whiteSpace: 'nowrap' }}>
                  {studentCount} / {c.capacity}
                </div>
              </div>
              <div style={{ height: 6, background: '#f1f5f9', borderRadius: 3, marginBottom: 10, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${Math.min(fillPercent, 100)}%`, background: fillPercent >= 100 ? '#ef4444' : '#10b981', borderRadius: 3, transition: 'width 0.3s' }} />
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                <button onClick={() => openEdit(c)} style={btnStyle('rgba(14,165,233,0.1)', '#0284c7')}>✏️</button>
                <Link href={`/merchant/students?class=${c.id}`} style={{ ...btnStyle('rgba(139,92,246,0.1)', '#8b5cf6'), textAlign: 'center', textDecoration: 'none' }}>👥</Link>
                <button onClick={() => toggleActive(c)} style={btnStyle(c.is_active ? 'rgba(245,158,11,0.1)' : 'rgba(16,185,129,0.1)', c.is_active ? '#f59e0b' : '#10b981')}>{c.is_active ? '⏸️' : '✅'}</button>
                <button onClick={() => deleteClass(c)} disabled={deleting === c.id} style={btnStyle('rgba(239,68,68,0.1)', '#ef4444')}>{deleting === c.id ? '⏳' : '🗑️'}</button>
              </div>
            </div>
          );
        })}
      </div>

      {showForm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 100, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
          <div style={{ background: '#fff', width: '100%', maxWidth: 500, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h2 style={{ fontSize: 18, fontWeight: 900, margin: 0 }}>{editClass ? '✏️ تعديل صف' : '📚 صف جديد'}</h2>
              <button onClick={() => setShowForm(false)} style={{ background: '#f1f5f9', border: 'none', width: 32, height: 32, borderRadius: '50%', fontSize: 16, cursor: 'pointer' }}>✕</button>
            </div>
            <form onSubmit={saveClass}>
              <div style={{ marginBottom: 12 }}>
                <label style={labelStyle}>اسم الصف *</label>
                <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required style={inputStyle} placeholder="مثال: الأول أ" />
              </div>
              <div style={{ marginBottom: 12 }}>
                <label style={labelStyle}>المستوى</label>
                <select value={form.grade_level} onChange={e => setForm({ ...form, grade_level: e.target.value })} style={inputStyle}>
                  {GRADE_LEVELS.map(g => <option key={g} value={g}>{g}</option>)}
                </select>
              </div>
              <div style={{ marginBottom: 12 }}>
                <label style={labelStyle}>المعلم المسؤول</label>
                <select value={form.teacher_id} onChange={e => setForm({ ...form, teacher_id: e.target.value })} style={inputStyle}>
                  <option value="">— بدون معلم —</option>
                  {teachers.map(t => <option key={t.id} value={t.id}>{t.name} {t.subject ? `(${t.subject})` : ''}</option>)}
                </select>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
                <div>
                  <label style={labelStyle}>القاعة</label>
                  <input value={form.room} onChange={e => setForm({ ...form, room: e.target.value })} style={inputStyle} placeholder="A1" />
                </div>
                <div>
                  <label style={labelStyle}>السعة</label>
                  <input type="number" value={form.capacity} onChange={e => setForm({ ...form, capacity: e.target.value })} style={inputStyle} min={1} />
                </div>
              </div>
              <div style={{ marginBottom: 12 }}>
                <label style={labelStyle}>التوقيت</label>
                <input value={form.schedule} onChange={e => setForm({ ...form, schedule: e.target.value })} style={inputStyle} placeholder="8:00 - 12:00" />
              </div>
              <div style={{ marginBottom: 20 }}>
                <label style={labelStyle}>ملاحظات</label>
                <textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} style={{ ...inputStyle, height: 60, resize: 'none' }} />
              </div>
              <button type="submit" disabled={saving} style={{ width: '100%', padding: 14, background: saving ? '#94a3b8' : '#0f4d3a', color: '#fff', border: 'none', borderRadius: 10, fontWeight: 900, fontSize: 15, cursor: saving ? 'wait' : 'pointer', fontFamily: 'inherit' }}>
                {saving ? '⏳ جارٍ الحفظ...' : (editClass ? '💾 حفظ' : '➕ إنشاء')}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function StatBox({ label, value, color }) {
  return (
    <div style={{ background: '#fff', borderRadius: 12, padding: 12, textAlign: 'center', border: '1px solid #e2e8f0' }}>
      <div style={{ fontSize: 18, fontWeight: 900, color, marginBottom: 2 }}>{value}</div>
      <div style={{ fontSize: 9.5, color: '#64748b', fontWeight: 800 }}>{label}</div>
    </div>
  );
}

function navStyle(active) {
  return { background: active ? '#0f4d3a' : '#fff', color: active ? '#fff' : '#64748b', border: active ? '1px solid #0f4d3a' : '1px solid #e2e8f0', padding: '8px 14px', borderRadius: 20, fontSize: 12, fontWeight: 900, textDecoration: 'none', whiteSpace: 'nowrap' };
}

const btnStyle = (bg, color) => ({ flex: 1, padding: 10, background: bg, color, border: 'none', borderRadius: 8, fontSize: 12, fontWeight: 900, cursor: 'pointer', fontFamily: 'inherit' });
const labelStyle = { display: 'block', fontSize: 12, fontWeight: 800, color: '#475569', marginBottom: 6 };
const inputStyle = { width: '100%', padding: '12px 14px', borderRadius: 10, border: '1px solid #cbd5e1', fontSize: 14, fontFamily: 'inherit', boxSizing: 'border-box', outline: 'none', background: '#f8fafc' };
