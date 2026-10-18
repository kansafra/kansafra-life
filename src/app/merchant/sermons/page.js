'use client';
import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { useCurrentUser } from '@/lib/useCurrentUser';
import { useToast } from '@/components/Toast';
import { SkeletonList } from '@/components/Skeleton';
import EmptyState from '@/components/EmptyState';

export default function SermonsPage() {
  const router = useRouter();
  const { user, loading: uL, dataOwnerName } = useCurrentUser();
  const { success, error: tE } = useToast();
  const [sermons, setSermons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [viewing, setViewing] = useState(null);

  useEffect(() => {
    if (uL) return;
    if (!user) { router.replace('/login'); return; }
    load();
  }, [user, uL]);

  async function load() {
    if (!supabase || !dataOwnerName) { setLoading(false); return; }
    try {
      const { data } = await supabase.from('sermons').select('*').eq('entity_name', dataOwnerName).order('sermon_date', { ascending: false });
      setSermons(data || []);
    } catch (e) { tE('تعذّر التحميل'); }
    setLoading(false);
  }

  const filtered = useMemo(() => {
    if (!search.trim()) return sermons;
    const q = search.trim().toLowerCase();
    return sermons.filter(s =>
      (s.title || '').toLowerCase().includes(q) ||
      (s.khatib || '').toLowerCase().includes(q)
    );
  }, [sermons, search]);

  function openAdd() {
    setForm({ title: '', khatib: '', content: '', audio_url: '', video_url: '', sermon_date: new Date().toISOString().slice(0, 10), is_published: true });
    setModal('add');
  }

  function openEdit(s) { setForm({ ...s, sermon_date: s.sermon_date || '' }); setModal('edit'); }

  async function save() {
    if (!form.title?.trim()) { tE('العنوان مطلوب'); return; }
    setSaving(true);
    try {
      const payload = {
        entity_name: dataOwnerName,
        title: form.title.trim(),
        khatib: form.khatib?.trim() || null,
        content: form.content?.trim() || null,
        audio_url: form.audio_url?.trim() || null,
        video_url: form.video_url?.trim() || null,
        sermon_date: form.sermon_date || null,
        is_published: form.is_published !== false,
      };
      let err;
      if (modal === 'edit') ({ error: err } = await supabase.from('sermons').update(payload).eq('id', form.id));
      else ({ error: err } = await supabase.from('sermons').insert(payload));
      if (err) throw err;
      success(modal === 'edit' ? '✅ تم التعديل' : '✅ تمت الإضافة');
      setModal(null); load();
    } catch (e) { tE('تعذّر: ' + e.message); }
    setSaving(false);
  }

  async function del(s) {
    if (!confirm(`حذف خطبة "${s.title}"؟`)) return;
    await supabase.from('sermons').delete().eq('id', s.id);
    success('✅ تم الحذف'); load();
  }

  async function toggle(s) {
    await supabase.from('sermons').update({ is_published: !s.is_published }).eq('id', s.id);
    load();
  }

  if (uL || loading) return <div style={{ padding: 16, background: '#f8fafc', minHeight: '100vh' }}><SkeletonList count={3} /></div>;

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', paddingBottom: 80 }}>
      <div style={{ position: 'sticky', top: 0, zIndex: 10, background: 'linear-gradient(135deg,#0f4d3a,#075640)', padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <Link href="/merchant" style={{ color: '#fff', textDecoration: 'none', fontSize: 20, width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,.15)', borderRadius: '50%' }}>→</Link>
        <div style={{ flex: 1 }}>
          <div style={{ color: '#fff', fontSize: 16, fontWeight: 900 }}>📖 الخطب</div>
          <div style={{ color: 'rgba(255,255,255,.8)', fontSize: 11, marginTop: 2 }}>{sermons.length} خطبة</div>
        </div>
        <button onClick={openAdd} style={{ background: '#fbbf24', color: '#0f4d3a', border: 'none', padding: '8px 14px', borderRadius: 10, fontSize: 12, fontWeight: 900, cursor: 'pointer', fontFamily: 'inherit' }}>+ خطبة</button>
      </div>

      <div style={{ padding: 16 }}>
        <input type="text" placeholder="🔍 ابحث بالعنوان أو الخطيب..." value={search} onChange={(e) => setSearch(e.target.value)}
          style={{ width: '100%', padding: '12px 14px', border: '1px solid #e5e7eb', borderRadius: 12, fontSize: 13, fontFamily: 'inherit', boxSizing: 'border-box', outline: 'none', background: '#fff' }} />
      </div>

      <div style={{ padding: '0 16px' }}>
        {filtered.length === 0 ? (
          <EmptyState icon="📖" title="لا توجد خطب" description="أضف خطب الجمعة للرجوع إليها" actionLabel="+ خطبة جديدة" onAction={openAdd} />
        ) : filtered.map(s => (
          <div key={s.id} style={{ background: '#fff', borderRadius: 14, padding: 14, marginBottom: 10, border: '1px solid #e5e7eb', opacity: s.is_published ? 1 : 0.6 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 900, color: '#0f172a' }}>📖 {s.title}</div>
                <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>
                  {s.khatib && `👨‍🏫 ${s.khatib}`}
                  {s.sermon_date && ` · 📅 ${new Date(s.sermon_date).toLocaleDateString('ar-EG')}`}
                </div>
              </div>
              <span style={{ background: s.is_published ? 'rgba(16,185,129,.15)' : '#f1f5f9', color: s.is_published ? '#10b981' : '#64748b', padding: '3px 10px', borderRadius: 6, fontSize: 9.5, fontWeight: 900, height: 'fit-content' }}>{s.is_published ? '✓ منشورة' : '○ مسودة'}</span>
            </div>
            {s.content && <div style={{ fontSize: 12, color: '#334155', lineHeight: 1.6, marginBottom: 8, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{s.content}</div>}
            <div style={{ display: 'flex', gap: 6 }}>
              <button onClick={() => setViewing(s)} style={{ flex: 1, padding: 8, background: 'rgba(15,77,58,.1)', color: '#0f4d3a', border: 'none', borderRadius: 8, fontSize: 11, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit' }}>👁️ عرض</button>
              {s.audio_url && <a href={s.audio_url} target="_blank" rel="noopener" style={{ padding: 8, background: 'rgba(59,130,246,.1)', color: '#3b82f6', borderRadius: 8, fontSize: 11, fontWeight: 800, textDecoration: 'none' }}>🔊</a>}
              {s.video_url && <a href={s.video_url} target="_blank" rel="noopener" style={{ padding: 8, background: 'rgba(220,38,38,.1)', color: '#dc2626', borderRadius: 8, fontSize: 11, fontWeight: 800, textDecoration: 'none' }}>▶️</a>}
              <button onClick={() => openEdit(s)} style={{ padding: 8, background: '#f1f5f9', border: 'none', borderRadius: 8, fontSize: 11, cursor: 'pointer', fontFamily: 'inherit' }}>✏️</button>
              <button onClick={() => toggle(s)} style={{ padding: 8, background: s.is_published ? 'rgba(251,191,36,.1)' : 'rgba(16,185,129,.1)', color: s.is_published ? '#92400e' : '#10b981', border: 'none', borderRadius: 8, fontSize: 11, cursor: 'pointer', fontFamily: 'inherit' }}>{s.is_published ? '⏸' : '▶'}</button>
              <button onClick={() => del(s)} style={{ padding: 8, background: 'rgba(220,38,38,.1)', color: '#dc2626', border: 'none', borderRadius: 8, fontSize: 11, cursor: 'pointer', fontFamily: 'inherit' }}>🗑️</button>
            </div>
          </div>
        ))}
      </div>

      {/* View Modal */}
      {viewing && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.6)', zIndex: 100, display: 'flex', alignItems: 'flex-end' }} onClick={() => setViewing(null)}>
          <div style={{ background: '#fff', borderRadius: '24px 24px 0 0', width: '100%', maxWidth: 500, margin: '0 auto', padding: '24px 20px 30px', maxHeight: '90vh', overflowY: 'auto' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ textAlign: 'center', marginBottom: 20 }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>📖</div>
              <h3 style={{ fontSize: 18, fontWeight: 900 }}>{viewing.title}</h3>
              {viewing.khatib && <div style={{ fontSize: 12, color: '#64748b', marginTop: 6 }}>👨‍🏫 {viewing.khatib}</div>}
              {viewing.sermon_date && <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 4 }}>📅 {new Date(viewing.sermon_date).toLocaleDateString('ar-EG', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</div>}
            </div>
            {viewing.content && (
              <div style={{ background: '#f8fafc', borderRadius: 12, padding: 16, marginBottom: 16, fontSize: 14, lineHeight: 2, color: '#334155', whiteSpace: 'pre-line' }}>
                {viewing.content}
              </div>
            )}
            <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
              {viewing.audio_url && <a href={viewing.audio_url} target="_blank" rel="noopener" style={{ flex: 1, padding: 12, background: 'rgba(59,130,246,.1)', color: '#3b82f6', borderRadius: 10, textAlign: 'center', textDecoration: 'none', fontSize: 12, fontWeight: 900 }}>🔊 استماع</a>}
              {viewing.video_url && <a href={viewing.video_url} target="_blank" rel="noopener" style={{ flex: 1, padding: 12, background: 'rgba(220,38,38,.1)', color: '#dc2626', borderRadius: 10, textAlign: 'center', textDecoration: 'none', fontSize: 12, fontWeight: 900 }}>▶️ مشاهدة</a>}
            </div>
            <button onClick={() => setViewing(null)} style={{ width: '100%', padding: 12, background: '#f1f5f9', color: '#334155', border: 'none', borderRadius: 10, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit' }}>إغلاق</button>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {modal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.6)', zIndex: 100, display: 'flex', alignItems: 'flex-end' }} onClick={() => setModal(null)}>
          <div style={{ background: '#fff', borderRadius: '24px 24px 0 0', width: '100%', maxWidth: 500, margin: '0 auto', padding: '24px 20px 30px', maxHeight: '90vh', overflowY: 'auto' }} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ fontSize: 18, fontWeight: 900, marginBottom: 16 }}>{modal === 'edit' ? 'تعديل خطبة' : 'خطبة جديدة'}</h3>

            <input type="text" placeholder="عنوان الخطبة *" value={form.title || ''} onChange={(e) => setForm({ ...form, title: e.target.value })} style={{ width: '100%', padding: 12, border: '1px solid #e5e7eb', borderRadius: 10, fontSize: 13, marginBottom: 10, boxSizing: 'border-box', fontFamily: 'inherit' }} />
            <input type="text" placeholder="اسم الخطيب" value={form.khatib || ''} onChange={(e) => setForm({ ...form, khatib: e.target.value })} style={{ width: '100%', padding: 12, border: '1px solid #e5e7eb', borderRadius: 10, fontSize: 13, marginBottom: 10, boxSizing: 'border-box', fontFamily: 'inherit' }} />
            <input type="date" value={form.sermon_date || ''} onChange={(e) => setForm({ ...form, sermon_date: e.target.value })} style={{ width: '100%', padding: 12, border: '1px solid #e5e7eb', borderRadius: 10, fontSize: 13, marginBottom: 10, boxSizing: 'border-box', fontFamily: 'inherit' }} />
            <textarea placeholder="محتوى الخطبة..." value={form.content || ''} onChange={(e) => setForm({ ...form, content: e.target.value })} rows={6} style={{ width: '100%', padding: 12, border: '1px solid #e5e7eb', borderRadius: 10, fontSize: 13, marginBottom: 10, boxSizing: 'border-box', fontFamily: 'inherit', resize: 'vertical' }} />
            <input type="url" placeholder="رابط الصوت (اختياري)" value={form.audio_url || ''} onChange={(e) => setForm({ ...form, audio_url: e.target.value })} style={{ width: '100%', padding: 12, border: '1px solid #e5e7eb', borderRadius: 10, fontSize: 13, marginBottom: 10, boxSizing: 'border-box', fontFamily: 'inherit', direction: 'ltr' }} />
            <input type="url" placeholder="رابط الفيديو (اختياري)" value={form.video_url || ''} onChange={(e) => setForm({ ...form, video_url: e.target.value })} style={{ width: '100%', padding: 12, border: '1px solid #e5e7eb', borderRadius: 10, fontSize: 13, marginBottom: 10, boxSizing: 'border-box', fontFamily: 'inherit', direction: 'ltr' }} />
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, padding: 10, background: '#f0fdf4', borderRadius: 8, marginBottom: 16, cursor: 'pointer' }}>
              <input type="checkbox" checked={form.is_published !== false} onChange={(e) => setForm({ ...form, is_published: e.target.checked })} />
              <span style={{ fontSize: 12, fontWeight: 800, color: '#065f46' }}>منشورة للجمهور</span>
            </label>

            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setModal(null)} style={{ flex: 1, padding: 12, background: '#f1f5f9', border: 'none', borderRadius: 10, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit' }}>إلغاء</button>
              <button onClick={save} disabled={saving} style={{ flex: 1, padding: 12, background: 'linear-gradient(135deg,#0f4d3a,#075640)', color: '#fff', border: 'none', borderRadius: 10, fontWeight: 900, cursor: saving ? 'not-allowed' : 'pointer', fontFamily: 'inherit' }}>{saving ? '...' : '✓ حفظ'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
