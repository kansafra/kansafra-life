'use client';
import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { useCurrentUser } from '@/lib/useCurrentUser';
import { useToast } from '@/components/Toast';
import { SkeletonList } from '@/components/Skeleton';
import EmptyState from '@/components/EmptyState';

const EXAM_TYPES = ['شهري', 'نصفي', 'نهائي', 'واجب', 'مشروع'];

export default function GradesPage() {
  const router = useRouter();
  const { user, loading: uL, dataOwnerName } = useCurrentUser();
  const { success, error: tE } = useToast();
  const [grades, setGrades] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (uL) return;
    if (!user) { router.replace('/login'); return; }
    load();
  }, [user, uL]);

  async function load() {
    if (!supabase || !dataOwnerName) { setLoading(false); return; }
    try {
      const [gRes, sRes] = await Promise.all([
        supabase.from('grades').select('*').eq('entity_name', dataOwnerName).order('created_at', { ascending: false }),
        supabase.from('students').select('id, name, class_name').eq('entity_name', dataOwnerName),
      ]);
      setGrades(gRes.data || []);
      setStudents(sRes.data || []);
    } catch (e) { tE('تعذّر التحميل'); }
    setLoading(false);
  }

  const filtered = useMemo(() => {
    if (!search.trim()) return grades;
    const q = search.trim().toLowerCase();
    return grades.filter(g =>
      (g.student_name || '').toLowerCase().includes(q) ||
      (g.subject || '').toLowerCase().includes(q) ||
      (g.class_name || '').toLowerCase().includes(q)
    );
  }, [grades, search]);

  const stats = useMemo(() => {
    const subjects = new Set(grades.map(g => g.subject));
    const avgScore = grades.length > 0 ? grades.reduce((s, g) => s + (Number(g.score) / Number(g.max_score) * 100), 0) / grades.length : 0;
    return { total: grades.length, subjects: subjects.size, avg: avgScore.toFixed(1) };
  }, [grades]);

  function openAdd() {
    setForm({ student_name: '', class_name: '', subject: '', exam_type: 'شهري', score: '', max_score: 100, exam_date: new Date().toISOString().slice(0, 10), notes: '' });
    setModal('add');
  }

  function openEdit(g) {
    setForm({ ...g, exam_date: g.exam_date || '' });
    setModal('edit');
  }

  async function save() {
    if (!form.student_name?.trim()) { tE('اسم الطالب مطلوب'); return; }
    if (!form.subject?.trim()) { tE('المادة مطلوبة'); return; }
    if (!form.score && form.score !== 0) { tE('الدرجة مطلوبة'); return; }

    setSaving(true);
    try {
      const payload = {
        entity_name: dataOwnerName,
        student_name: form.student_name.trim(),
        class_name: form.class_name?.trim() || null,
        subject: form.subject.trim(),
        exam_type: form.exam_type || 'شهري',
        score: Number(form.score),
        max_score: Number(form.max_score) || 100,
        exam_date: form.exam_date || null,
        notes: form.notes?.trim() || null,
      };
      let err;
      if (modal === 'edit') ({ error: err } = await supabase.from('grades').update(payload).eq('id', form.id));
      else ({ error: err } = await supabase.from('grades').insert(payload));
      if (err) throw err;
      success(modal === 'edit' ? '✅ تم التعديل' : '✅ تمت الإضافة');
      setModal(null); load();
    } catch (e) { tE('تعذّر: ' + e.message); }
    setSaving(false);
  }

  async function del(g) {
    if (!confirm(`حذف درجة ${g.student_name} في ${g.subject}؟`)) return;
    await supabase.from('grades').delete().eq('id', g.id);
    success('✅ تم الحذف'); load();
  }

  function getColor(percentage) {
    if (percentage >= 85) return { color: '#10b981', label: 'ممتاز' };
    if (percentage >= 70) return { color: '#3b82f6', label: 'جيد جداً' };
    if (percentage >= 50) return { color: '#f59e0b', label: 'جيد' };
    return { color: '#ef4444', label: 'ضعيف' };
  }

  if (uL || loading) return <div style={{ padding: 16, background: '#f8fafc', minHeight: '100vh' }}><SkeletonList count={3} /></div>;

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', paddingBottom: 80 }}>
      <div style={{ position: 'sticky', top: 0, zIndex: 10, background: '#7c3aed', padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <Link href="/merchant" style={{ color: '#fff', textDecoration: 'none', fontSize: 20, width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,.15)', borderRadius: '50%' }}>→</Link>
        <div style={{ flex: 1 }}>
          <div style={{ color: '#fff', fontSize: 16, fontWeight: 900 }}>📊 الدرجات</div>
          <div style={{ color: 'rgba(255,255,255,.8)', fontSize: 11, marginTop: 2 }}>{stats.total} درجة</div>
        </div>
        <button onClick={openAdd} style={{ background: '#fff', color: '#7c3aed', border: 'none', padding: '8px 14px', borderRadius: 10, fontSize: 12, fontWeight: 900, cursor: 'pointer', fontFamily: 'inherit' }}>+ درجة</button>
      </div>

      <div style={{ padding: 16, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
        <div style={{ background: '#fff', borderRadius: 12, padding: 12, textAlign: 'center', border: '1px solid #e5e7eb' }}>
          <div style={{ fontSize: 10, color: '#64748b', fontWeight: 700, marginBottom: 4 }}>إجمالي</div>
          <div style={{ fontSize: 18, fontWeight: 900, color: '#7c3aed' }}>{stats.total}</div>
        </div>
        <div style={{ background: '#fff', borderRadius: 12, padding: 12, textAlign: 'center', border: '1px solid #e5e7eb' }}>
          <div style={{ fontSize: 10, color: '#64748b', fontWeight: 700, marginBottom: 4 }}>المواد</div>
          <div style={{ fontSize: 18, fontWeight: 900, color: '#3b82f6' }}>{stats.subjects}</div>
        </div>
        <div style={{ background: '#fff', borderRadius: 12, padding: 12, textAlign: 'center', border: '1px solid #e5e7eb' }}>
          <div style={{ fontSize: 10, color: '#64748b', fontWeight: 700, marginBottom: 4 }}>المتوسط</div>
          <div style={{ fontSize: 18, fontWeight: 900, color: '#10b981' }}>{stats.avg}%</div>
        </div>
      </div>

      <div style={{ padding: '0 16px 12px' }}>
        <input type="text" placeholder="🔍 ابحث بالطالب أو المادة..." value={search} onChange={(e) => setSearch(e.target.value)}
          style={{ width: '100%', padding: '12px 14px', border: '1px solid #e5e7eb', borderRadius: 12, fontSize: 13, fontFamily: 'inherit', boxSizing: 'border-box', outline: 'none', background: '#fff' }} />
      </div>

      <div style={{ padding: '0 16px' }}>
        {filtered.length === 0 ? (
          <EmptyState icon="📊" title="لا توجد درجات" description="ابدأ بإضافة درجات طلابك" actionLabel="+ درجة جديدة" onAction={openAdd} />
        ) : filtered.map(g => {
          const pct = (Number(g.score) / Number(g.max_score)) * 100;
          const info = getColor(pct);
          return (
            <div key={g.id} style={{ background: '#fff', borderRadius: 14, padding: 14, marginBottom: 10, border: '1px solid #e5e7eb' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 900, color: '#0f172a' }}>👨‍🎓 {g.student_name}</div>
                  <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>
                    📚 {g.subject} · {g.exam_type} {g.class_name && `· ${g.class_name}`}
                  </div>
                  {g.exam_date && <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 2 }}>📅 {new Date(g.exam_date).toLocaleDateString('ar-EG')}</div>}
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 20, fontWeight: 900, color: info.color }}>{g.score}<span style={{ fontSize: 12, color: '#94a3b8' }}>/{g.max_score}</span></div>
                  <div style={{ background: `${info.color}20`, color: info.color, padding: '2px 8px', borderRadius: 6, fontSize: 9, fontWeight: 900, marginTop: 4 }}>{info.label}</div>
                </div>
              </div>
              {g.notes && <div style={{ fontSize: 11.5, color: '#64748b', background: '#f8fafc', padding: 8, borderRadius: 6, marginBottom: 8 }}>{g.notes}</div>}
              <div style={{ display: 'flex', gap: 6 }}>
                <button onClick={() => openEdit(g)} style={{ flex: 1, padding: 8, background: '#f1f5f9', border: 'none', borderRadius: 8, fontSize: 11, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit' }}>✏️ تعديل</button>
                <button onClick={() => del(g)} style={{ padding: 8, background: 'rgba(220,38,38,.1)', color: '#dc2626', border: 'none', borderRadius: 8, fontSize: 11, cursor: 'pointer', fontFamily: 'inherit' }}>🗑️</button>
              </div>
            </div>
          );
        })}
      </div>

      {modal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.6)', zIndex: 100, display: 'flex', alignItems: 'flex-end' }} onClick={() => setModal(null)}>
          <div style={{ background: '#fff', borderRadius: '24px 24px 0 0', width: '100%', maxWidth: 500, margin: '0 auto', padding: '24px 20px 30px', maxHeight: '90vh', overflowY: 'auto' }} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ fontSize: 18, fontWeight: 900, marginBottom: 16 }}>{modal === 'edit' ? '✏️ تعديل درجة' : '➕ درجة جديدة'}</h3>

            <input type="text" placeholder="اسم الطالب *" value={form.student_name || ''} onChange={(e) => setForm({ ...form, student_name: e.target.value })} list="students-list" style={{ width: '100%', padding: 12, border: '1px solid #e5e7eb', borderRadius: 10, fontSize: 13, marginBottom: 10, boxSizing: 'border-box', fontFamily: 'inherit' }} />
            <datalist id="students-list">
              {students.map(s => <option key={s.id} value={s.name} />)}
            </datalist>

            <input type="text" placeholder="الصف" value={form.class_name || ''} onChange={(e) => setForm({ ...form, class_name: e.target.value })} style={{ width: '100%', padding: 12, border: '1px solid #e5e7eb', borderRadius: 10, fontSize: 13, marginBottom: 10, boxSizing: 'border-box', fontFamily: 'inherit' }} />
            <input type="text" placeholder="المادة *" value={form.subject || ''} onChange={(e) => setForm({ ...form, subject: e.target.value })} style={{ width: '100%', padding: 12, border: '1px solid #e5e7eb', borderRadius: 10, fontSize: 13, marginBottom: 10, boxSizing: 'border-box', fontFamily: 'inherit' }} />

            <select value={form.exam_type || 'شهري'} onChange={(e) => setForm({ ...form, exam_type: e.target.value })} style={{ width: '100%', padding: 12, border: '1px solid #e5e7eb', borderRadius: 10, fontSize: 13, marginBottom: 10, boxSizing: 'border-box', fontFamily: 'inherit' }}>
              {EXAM_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 10 }}>
              <input type="number" placeholder="الدرجة *" value={form.score || ''} onChange={(e) => setForm({ ...form, score: e.target.value })} style={{ padding: 12, border: '1px solid #e5e7eb', borderRadius: 10, fontSize: 13, boxSizing: 'border-box', fontFamily: 'inherit', textAlign: 'center', fontWeight: 900 }} />
              <input type="number" placeholder="من" value={form.max_score || 100} onChange={(e) => setForm({ ...form, max_score: e.target.value })} style={{ padding: 12, border: '1px solid #e5e7eb', borderRadius: 10, fontSize: 13, boxSizing: 'border-box', fontFamily: 'inherit', textAlign: 'center' }} />
            </div>

            <input type="date" value={form.exam_date || ''} onChange={(e) => setForm({ ...form, exam_date: e.target.value })} style={{ width: '100%', padding: 12, border: '1px solid #e5e7eb', borderRadius: 10, fontSize: 13, marginBottom: 10, boxSizing: 'border-box', fontFamily: 'inherit' }} />
            <textarea placeholder="ملاحظات" value={form.notes || ''} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} style={{ width: '100%', padding: 12, border: '1px solid #e5e7eb', borderRadius: 10, fontSize: 13, marginBottom: 16, boxSizing: 'border-box', fontFamily: 'inherit', resize: 'vertical' }} />

            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setModal(null)} style={{ flex: 1, padding: 12, background: '#f1f5f9', border: 'none', borderRadius: 10, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit' }}>إلغاء</button>
              <button onClick={save} disabled={saving} style={{ flex: 1, padding: 12, background: 'linear-gradient(135deg,#7c3aed,#5b21b6)', color: '#fff', border: 'none', borderRadius: 10, fontWeight: 900, cursor: saving ? 'not-allowed' : 'pointer', fontFamily: 'inherit' }}>{saving ? '...' : '✓ حفظ'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
