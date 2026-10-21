'use client';
import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { useCurrentUser } from '@/lib/useCurrentUser';
import { useToast } from '@/components/Toast';

const EXAM_TYPES = [
  { key: 'monthly', label: 'شهري' },
  { key: 'midterm', label: 'نصفي' },
  { key: 'final', label: 'نهائي' },
  { key: 'quiz', label: 'اختبار قصير' },
];

export default function MerchantGradesPage() {
  const router = useRouter();
  const { success, error: toastError } = useToast();
  const { user, loading: userLoading, dataOwnerName } = useCurrentUser();

  const [entityId, setEntityId] = useState(null);
  const [grades, setGrades] = useState([]);
  const [students, setStudents] = useState([]);
  const [classes, setClasses] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [classFilter, setClassFilter] = useState('all');
  const [deleting, setDeleting] = useState(null);

  const [showForm, setShowForm] = useState(false);
  const [editGrade, setEditGrade] = useState(null);
  const [form, setForm] = useState({ student_id: '', class_id: '', teacher_id: '', subject: '', exam_type: 'monthly', grade: '', max_grade: '100', exam_date: new Date().toISOString().split('T')[0], notes: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (userLoading) return;
    if (!user || !dataOwnerName) { setLoading(false); return; }
    const stored = JSON.parse(localStorage.getItem('sanad_entity') || 'null');
    if (stored?.parent_entity_id) setEntityId(stored.parent_entity_id);
    else if (dataOwnerName) {
      supabase.from('entities').select('id').eq('display_name', dataOwnerName).maybeSingle().then(({ data }) => { if (data) setEntityId(data.id); });
    }
    loadAll();
  }, [user, userLoading, dataOwnerName]);

  async function loadAll() {
    if (!supabase || !dataOwnerName) return;
    setLoading(true);
    try {
      const [gRes, sRes, cRes, tRes] = await Promise.all([
        supabase.from('grades').select('*').eq('provider_name', dataOwnerName).order('created_at', { ascending: false }),
        supabase.from('students').select('id, name, class_id').eq('provider_name', dataOwnerName),
        supabase.from('classes').select('id, name').eq('provider_name', dataOwnerName),
        supabase.from('teachers').select('id, name').eq('provider_name', dataOwnerName),
      ]);
      setGrades(gRes.data || []);
      setStudents(sRes.data || []);
      setClasses(cRes.data || []);
      setTeachers(tRes.data || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }

  function openAdd() {
    setForm({ student_id: '', class_id: '', teacher_id: '', subject: '', exam_type: 'monthly', grade: '', max_grade: '100', exam_date: new Date().toISOString().split('T')[0], notes: '' });
    setEditGrade(null);
    setShowForm(true);
  }

  function openEdit(g) {
    setForm({
      student_id: g.student_id || '', class_id: g.class_id || '', teacher_id: g.teacher_id || '',
      subject: g.subject || '', exam_type: g.exam_type || 'monthly', grade: String(g.grade || ''),
      max_grade: String(g.max_grade || 100), exam_date: g.exam_date || '', notes: g.notes || '',
    });
    setEditGrade(g);
    setShowForm(true);
  }

  async function saveGrade(e) {
    e.preventDefault();
    if (!form.student_id) { toastError('اختر الطالب'); return; }
    if (!form.subject.trim()) { toastError('المادة مطلوبة'); return; }
    if (!form.grade || Number(form.grade) < 0) { toastError('الدرجة مطلوبة'); return; }
    setSaving(true);
    try {
      const payload = {
        entity_id: entityId, provider_name: dataOwnerName,
        student_id: form.student_id, class_id: form.class_id || null,
        teacher_id: form.teacher_id || null, subject: form.subject.trim(),
        exam_type: form.exam_type, grade: Number(form.grade),
        max_grade: Number(form.max_grade) || 100,
        exam_date: form.exam_date || null, notes: form.notes.trim() || null,
      };
      if (editGrade) {
        const { error } = await supabase.from('grades').update(payload).eq('id', editGrade.id);
        if (error) throw error;
        success('✅ تم التعديل');
      } else {
        const { error } = await supabase.from('grades').insert(payload);
        if (error) throw error;
        success('🎉 تم تسجيل الدرجة');
      }
      setShowForm(false);
      loadAll();
    } catch (err) { console.error(err); toastError('فشل الحفظ'); }
    finally { setSaving(false); }
  }

  async function deleteGrade(g) {
    if (!confirm('حذف الدرجة؟')) return;
    setDeleting(g.id);
    const { error } = await supabase.from('grades').delete().eq('id', g.id);
    if (!error) { success('🗑️ تم الحذف'); setGrades(prev => prev.filter(x => x.id !== g.id)); }
    setDeleting(null);
  }

  const filtered = useMemo(() => {
    let list = grades;
    if (classFilter !== 'all') list = list.filter(g => g.class_id === classFilter);
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(g => {
        const student = students.find(s => s.id === g.student_id);
        return (student?.name || '').toLowerCase().includes(q) || (g.subject || '').toLowerCase().includes(q);
      });
    }
    return list;
  }, [grades, classFilter, search, students]);

  const stats = useMemo(() => {
    const total = grades.length;
    const avg = total > 0 ? (grades.reduce((s, g) => s + (Number(g.grade) / Number(g.max_grade) * 100), 0) / total).toFixed(1) : 0;
    const studentsWithGrades = new Set(grades.map(g => g.student_id)).size;
    return { total, avg, studentsWithGrades };
  }, [grades]);

  function getStudentName(id) { return students.find(s => s.id === id)?.name || '—'; }
  function getClassName(id) { return classes.find(c => c.id === id)?.name || null; }
  function getExamLabel(key) { return EXAM_TYPES.find(e => e.key === key)?.label || key; }

  if (userLoading || loading) return <div style={{ padding: 80, textAlign: 'center' }}>⏳</div>;

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', paddingBottom: 100 }}>
      <div style={{ background: '#0f4d3a', padding: '16px 20px', position: 'sticky', top: 0, zIndex: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
          <Link href="/merchant" style={{ color: '#fff', textDecoration: 'none', fontSize: 20 }}>←</Link>
          <div style={{ flex: 1 }}>
            <h1 style={{ color: '#fff', fontSize: 18, fontWeight: 900, margin: 0 }}>📊 العلامات</h1>
            <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: 11, marginTop: 2 }}>{dataOwnerName}</div>
          </div>
          <button onClick={openAdd} style={{ background: '#fbbf24', color: '#0f4d3a', border: 'none', padding: '8px 14px', borderRadius: 10, fontSize: 12, fontWeight: 900, cursor: 'pointer', fontFamily: 'inherit' }}>+ جديد</button>
        </div>
        <input type="search" placeholder="🔍 ابحث بالطالب أو المادة..." value={search} onChange={e => setSearch(e.target.value)} style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: 'none', fontSize: 13, outline: 'none', boxSizing: 'border-box', background: 'rgba(255,255,255,0.95)' }} />
        {classes.length > 0 && (
          <select value={classFilter} onChange={e => setClassFilter(e.target.value)} style={{ width: '100%', marginTop: 8, padding: '8px 12px', borderRadius: 10, border: 'none', fontSize: 12, outline: 'none', background: 'rgba(255,255,255,0.95)', fontWeight: 800 }}>
            <option value="all">كل الصفوف</option>
            {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        )}
      </div>

      <div style={{ display: 'flex', gap: 6, padding: '10px 16px', background: '#fff', borderBottom: '1px solid #e2e8f0', overflowX: 'auto' }}>
        <Link href="/merchant/teachers" style={navStyle(false)}>👨‍🏫 المعلمون</Link>
        <Link href="/merchant/classes" style={navStyle(false)}>📚 الصفوف</Link>
        <Link href="/merchant/students" style={navStyle(false)}>👨‍🎓 الطلاب</Link>
        <Link href="/merchant/grades" style={navStyle(true)}>📊 العلامات</Link>
      </div>

      <div style={{ padding: 16, maxWidth: 800, margin: '0 auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 16 }}>
          <StatBox label="العلامات" value={stats.total} color="#0f4d3a" />
          <StatBox label="المتوسط" value={`${stats.avg}%`} color="#8b5cf6" />
          <StatBox label="الطلاب" value={stats.studentsWithGrades} color="#10b981" />
        </div>

        {filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 40, background: '#fff', borderRadius: 16, color: '#64748b' }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>📊</div>
            <div style={{ fontSize: 15, fontWeight: 900, marginBottom: 8 }}>{grades.length === 0 ? 'لم تسجل علامات بعد' : 'لا نتائج'}</div>
            {grades.length === 0 && (
              <button onClick={openAdd} style={{ background: '#0f4d3a', color: '#fff', padding: '10px 20px', borderRadius: 10, border: 'none', fontSize: 13, fontWeight: 900, cursor: 'pointer', fontFamily: 'inherit' }}>+ سجّل أول علامة</button>
            )}
          </div>
        ) : filtered.map(g => {
          const percent = Math.round((Number(g.grade) / Number(g.max_grade)) * 100);
          const color = percent >= 85 ? '#10b981' : percent >= 60 ? '#f59e0b' : '#ef4444';
          return (
            <div key={g.id} style={{ background: '#fff', borderRadius: 14, padding: 14, marginBottom: 10, border: '1px solid #e2e8f0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 900, color: '#0f172a' }}>👨‍🎓 {getStudentName(g.student_id)}</div>
                  <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>
                    📚 {g.subject} · {getExamLabel(g.exam_type)}
                    {getClassName(g.class_id) && ` · ${getClassName(g.class_id)}`}
                  </div>
                  {g.exam_date && <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 2 }}>📅 {new Date(g.exam_date).toLocaleDateString('ar-SY')}</div>}
                </div>
                <div style={{ background: `${color}15`, color, padding: '6px 12px', borderRadius: 10, textAlign: 'center', flexShrink: 0 }}>
                  <div style={{ fontSize: 18, fontWeight: 900 }}>{Number(g.grade).toFixed(0)}</div>
                  <div style={{ fontSize: 9, fontWeight: 900 }}>من {Number(g.max_grade)}</div>
                </div>
              </div>
              <div style={{ height: 6, background: '#f1f5f9', borderRadius: 3, marginBottom: 10, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${Math.min(percent, 100)}%`, background: color, borderRadius: 3 }} />
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                <button onClick={() => openEdit(g)} style={btnStyle('rgba(14,165,233,0.1)', '#0284c7')}>✏️ تعديل</button>
                <button onClick={() => deleteGrade(g)} disabled={deleting === g.id} style={btnStyle('rgba(239,68,68,0.1)', '#ef4444')}>{deleting === g.id ? '⏳' : '🗑️'}</button>
              </div>
            </div>
          );
        })}
      </div>

      {showForm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 100, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
          <div style={{ background: '#fff', width: '100%', maxWidth: 500, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h2 style={{ fontSize: 18, fontWeight: 900, margin: 0 }}>{editGrade ? '✏️ تعديل' : '📊 علامة جديدة'}</h2>
              <button onClick={() => setShowForm(false)} style={{ background: '#f1f5f9', border: 'none', width: 32, height: 32, borderRadius: '50%', fontSize: 16, cursor: 'pointer' }}>✕</button>
            </div>
            <form onSubmit={saveGrade}>
              <div style={{ marginBottom: 12 }}>
                <label style={labelStyle}>الطالب *</label>
                <select value={form.student_id} onChange={e => setForm({ ...form, student_id: e.target.value })} required style={inputStyle}>
                  <option value="">— اختر طالباً —</option>
                  {students.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 12 }}>
                <div>
                  <label style={labelStyle}>الصف</label>
                  <select value={form.class_id} onChange={e => setForm({ ...form, class_id: e.target.value })} style={inputStyle}>
                    <option value="">— بدون —</option>
                    {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>المعلم</label>
                  <select value={form.teacher_id} onChange={e => setForm({ ...form, teacher_id: e.target.value })} style={inputStyle}>
                    <option value="">— بدون —</option>
                    {teachers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                  </select>
                </div>
              </div>
              <div style={{ marginBottom: 12 }}>
                <label style={labelStyle}>المادة *</label>
                <input value={form.subject} onChange={e => setForm({ ...form, subject: e.target.value })} required style={inputStyle} placeholder="رياضيات..." />
              </div>
              <div style={{ marginBottom: 12 }}>
                <label style={labelStyle}>نوع الامتحان</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 6 }}>
                  {EXAM_TYPES.map(e => (
                    <button key={e.key} type="button" onClick={() => setForm({ ...form, exam_type: e.key })} style={{ padding: 10, background: form.exam_type === e.key ? 'rgba(16,185,129,0.1)' : '#f8fafc', color: form.exam_type === e.key ? '#059669' : '#475569', border: form.exam_type === e.key ? '2px solid #10b981' : '1px solid #e2e8f0', borderRadius: 8, fontSize: 12, fontWeight: 900, cursor: 'pointer', fontFamily: 'inherit' }}>{e.label}</button>
                  ))}
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 12 }}>
                <div>
                  <label style={labelStyle}>الدرجة *</label>
                  <input type="number" value={form.grade} onChange={e => setForm({ ...form, grade: e.target.value })} required style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>من</label>
                  <input type="number" value={form.max_grade} onChange={e => setForm({ ...form, max_grade: e.target.value })} style={inputStyle} />
                </div>
              </div>
              <div style={{ marginBottom: 12 }}>
                <label style={labelStyle}>التاريخ</label>
                <input type="date" value={form.exam_date} onChange={e => setForm({ ...form, exam_date: e.target.value })} style={inputStyle} />
              </div>
              <div style={{ marginBottom: 20 }}>
                <label style={labelStyle}>ملاحظات</label>
                <textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} style={{ ...inputStyle, height: 60, resize: 'none' }} />
              </div>
              <button type="submit" disabled={saving} style={{ width: '100%', padding: 14, background: saving ? '#94a3b8' : '#0f4d3a', color: '#fff', border: 'none', borderRadius: 10, fontWeight: 900, fontSize: 15, cursor: saving ? 'wait' : 'pointer', fontFamily: 'inherit' }}>
                {saving ? '⏳ جارٍ الحفظ...' : (editGrade ? '💾 حفظ' : '➕ تسجيل')}
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
