'use client';
import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { useCurrentUser } from '@/lib/useCurrentUser';
import { useToast } from '@/components/Toast';

const SUBJECTS = ['رياضيات', 'عربي', 'إنكليزي', 'علوم', 'دين', 'تربية', 'حاسوب', 'اجتماعيات', 'فنون', 'رياضة', 'أخرى'];

export default function MerchantTeachersPage() {
  const router = useRouter();
  const { success, error: toastError } = useToast();
  const { user, loading: userLoading, dataOwnerName } = useCurrentUser();

  const [entityId, setEntityId] = useState(null);
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [deleting, setDeleting] = useState(null);

  const [showForm, setShowForm] = useState(false);
  const [editTeacher, setEditTeacher] = useState(null);
  const [form, setForm] = useState({ name: '', phone: '', subject: 'أخرى', bio: '', image_url: '' });
  const [uploading, setUploading] = useState(false);
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
    loadTeachers();
  }, [user, userLoading, dataOwnerName]);

  async function loadTeachers() {
    if (!supabase || !dataOwnerName) return;
    setLoading(true);
    try {
      const { data } = await supabase.from('teachers').select('*').eq('provider_name', dataOwnerName).order('created_at', { ascending: false });
      setTeachers(data || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }

  function openAdd() {
    setForm({ name: '', phone: '', subject: 'أخرى', bio: '', image_url: '' });
    setEditTeacher(null);
    setShowForm(true);
  }

  function openEdit(t) {
    setForm({ name: t.name || '', phone: t.phone || '', subject: t.subject || 'أخرى', bio: t.bio || '', image_url: t.image_url || '' });
    setEditTeacher(t);
    setShowForm(true);
  }

  async function uploadImage(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { toastError('حجم الصورة أقل من 5MB'); return; }
    setUploading(true);
    try {
      const ext = file.name.split('.').pop();
      const name = `teachers/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
      const { error } = await supabase.storage.from('sanad-files').upload(name, file);
      if (error) throw error;
      const { data: url } = supabase.storage.from('sanad-files').getPublicUrl(name);
      setForm({ ...form, image_url: url.publicUrl });
      success('✅ تم رفع الصورة');
    } catch (err) { toastError('فشل الرفع'); }
    finally { setUploading(false); }
  }

  async function saveTeacher(e) {
    e.preventDefault();
    if (!form.name.trim()) { toastError('الاسم مطلوب'); return; }
    if (!form.phone.trim()) { toastError('رقم الهاتف مطلوب'); return; }
    setSaving(true);
    try {
      const payload = {
        entity_id: entityId,
        provider_name: dataOwnerName,
        name: form.name.trim(),
        phone: form.phone.trim(),
        subject: form.subject,
        bio: form.bio.trim() || null,
        image_url: form.image_url || null,
        is_active: true,
      };
      if (editTeacher) {
        const { error } = await supabase.from('teachers').update(payload).eq('id', editTeacher.id);
        if (error) throw error;
        success('✅ تم التعديل');
      } else {
        const { error } = await supabase.from('teachers').insert(payload);
        if (error) throw error;
        success('🎉 تم إضافة المعلم');
      }
      setShowForm(false);
      loadTeachers();
    } catch (err) { console.error(err); toastError('فشل الحفظ'); }
    finally { setSaving(false); }
  }

  async function toggleActive(t) {
    const { error } = await supabase.from('teachers').update({ is_active: !t.is_active }).eq('id', t.id);
    if (!error) {
      success(t.is_active ? '⏸️ تم التعطيل' : '✅ تم التفعيل');
      setTeachers(prev => prev.map(x => x.id === t.id ? { ...x, is_active: !x.is_active } : x));
    }
  }

  async function deleteTeacher(t) {
    if (!confirm(`حذف المعلم "${t.name}"؟`)) return;
    setDeleting(t.id);
    const { error } = await supabase.from('teachers').delete().eq('id', t.id);
    if (!error) { success('🗑️ تم الحذف'); setTeachers(prev => prev.filter(x => x.id !== t.id)); }
    setDeleting(null);
  }

  const stats = useMemo(() => ({
    total: teachers.length,
    active: teachers.filter(t => t.is_active).length,
    subjects: new Set(teachers.map(t => t.subject).filter(Boolean)).size,
  }), [teachers]);

  const filtered = useMemo(() => {
    if (!search.trim()) return teachers;
    const q = search.trim().toLowerCase();
    return teachers.filter(t =>
      (t.name || '').toLowerCase().includes(q) ||
      (t.phone || '').includes(q) ||
      (t.subject || '').toLowerCase().includes(q)
    );
  }, [teachers, search]);

  if (userLoading || loading) return <div style={{ padding: 80, textAlign: 'center' }}>⏳</div>;

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', paddingBottom: 100 }}>
      <div style={{ background: '#0f4d3a', padding: '16px 20px', position: 'sticky', top: 0, zIndex: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
          <Link href="/merchant" style={{ color: '#fff', textDecoration: 'none', fontSize: 20 }}>←</Link>
          <div style={{ flex: 1 }}>
            <h1 style={{ color: '#fff', fontSize: 18, fontWeight: 900, margin: 0 }}>👨‍🏫 المعلمون</h1>
            <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: 11, marginTop: 2 }}>{dataOwnerName}</div>
          </div>
          <button onClick={openAdd} style={{ background: '#fbbf24', color: '#0f4d3a', border: 'none', padding: '8px 14px', borderRadius: 10, fontSize: 12, fontWeight: 900, cursor: 'pointer', fontFamily: 'inherit' }}>+ جديد</button>
        </div>
        <input type="search" placeholder="🔍 ابحث بالاسم أو المادة..." value={search} onChange={e => setSearch(e.target.value)} style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: 'none', fontSize: 13, outline: 'none', boxSizing: 'border-box', background: 'rgba(255,255,255,0.95)' }} />
      </div>

      {/* Education Nav */}
      <div style={{ display: 'flex', gap: 6, padding: '10px 16px', background: '#fff', borderBottom: '1px solid #e2e8f0', overflowX: 'auto' }}>
        <Link href="/merchant/teachers" style={navStyle(true)}>👨‍🏫 المعلمون</Link>
        <Link href="/merchant/classes" style={navStyle(false)}>📚 الصفوف</Link>
        <Link href="/merchant/students" style={navStyle(false)}>👨‍🎓 الطلاب</Link>
        <Link href="/merchant/grades" style={navStyle(false)}>📊 العلامات</Link>
      </div>

      <div style={{ padding: 16, maxWidth: 800, margin: '0 auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 16 }}>
          <StatBox label="الكل" value={stats.total} color="#0f4d3a" />
          <StatBox label="نشطون" value={stats.active} color="#10b981" />
          <StatBox label="المواد" value={stats.subjects} color="#8b5cf6" />
        </div>

        {filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 40, background: '#fff', borderRadius: 16, color: '#64748b' }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>👨‍🏫</div>
            <div style={{ fontSize: 15, fontWeight: 900, marginBottom: 8 }}>
              {teachers.length === 0 ? 'لم تُضف معلمين بعد' : 'لا نتائج'}
            </div>
            {teachers.length === 0 && (
              <button onClick={openAdd} style={{ display: 'inline-block', background: '#0f4d3a', color: '#fff', padding: '10px 20px', borderRadius: 10, border: 'none', fontSize: 13, fontWeight: 900, cursor: 'pointer', fontFamily: 'inherit' }}>+ أضف أول معلم</button>
            )}
          </div>
        ) : filtered.map(t => (
          <div key={t.id} style={{ background: '#fff', borderRadius: 14, padding: 14, marginBottom: 10, border: '1px solid #e2e8f0', opacity: t.is_active ? 1 : 0.6 }}>
            <div style={{ display: 'flex', gap: 12, marginBottom: 10 }}>
              <div style={{ width: 56, height: 56, borderRadius: '50%', overflow: 'hidden', background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, color: '#fff', fontWeight: 900, flexShrink: 0 }}>
                {t.image_url ? <img src={t.image_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : (t.name || '؟').charAt(0)}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 900, color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.name || 'بدون اسم'}</div>
                <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>📱 {t.phone || '—'}</div>
                <div style={{ display: 'flex', gap: 6, marginTop: 4, flexWrap: 'wrap' }}>
                  {t.subject && <span style={{ background: 'rgba(139,92,246,0.1)', color: '#8b5cf6', padding: '2px 8px', borderRadius: 6, fontSize: 10, fontWeight: 900 }}>{t.subject}</span>}
                  <span style={{ background: t.is_active ? 'rgba(16,185,129,0.1)' : 'rgba(148,163,184,0.15)', color: t.is_active ? '#10b981' : '#64748b', padding: '2px 8px', borderRadius: 6, fontSize: 10, fontWeight: 900 }}>{t.is_active ? '✅ نشط' : '⏸️ معطل'}</span>
                </div>
              </div>
            </div>
            {t.bio && <div style={{ fontSize: 11.5, color: '#475569', lineHeight: 1.5, marginBottom: 10, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{t.bio}</div>}
            <div style={{ display: 'flex', gap: 6 }}>
              <button onClick={() => openEdit(t)} style={btnStyle('rgba(14,165,233,0.1)', '#0284c7')}>✏️ تعديل</button>
              <button onClick={() => toggleActive(t)} style={btnStyle(t.is_active ? 'rgba(245,158,11,0.1)' : 'rgba(16,185,129,0.1)', t.is_active ? '#f59e0b' : '#10b981')}>{t.is_active ? '⏸️' : '✅'}</button>
              <button onClick={() => deleteTeacher(t)} disabled={deleting === t.id} style={btnStyle('rgba(239,68,68,0.1)', '#ef4444')}>{deleting === t.id ? '⏳' : '🗑️'}</button>
            </div>
          </div>
        ))}
      </div>

      {showForm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 100, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
          <div style={{ background: '#fff', width: '100%', maxWidth: 500, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h2 style={{ fontSize: 18, fontWeight: 900, margin: 0 }}>{editTeacher ? '✏️ تعديل معلم' : '👨‍🏫 معلم جديد'}</h2>
              <button onClick={() => setShowForm(false)} style={{ background: '#f1f5f9', border: 'none', width: 32, height: 32, borderRadius: '50%', fontSize: 16, cursor: 'pointer' }}>✕</button>
            </div>
            <form onSubmit={saveTeacher}>
              <div style={{ marginBottom: 12, textAlign: 'center' }}>
                <label style={{ cursor: uploading ? 'wait' : 'pointer', display: 'inline-block' }}>
                  <input type="file" accept="image/*" onChange={uploadImage} style={{ display: 'none' }} disabled={uploading} />
                  <div style={{ width: 80, height: 80, borderRadius: '50%', background: form.image_url ? '#f1f5f9' : 'rgba(139,92,246,0.1)', border: '2px dashed #cbd5e1', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, margin: '0 auto', overflow: 'hidden' }}>
                    {form.image_url ? <img src={form.image_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : (uploading ? '⏳' : '📸')}
                  </div>
                  <div style={{ fontSize: 10.5, color: '#0284c7', fontWeight: 900, marginTop: 6 }}>{uploading ? 'جارٍ الرفع...' : 'صورة المعلم'}</div>
                </label>
              </div>
              <div style={{ marginBottom: 12 }}>
                <label style={labelStyle}>الاسم *</label>
                <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required style={inputStyle} />
              </div>
              <div style={{ marginBottom: 12 }}>
                <label style={labelStyle}>الهاتف *</label>
                <input type="tel" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} required style={inputStyle} />
              </div>
              <div style={{ marginBottom: 12 }}>
                <label style={labelStyle}>المادة</label>
                <select value={form.subject} onChange={e => setForm({ ...form, subject: e.target.value })} style={inputStyle}>
                  {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div style={{ marginBottom: 20 }}>
                <label style={labelStyle}>نبذة (اختياري)</label>
                <textarea value={form.bio} onChange={e => setForm({ ...form, bio: e.target.value })} style={{ ...inputStyle, height: 70, resize: 'none' }} />
              </div>
              <button type="submit" disabled={saving || uploading} style={{ width: '100%', padding: 14, background: (saving || uploading) ? '#94a3b8' : '#0f4d3a', color: '#fff', border: 'none', borderRadius: 10, fontWeight: 900, fontSize: 15, cursor: 'pointer', fontFamily: 'inherit' }}>
                {saving ? '⏳ جارٍ الحفظ...' : (editTeacher ? '💾 حفظ' : '➕ إضافة')}
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
