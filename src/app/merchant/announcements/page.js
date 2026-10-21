'use client';
import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { useCurrentUser } from '@/lib/useCurrentUser';
import { useToast } from '@/components/Toast';

const PRIORITIES = [
  { key: 'normal', label: 'عادي', icon: '📢', color: '#64748b' },
  { key: 'high', label: 'مهم', icon: '⚠️', color: '#f59e0b' },
  { key: 'urgent', label: 'عاجل', icon: '🚨', color: '#ef4444' },
];

export default function MerchantAnnouncementsPage() {
  const router = useRouter();
  const { success, error: toastError } = useToast();
  const { user, loading: userLoading, dataOwnerName } = useCurrentUser();

  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editAnn, setEditAnn] = useState(null);
  const [form, setForm] = useState({ title: '', content: '', image_url: '', priority: 'normal', pinned: false });
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(null);

  useEffect(() => {
    if (userLoading) return;
    if (!user || !dataOwnerName) { setLoading(false); return; }
    loadAnnouncements();
  }, [user, userLoading, dataOwnerName]);

  async function loadAnnouncements() {
    if (!supabase || !dataOwnerName) return;
    setLoading(true);
    try {
      const { data } = await supabase
        .from('announcements')
        .select('*')
        .eq('entity_name', dataOwnerName)
        .order('created_at', { ascending: false });
      setAnnouncements(data || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }

  function openAdd() {
    setForm({ title: '', content: '', image_url: '', priority: 'normal', pinned: false });
    setEditAnn(null);
    setShowForm(true);
  }

  function openEdit(ann) {
    setForm({
      title: ann.title || '',
      content: ann.content || ann.body || '',
      image_url: ann.image_url || '',
      priority: ann.priority || 'normal',
      pinned: ann.pinned || false,
    });
    setEditAnn(ann);
    setShowForm(true);
  }

  async function handleImageUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { toastError('حجم الصورة أقل من 5MB'); return; }
    setUploading(true);
    try {
      const ext = file.name.split('.').pop();
      const fileName = `announcements/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
      const { error: upErr } = await supabase.storage.from('sanad-files').upload(fileName, file);
      if (upErr) throw upErr;
      const { data: urlData } = supabase.storage.from('sanad-files').getPublicUrl(fileName);
      setForm({ ...form, image_url: urlData.publicUrl });
      success('✅ تم رفع الصورة');
    } catch (err) { toastError('فشل الرفع'); }
    finally { setUploading(false); }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.title.trim()) { toastError('العنوان مطلوب'); return; }
    setSaving(true);
    try {
      const payload = {
        title: form.title.trim(),
        body: form.content.trim(),
        content: form.content.trim(),
        image_url: form.image_url || null,
        priority: form.priority,
        pinned: form.pinned,
        entity_name: dataOwnerName,
        type: 'promotion',
        is_active: true,
        is_published: true,
        moderation_status: 'approved',
      };

      if (editAnn) {
        const { error } = await supabase.from('announcements').update(payload).eq('id', editAnn.id);
        if (error) throw error;
        success('✅ تم التحديث');
      } else {
        const { error } = await supabase.from('announcements').insert(payload);
        if (error) throw error;
        success('🎉 تم النشر');
      }
      setShowForm(false);
      loadAnnouncements();
    } catch (err) {
      console.error(err);
      toastError('فشل الحفظ');
    } finally { setSaving(false); }
  }

  async function toggleActive(ann) {
    const { error } = await supabase.from('announcements').update({ is_active: !ann.is_active }).eq('id', ann.id);
    if (!error) {
      success(ann.is_active ? '🙈 تم الإخفاء' : '✅ تم الإظهار');
      setAnnouncements(prev => prev.map(a => a.id === ann.id ? { ...a, is_active: !a.is_active } : a));
    }
  }

  async function handleDelete(ann) {
    if (!confirm(`حذف "${ann.title}"؟`)) return;
    setDeleting(ann.id);
    const { error } = await supabase.from('announcements').delete().eq('id', ann.id);
    if (!error) { success('🗑️ تم الحذف'); setAnnouncements(prev => prev.filter(a => a.id !== ann.id)); }
    else toastError('فشل الحذف');
    setDeleting(null);
  }

  const stats = useMemo(() => ({
    total: announcements.length,
    active: announcements.filter(a => a.is_active).length,
    pinned: announcements.filter(a => a.pinned).length,
  }), [announcements]);

  if (userLoading || loading) return <div style={{ padding: 80, textAlign: 'center' }}>⏳</div>;

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', paddingBottom: 100 }}>
      <div style={{ background: '#0f4d3a', padding: '16px 20px', position: 'sticky', top: 0, zIndex: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Link href="/merchant" style={{ color: '#fff', textDecoration: 'none', fontSize: 20 }}>←</Link>
          <h1 style={{ color: '#fff', fontSize: 18, fontWeight: 900, margin: 0, flex: 1 }}>📢 الإعلانات</h1>
          <button onClick={openAdd} style={{ background: '#fbbf24', color: '#0f4d3a', border: 'none', padding: '8px 14px', borderRadius: 10, fontSize: 12, fontWeight: 900, cursor: 'pointer', fontFamily: 'inherit' }}>+ جديد</button>
        </div>
      </div>

      <div style={{ padding: 16, maxWidth: 800, margin: '0 auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 16 }}>
          <StatBox label="الكل" value={stats.total} color="#0f4d3a" />
          <StatBox label="نشطة" value={stats.active} color="#10b981" />
          <StatBox label="مثبتة" value={stats.pinned} color="#f59e0b" />
        </div>

        {announcements.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 40, background: '#fff', borderRadius: 16, color: '#64748b' }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>📢</div>
            <div style={{ fontSize: 15, fontWeight: 900, marginBottom: 8 }}>لا توجد إعلانات</div>
            <button onClick={openAdd} style={{ display: 'inline-block', background: '#0f4d3a', color: '#fff', padding: '10px 20px', borderRadius: 10, border: 'none', fontSize: 13, fontWeight: 900, cursor: 'pointer', fontFamily: 'inherit' }}>
              + انشر أول إعلان
            </button>
          </div>
        ) : announcements.map(ann => {
          const priority = PRIORITIES.find(p => p.key === ann.priority) || PRIORITIES[0];
          return (
            <div key={ann.id} style={{ background: '#fff', borderRadius: 16, padding: 16, marginBottom: 12, border: '1px solid #e2e8f0', opacity: ann.is_active ? 1 : 0.6 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10, gap: 10 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                    <div style={{ fontSize: 14, fontWeight: 900, color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ann.title}</div>
                    {ann.pinned && <span style={{ fontSize: 11 }}>📌</span>}
                  </div>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    <span style={{ background: `${priority.color}15`, color: priority.color, padding: '2px 8px', borderRadius: 6, fontSize: 9, fontWeight: 900 }}>{priority.icon} {priority.label}</span>
                    <span style={{ background: ann.is_active ? 'rgba(16,185,129,0.1)' : 'rgba(148,163,184,0.15)', color: ann.is_active ? '#10b981' : '#64748b', padding: '2px 8px', borderRadius: 6, fontSize: 9, fontWeight: 900 }}>{ann.is_active ? '✅ نشط' : '🙈 مخفي'}</span>
                  </div>
                </div>
                {ann.image_url && <div style={{ width: 60, height: 60, borderRadius: 10, overflow: 'hidden', background: '#f1f5f9', flexShrink: 0 }}><img src={ann.image_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /></div>}
              </div>

              {(ann.content || ann.body) && (
                <div style={{ fontSize: 12, color: '#475569', lineHeight: 1.6, marginBottom: 12, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                  {ann.content || ann.body}
                </div>
              )}

              <div style={{ fontSize: 10, color: '#94a3b8', marginBottom: 12 }}>
                {ann.created_at ? new Date(ann.created_at).toLocaleString('ar-SY') : ''}
              </div>

              <div style={{ display: 'flex', gap: 6 }}>
                <button onClick={() => openEdit(ann)} style={btnStyle('rgba(14,165,233,0.1)', '#0284c7')}>✏️ تعديل</button>
                <button onClick={() => toggleActive(ann)} style={btnStyle(ann.is_active ? 'rgba(245,158,11,0.1)' : 'rgba(16,185,129,0.1)', ann.is_active ? '#f59e0b' : '#10b981')}>
                  {ann.is_active ? '🙈 إخفاء' : '👁️ إظهار'}
                </button>
                <button onClick={() => handleDelete(ann)} disabled={deleting === ann.id} style={btnStyle('rgba(239,68,68,0.1)', '#ef4444')}>
                  {deleting === ann.id ? '⏳' : '🗑️'}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {showForm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 100, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
          <div style={{ background: '#fff', width: '100%', maxWidth: 500, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h2 style={{ fontSize: 18, fontWeight: 900, margin: 0 }}>{editAnn ? '✏️ تعديل إعلان' : '📢 إعلان جديد'}</h2>
              <button onClick={() => setShowForm(false)} style={{ background: '#f1f5f9', border: 'none', width: 32, height: 32, borderRadius: '50%', fontSize: 16, cursor: 'pointer' }}>✕</button>
            </div>

            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: 12 }}>
                <label style={labelStyle}>العنوان *</label>
                <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required style={inputStyle} placeholder="مثال: خصم 20% على جميع المنتجات" />
              </div>

              <div style={{ marginBottom: 12 }}>
                <label style={labelStyle}>المحتوى</label>
                <textarea value={form.content} onChange={e => setForm({ ...form, content: e.target.value })} style={{ ...inputStyle, height: 100, resize: 'none' }} placeholder="تفاصيل العرض..." />
              </div>

              <div style={{ marginBottom: 12 }}>
                <label style={labelStyle}>صورة (اختياري)</label>
                <label style={{ cursor: uploading ? 'wait' : 'pointer', display: 'block' }}>
                  <input type="file" accept="image/*" onChange={handleImageUpload} style={{ display: 'none' }} disabled={uploading} />
                  {form.image_url ? (
                    <div style={{ position: 'relative', width: '100%', height: 120, borderRadius: 10, overflow: 'hidden', background: '#f1f5f9' }}>
                      <img src={form.image_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      <div style={{ position: 'absolute', bottom: 6, right: 6, background: 'rgba(0,0,0,0.6)', color: '#fff', padding: '3px 8px', borderRadius: 6, fontSize: 10, fontWeight: 900 }}>🔄 تغيير</div>
                    </div>
                  ) : (
                    <div style={{ width: '100%', height: 120, background: '#f8fafc', borderRadius: 10, border: '2px dashed #cbd5e1', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                      <span style={{ fontSize: 24 }}>{uploading ? '⏳' : '📸'}</span>
                      <span style={{ fontSize: 12, fontWeight: 900, color: '#64748b' }}>{uploading ? 'جارٍ الرفع...' : 'اختر صورة'}</span>
                    </div>
                  )}
                </label>
              </div>

              <div style={{ marginBottom: 12 }}>
                <label style={labelStyle}>الأولوية</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6 }}>
                  {PRIORITIES.map(p => (
                    <button key={p.key} type="button" onClick={() => setForm({ ...form, priority: p.key })} style={{ padding: 10, background: form.priority === p.key ? `${p.color}15` : '#f8fafc', color: form.priority === p.key ? p.color : '#475569', border: form.priority === p.key ? `2px solid ${p.color}` : '1px solid #e2e8f0', borderRadius: 10, fontSize: 11, fontWeight: 900, cursor: 'pointer', fontFamily: 'inherit' }}>
                      {p.icon} {p.label}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ marginBottom: 20 }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 10, padding: 12, background: '#f8fafc', borderRadius: 10, border: '1px solid #e2e8f0', cursor: 'pointer' }}>
                  <input type="checkbox" checked={form.pinned} onChange={e => setForm({ ...form, pinned: e.target.checked })} style={{ width: 18, height: 18 }} />
                  <span style={{ fontSize: 13, fontWeight: 800 }}>📌 تثبيت في أعلى الصفحة</span>
                </label>
              </div>

              <button type="submit" disabled={saving || uploading} style={{ width: '100%', padding: 14, background: (saving || uploading) ? '#94a3b8' : '#0f4d3a', color: '#fff', border: 'none', borderRadius: 10, fontWeight: 900, fontSize: 15, cursor: (saving || uploading) ? 'wait' : 'pointer', fontFamily: 'inherit' }}>
                {saving ? '⏳ جارٍ الحفظ...' : (editAnn ? '💾 حفظ التعديلات' : '📢 نشر الإعلان')}
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

const btnStyle = (bg, color) => ({ flex: 1, padding: 10, background: bg, color, border: 'none', borderRadius: 8, fontSize: 12, fontWeight: 900, cursor: 'pointer', fontFamily: 'inherit' });
const labelStyle = { display: 'block', fontSize: 12, fontWeight: 800, color: '#475569', marginBottom: 6 };
const inputStyle = { width: '100%', padding: '12px 14px', borderRadius: 10, border: '1px solid #cbd5e1', fontSize: 14, fontFamily: 'inherit', boxSizing: 'border-box', outline: 'none', background: '#f8fafc' };
