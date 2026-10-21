'use client';
import { useState, useEffect, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { useCurrentUser } from '@/lib/useCurrentUser';
import { useToast } from '@/components/Toast';

export default function MerchantStudentsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { success, error: toastError } = useToast();
  const { user, loading: userLoading, dataOwnerName } = useCurrentUser();

  const [entityId, setEntityId] = useState(null);
  const [students, setStudents] = useState([]);
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [classFilter, setClassFilter] = useState(searchParams.get('class') || 'all');
  const [deleting, setDeleting] = useState(null);

  const [showForm, setShowForm] = useState(false);
  const [editStudent, setEditStudent] = useState(null);
  const [form, setForm] = useState({ name: '', phone: '', parent_phone: '', class_id: '', birth_date: '', address: '', notes: '' });
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
      const [sRes, cRes] = await Promise.all([
        supabase.from('students').select('*').eq('provider_name', dataOwnerName).order('created_at', { ascending: false }),
        supabase.from('classes').select('id, name, grade_level').eq('provider_name', dataOwnerName),
      ]);
      setStudents(sRes.data || []);
      setClasses(cRes.data || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }

  function openAdd() {
    setForm({ name: '', phone: '', parent_phone: '', class_id: '', birth_date: '', address: '', notes: '' });
    setEditStudent(null);
    setShowForm(true);
  }

  function openEdit(s) {
    setForm({
      name: s.name || '', phone: s.phone || '', parent_phone: s.parent_phone || '',
      class_id: s.class_id || '', birth_date: s.birth_date || '',
      address: s.address || '', notes: s.notes || '',
    });
    setEditStudent(s);
    setShowForm(true);
  }

  async function saveStudent(e) {
    e.preventDefault();
    if (!form.name.trim()) { toastError('اسم الطالب مطلوب'); return; }
    setSaving(true);
    try {
      const payload = {
        entity_id: entityId, provider_name: dataOwnerName,
        name: form.name.trim(), phone: form.phone.trim() || null,
        parent_phone: form.parent_phone.trim() || null,
        class_id: form.class_id || null, birth_date: form.birth_date || null,
        address: form.address.trim() || null, notes: form.notes.trim() || null,
        is_active: true,
      };
      if (editStudent) {
        const { error } = await supabase.from('students').update(payload).eq('id', editStudent.id);
        if (error) throw error;
        success('✅ تم التعديل');
      } else {
        const { error } = await supabase.from('students').insert(payload);
        if (error) throw error;
        success('🎉 تم تسجيل الطالب');
      }
      setShowForm(false);
      loadAll();
    } catch (err) { console.error(err); toastError('فشل الحفظ'); }
    finally { setSaving(false); }
  }

  async function toggleActive(s) {
    const { error } = await supabase.from('students').update({ is_active: !s.is_active }).eq('id', s.id);
    if (!error) {
      success(s.is_active ? '⏸️ تم التعطيل' : '✅ تم التفعيل');
      setStudents(prev => prev.map(x => x.id === s.id ? { ...x, is_active: !x.is_active } : x));
    }
  }

  async function deleteStudent(s) {
    if (!confirm(`حذف الطالب "${s.name}"؟`)) return;
    setDeleting(s.id);
    const { error } = await supabase.from('students').delete().eq('id', s.id);
    if (!error) { success('🗑️ تم الحذف'); setStudents(prev => prev.filter(x => x.id !== s.id)); }
    setDeleting(null);
  }

  const filtered = useMemo(() => {
    let list = students;
    if (classFilter !== 'all') list = list.filter(s => s.class_id === classFilter);
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(s => (s.name || '').toLowerCase().includes(q) || (s.phone || '').includes(q) || (s.parent_phone || '').includes(q));
    }
    return list;
  }, [students, classFilter, search]);

  const stats = useMemo(() => ({
    total: students.length,
    active: students.filter(s => s.is_active).length,
    noClass: students.filter(s => !s.class_id).length,
  }), [students]);

  function getClassName(id) {
    if (!id) return null;
    return classes.find(c => c.id === id)?.name || null;
  }

  if (userLoading || loading) return <div style={{ padding: 80, textAlign: 'center' }}>⏳</div>;

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', paddingBottom: 100 }}>
      <div style={{ background: '#0f4d3a', padding: '16px 20px', position: 'sticky', top: 0, zIndex: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
          <Link href="/merchant" style={{ color: '#fff', textDecoration: 'none', fontSize: 20 }}>←</Link>
          <div style={{ flex: 1 }}>
            <h1 style={{ color: '#fff', fontSize: 18, fontWeight: 900, margin: 0 }}>👨‍🎓 الطلاب</h1>
            <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: 11, marginTop: 2 }}>{dataOwnerName}</div>
          </div>
          <button onClick={openAdd} style={{ background: '#fbbf24', color: '#0f4d3a', border: 'none', padding: '8px 14px', borderRadius: 10, fontSize: 12, fontWeight: 900, cursor: 'pointer', fontFamily: 'inherit' }}>+ جديد</button>
        </div>
        <input type="search" placeholder="🔍 ابحث بالاسم أو الهاتف..." value={search} onChange={e => setSearch(e.target.value)} style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: 'none', fontSize: 13, outline: 'none', boxSizing: 'border-box', background: 'rgba(255,255,255,0.95)' }} />
        {classes.length > 0 && (
          <select value={classFilter} onChange={e => setClassFilter(e.target.value)} style={{ width: '100%', marginTop: 8, padding: '8px 12px', borderRadius: 10, border: 'none', fontSize: 12, outline: 'none', background: 'rgba(255,255,255,0.95)', fontWeight: 800 }}>
            <option value="all">كل الصفوف ({students.length})</option>
            {classes.map(c => <option key={c.id} value={c.id}>{c.name} ({students.filter(s => s.class_id === c.id).length})</option>)}
          </select>
        )}
      </div>

      <div style={{ display: 'flex', gap: 6, padding: '10px 16px', background: '#fff', borderBottom: '1px solid #e2e8f0', overflowX: 'auto' }}>
        <Link href="/merchant/teachers" style={navStyle(false)}>👨‍🏫 المعلمون</Link>
        <Link href="/merchant/classes" style={navStyle(false)}>📚 الصفوف</Link>
        <Link href="/merchant/students" style={navStyle(true)}>👨‍🎓 الطلاب</Link>
        <Link href="/merchant/grades" style={navStyle(false)}>📊 العلامات</Link>
      </div>

      <div style={{ padding: 16, maxWidth: 800, margin: '0 auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 16 }}>
          <StatBox label="الكل" value={stats.total} color="#0f4d3a" />
          <StatBox label="نشطون" value={stats.active} color="#10b981" />
          <StatBox label="بلا صف" value={stats.noClass} color="#f59e0b" />
        </div>

        {filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 40, background: '#fff', borderRadius: 16, color: '#64748b' }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>👨‍🎓</div>
            <div style={{ fontSize: 15, fontWeight: 900, marginBottom: 8 }}>{students.length === 0 ? 'لم تسجل طلاباً بعد' : 'لا نتائج'}</div>
            {students.length === 0 && (
              <button onClick={openAdd} style={{ background: '#0f4d3a', color: '#fff', padding: '10px 20px', borderRadius: 10, border: 'none', fontSize: 13, fontWeight: 900, cursor: 'pointer', fontFamily: 'inherit' }}>+ سجل أول طالب</button>
            )}
          </div>
        ) : filtered.map(s => {
          const className = getClassName(s.class_id);
          return (
            <div key={s.id} style={{ background: '#fff', borderRadius: 14, padding: 14, marginBottom: 10, border: '1px solid #e2e8f0', opacity: s.is_active ? 1 : 0.6 }}>
              <div style={{ display: 'flex', gap: 12, marginBottom: 10 }}>
                <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'linear-gradient(135deg, #0ea5e9, #0284c7)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, fontWeight: 900, flexShrink: 0 }}>
                  {(s.name || '؟').charAt(0)}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 900, color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.name}</div>
                  <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>
                    {s.phone && `📱 ${s.phone}`}
                    {s.parent_phone && ` · 👨‍👩‍👦 ${s.parent_phone}`}
                  </div>
                  <div style={{ display: 'flex', gap: 6, marginTop: 4, flexWrap: 'wrap' }}>
                    {className && <span style={{ background: 'rgba(139,92,246,0.1)', color: '#8b5cf6', padding: '2px 8px', borderRadius: 6, fontSize: 10, fontWeight: 900 }}>📚 {className}</span>}
                    {!className && <span style={{ background: 'rgba(245,158,11,0.1)', color: '#f59e0b', padding: '2px 8px', borderRadius: 6, fontSize: 10, fontWeight: 900 }}>⚠️ بلا صف</span>}
                    <span style={{ background: s.is_active ? 'rgba(16,185,129,0.1)' : 'rgba(148,163,184,0.15)', color: s.is_active ? '#10b981' : '#64748b', padding: '2px 8px', borderRadius: 6, fontSize: 10, fontWeight: 900 }}>{s.is_active ? '✅' : '⏸️'}</span>
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                <button onClick={() => openEdit(s)} style={btnStyle('rgba(14,165,233,0.1)', '#0284c7')}>✏️</button>
                <button onClick={() => toggleActive(s)} style={btnStyle(s.is_active ? 'rgba(245,158,11,0.1)' : 'rgba(16,185,129,0.1)', s.is_active ? '#f59e0b' : '#10b981')}>{s.is_active ? '⏸️' : '✅'}</button>
                <button onClick={() => deleteStudent(s)} disabled={deleting === s.id} style={btnStyle('rgba(239,68,68,0.1)', '#ef4444')}>{deleting === s.id ? '⏳' : '🗑️'}</button>
              </div>
            </div>
          );
        })}
      </div>

      {showForm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 100, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
          <div style={{ background: '#fff', width: '100%', maxWidth: 500, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h2 style={{ fontSize: 18, fontWeight: 900, margin: 0 }}>{editStudent ? '✏️ تعديل طالب' : '👨‍🎓 طالب جديد'}</h2>
              <button onClick={() => setShowForm(false)} style={{ background: '#f1f5f9', border: 'none', width: 32, height: 32, borderRadius: '50%', fontSize: 16, cursor: 'pointer' }}>✕</button>
            </div>
            <form onSubmit={saveStudent}>
              <div style={{ marginBottom: 12 }}>
                <label style={labelStyle}>اسم الطالب *</label>
                <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required style={inputStyle} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 12 }}>
                <div>
                  <label style={labelStyle}>هاتف الطالب</label>
                  <input type="tel" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>هاتف ولي الأمر</label>
                  <input type="tel" value={form.parent_phone} onChange={e => setForm({ ...form, parent_phone: e.target.value })} style={inputStyle} />
                </div>
              </div>
              <div style={{ marginBottom: 12 }}>
                <label style={labelStyle}>الصف</label>
                <select value={form.class_id} onChange={e => setForm({ ...form, class_id: e.target.value })} style={inputStyle}>
                  <option value="">— بدون صف —</option>
                  {classes.map(c => <option key={c.id} value={c.id}>{c.name} ({c.grade_level})</option>)}
                </select>
              </div>
              <div style={{ marginBottom: 12 }}>
                <label style={labelStyle}>تاريخ الميلاد</label>
                <input type="date" value={form.birth_date} onChange={e => setForm({ ...form, birth_date: e.target.value })} style={inputStyle} />
              </div>
              <div style={{ marginBottom: 12 }}>
                <label style={labelStyle}>العنوان</label>
                <input value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} style={inputStyle} />
              </div>
              <div style={{ marginBottom: 20 }}>
                <label style={labelStyle}>ملاحظات</label>
                <textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} style={{ ...inputStyle, height: 60, resize: 'none' }} />
              </div>
              <button type="submit" disabled={saving} style={{ width: '100%', padding: 14, background: saving ? '#94a3b8' : '#0f4d3a', color: '#fff', border: 'none', borderRadius: 10, fontWeight: 900, fontSize: 15, cursor: saving ? 'wait' : 'pointer', fontFamily: 'inherit' }}>
                {saving ? '⏳ جارٍ الحفظ...' : (editStudent ? '💾 حفظ' : '➕ تسجيل')}
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
