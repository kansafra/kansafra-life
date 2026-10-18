'use client';
import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { useCurrentUser } from '@/lib/useCurrentUser';
import { useToast } from '@/components/Toast';
import { SkeletonList } from '@/components/Skeleton';
import EmptyState from '@/components/EmptyState';
import FileUploader from '@/components/FileUploader';

export default function LessonsPage() {
  const router = useRouter();
  const { user, loading: uL, dataOwnerName } = useCurrentUser();
  const { success, error: tE } = useToast();
  const [lessons, setLessons] = useState([]);
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
      const { data } = await supabase.from('lessons').select('*').eq('entity_name', dataOwnerName).order('created_at', { ascending: false });
      setLessons(data || []);
    } catch (e) { tE('تعذّر التحميل'); }
    setLoading(false);
  }

  const filtered = useMemo(() => {
    if (!search.trim()) return lessons;
    const q = search.trim().toLowerCase();
    return lessons.filter(l =>
      (l.title || '').toLowerCase().includes(q) ||
      (l.subject || '').toLowerCase().includes(q) ||
      (l.class_name || '').toLowerCase().includes(q)
    );
  }, [lessons, search]);

  function openAdd() {
    setForm({ title: '', subject: '', class_name: '', content: '', video_url: '', file_url: '', is_published: true });
    setModal('add');
  }

  function openEdit(l) {
    setForm({ ...l });
    setModal('edit');
  }

  async function save() {
    if (!form.title?.trim()) { tE('العنوان مطلوب'); return; }
    setSaving(true);
    try {
      const payload = {
        entity_name: dataOwnerName,
        title: form.title.trim(),
        subject: form.subject?.trim() || null,
        class_name: form.class_name?.trim() || null,
        content: form.content?.trim() || null,
        video_url: form.video_url?.trim() || null,
        file_url: form.file_url || null,
        is_published: form.is_published !== false,
      };
      let err;
      if (modal === 'edit') ({ error: err } = await supabase.from('lessons').update(payload).eq('id', form.id));
      else ({ error: err } = await supabase.from('lessons').insert(payload));
      if (err) throw err;
      success(modal === 'edit' ? '✅ تم التعديل' : '✅ تمت الإضافة');
      setModal(null); load();
    } catch (e) { tE('تعذّر: ' + e.message); }
    setSaving(false);
  }

  async function del(l) {
    if (!confirm(`حذف الدرس "${l.title}"؟`)) return;
    await supabase.from('lessons').delete().eq('id', l.id);
    success('✅ تم الحذف'); load();
  }

  async function togglePublish(l) {
    await supabase.from('lessons').update({ is_published: !l.is_published }).eq('id', l.id);
    load();
  }

  if (uL || loading) return <div style={{ padding: 16, background: '#f8fafc', minHeight: '100vh' }}><SkeletonList count={3} /></div>;

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', paddingBottom: 80 }}>
      <div style={{ position: 'sticky', top: 0, zIndex: 10, background: '#7c3aed', padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <Link href="/merchant" style={{ color: '#fff', textDecoration: 'none', fontSize: 20, width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,.15)', borderRadius: '50%' }}>→</Link>
        <div style={{ flex: 1 }}>
          <div style={{ color: '#fff', fontSize: 16, fontWeight: 900 }}>📖 الدروس</div>
          <div style={{ color: 'rgba(255,255,255,.8)', fontSize: 11, marginTop: 2 }}>{lessons.length} درس</div>
        </div>
        <button onClick={openAdd} style={{ background: '#fff', color: '#7c3aed', border: 'none', padding: '8px 14px', borderRadius: 10, fontSize: 12, fontWeight: 900, cursor: 'pointer', fontFamily: 'inherit' }}>+ درس</button>
      </div>

      <div style={{ padding: 16 }}>
        <input type="text" placeholder="🔍 ابحث بالعنوان أو المادة..." value={search} onChange={(e) => setSearch(e.target.value)}
          style={{ width: '100%', padding: '12px 14px', border: '1px solid #e5e7eb', borderRadius: 12, fontSize: 13, fontFamily: 'inherit', boxSizing: 'border-box', outline: 'none', background: '#fff' }} />
      </div>

      <div style={{ padding: '0 16px' }}>
        {filtered.length === 0 ? (
          <EmptyState icon="📖" title="لا توجد دروس" description="أضف دروساً تعليمية لطلابك" actionLabel="+ درس جديد" onAction={openAdd} />
        ) : filtered.map(l => (
          <div key={l.id} style={{ background: '#fff', borderRadius: 14, padding: 14, marginBottom: 10, border: '1px solid #e5e7eb', opacity: l.is_published ? 1 : 0.6 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 900, color: '#0f172a' }}>📖 {l.title}</div>
                <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>
                  {l.subject && `📚 ${l.subject}`}{l.class_name && ` · ${l.class_name}`}
                </div>
              </div>
              <span style={{ background: l.is_published ? 'rgba(16,185,129,.15)' : '#f1f5f9', color: l.is_published ? '#10b981' : '#64748b', padding: '3px 10px', borderRadius: 6, fontSize: 9.5, fontWeight: 900, height: 'fit-content' }}>{l.is_published ? '✓ منشور' : '○ مسودة'}</span>
            </div>
            {l.content && <div style={{ fontSize: 12, color: '#334155', lineHeight: 1.6, marginBottom: 8, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{l.content}</div>}
            <div style={{ display: 'flex', gap: 6 }}>
              {l.video_url && <a href={l.video_url} target="_blank" rel="noopener" style={{ flex: 1, padding: 8, background: 'rgba(220,38,38,.1)', color: '#dc2626', borderRadius: 8, textAlign: 'center', fontSize: 11, fontWeight: 800, textDecoration: 'none' }}>▶️ فيديو</a>}
              {l.file_url && <a href={l.file_url} target="_blank" rel="noopener" style={{ flex: 1, padding: 8, background: 'rgba(59,130,246,.1)', color: '#3b82f6', borderRadius: 8, textAlign: 'center', fontSize: 11, fontWeight: 800, textDecoration: 'none' }}>📎 ملف</a>}
              <button onClick={() => openEdit(l)} style={{ padding: 8, background: '#f1f5f9', border: 'none', borderRadius: 8, fontSize: 11, cursor: 'pointer', fontFamily: 'inherit' }}>✏️</button>
              <button onClick={() => togglePublish(l)} style={{ padding: 8, background: l.is_published ? 'rgba(251,191,36,.1)' : 'rgba(16,185,129,.1)', color: l.is_published ? '#92400e' : '#10b981', border: 'none', borderRadius: 8, fontSize: 11, cursor: 'pointer', fontFamily: 'inherit' }}>{l.is_published ? '⏸' : '▶'}</button>
              <button onClick={() => del(l)} style={{ padding: 8, background: 'rgba(220,38,38,.1)', color: '#dc2626', border: 'none', borderRadius: 8, fontSize: 11, cursor: 'pointer', fontFamily: 'inherit' }}>🗑️</button>
            </div>
          </div>
        ))}
      </div>

      {modal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.6)', zIndex: 100, display: 'flex', alignItems: 'flex-end' }} onClick={() => setModal(null)}>
          <div style={{ background: '#fff', borderRadius: '24px 24px 0 0', width: '100%', maxWidth: 500, margin: '0 auto', padding: '24px 20px 30px', maxHeight: '90vh', overflowY: 'auto' }} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ fontSize: 18, fontWeight: 900, marginBottom: 16 }}>{modal === 'edit' ? 'تعديل درس' : 'درس جديد'}</h3>

            <input type="text" placeholder="عنوان الدرس *" value={form.title || ''} onChange={(e) => setForm({ ...form, title: e.target.value })} style={{ width: '100%', padding: 12, border: '1px solid #e5e7eb', borderRadius: 10, fontSize: 13, marginBottom: 10, boxSizing: 'border-box', fontFamily: 'inherit' }} />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 10 }}>
              <input type="text" placeholder="المادة" value={form.subject || ''} onChange={(e) => setForm({ ...form, subject: e.target.value })} style={{ padding: 12, border: '1px solid #e5e7eb', borderRadius: 10, fontSize: 13, boxSizing: 'border-box', fontFamily: 'inherit' }} />
              <input type="text" placeholder="الصف" value={form.class_name || ''} onChange={(e) => setForm({ ...form, class_name: e.target.value })} style={{ padding: 12, border: '1px solid #e5e7eb', borderRadius: 10, fontSize: 13, boxSizing: 'border-box', fontFamily: 'inherit' }} />
            </div>
            <textarea placeholder="محتوى الدرس" value={form.content || ''} onChange={(e) => setForm({ ...form, content: e.target.value })} rows={4} style={{ width: '100%', padding: 12, border: '1px solid #e5e7eb', borderRadius: 10, fontSize: 13, marginBottom: 10, boxSizing: 'border-box', fontFamily: 'inherit', resize: 'vertical' }} />
            <input type="url" placeholder="رابط فيديو (YouTube)" value={form.video_url || ''} onChange={(e) => setForm({ ...form, video_url: e.target.value })} style={{ width: '100%', padding: 12, border: '1px solid #e5e7eb', borderRadius: 10, fontSize: 13, marginBottom: 10, boxSizing: 'border-box', fontFamily: 'inherit', direction: 'ltr' }} />
            <div style={{ marginBottom: 10 }}>
              <FileUploader label="📎 رفع ملف الدرس" folder="lessons" value={form.file_url || ''} onUpload={(url) => setForm({ ...form, file_url: url })} maxSize={30} />
            </div>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, padding: 10, background: '#f0fdf4', borderRadius: 8, marginBottom: 16, cursor: 'pointer' }}>
              <input type="checkbox" checked={form.is_published !== false} onChange={(e) => setForm({ ...form, is_published: e.target.checked })} />
              <span style={{ fontSize: 12, fontWeight: 800, color: '#065f46' }}>منشور للطلاب</span>
            </label>

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
