'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useCurrentUser } from '@/lib/useCurrentUser';
import { useToast } from '@/components/Toast';

const TYPES = [
  { key: 'photo', label: 'صورة', icon: '📷' },
  { key: 'story', label: 'قصة', icon: '📖' },
  { key: 'place', label: 'مكان', icon: '🏛️' },
];

export default function NewMemoryPage() {
  const router = useRouter();
  const { success, error: toastError } = useToast();
  const { user, loading: userLoading, dataOwnerName } = useCurrentUser();
  const [entityId, setEntityId] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ type: 'photo', title: '', description: '', image_url: '', location: '', story_text: '' });

  useEffect(() => {
    if (userLoading) return;
    if (!user) { router.replace('/login'); return; }
    const stored = JSON.parse(localStorage.getItem('sanad_entity') || 'null');
    if (stored?.parent_entity_id) setEntityId(stored.parent_entity_id);
    else if (dataOwnerName) supabase.from('entities').select('id').eq('display_name', dataOwnerName).maybeSingle().then(({ data }) => { if (data) setEntityId(data.id); });
  }, [user, userLoading, dataOwnerName, router]);

  async function uploadImage(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { toastError('حجم الصورة أقل من 5MB'); return; }
    setUploading(true);
    try {
      const ext = file.name.split('.').pop();
      const name = `memory/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
      const { error } = await supabase.storage.from('sanad-files').upload(name, file);
      if (error) throw error;
      const { data: url } = supabase.storage.from('sanad-files').getPublicUrl(name);
      setForm({ ...form, image_url: url.publicUrl });
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
        entity_id: entityId, provider_name: dataOwnerName,
        type: form.type, title: form.title.trim(),
        description: form.description.trim() || null,
        image_url: form.image_url || null,
        location: form.location.trim() || null,
        story_text: form.story_text.trim() || null,
        is_active: true,
      };
      const { error } = await supabase.from('memory_posts').insert(payload);
      if (error) throw error;
      success('🎉 تم نشر الذكرى');
      router.push('/merchant/memory');
    } catch (err) { console.error(err); toastError('فشل النشر'); }
    finally { setSaving(false); }
  }

  if (userLoading) return <div style={{ padding: 80, textAlign: 'center' }}>⏳</div>;

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', paddingBottom: 100 }}>
      <div style={{ background: '#0f4d3a', padding: '16px 20px', position: 'sticky', top: 0, zIndex: 20, display: 'flex', alignItems: 'center', gap: 12 }}>
        <button onClick={() => router.back()} style={{ background: 'none', border: 'none', color: '#fff', fontSize: 20, cursor: 'pointer' }}>←</button>
        <h1 style={{ color: '#fff', fontSize: 18, fontWeight: 900, margin: 0 }}>📸 ذكرى جديدة</h1>
      </div>

      <form onSubmit={handleSubmit} style={{ padding: 16, maxWidth: 600, margin: '0 auto' }}>
        <div style={{ background: '#fff', borderRadius: 16, padding: 16, marginBottom: 16, border: '1px solid #e2e8f0', textAlign: 'center' }}>
          <label style={{ cursor: uploading ? 'wait' : 'pointer', display: 'block' }}>
            <input type="file" accept="image/*" onChange={uploadImage} style={{ display: 'none' }} disabled={uploading} />
            {form.image_url ? <div style={{ position: 'relative', width: '100%', height: 180, borderRadius: 12, overflow: 'hidden' }}><img src={form.image_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /></div> : <div style={{ width: '100%', height: 180, background: '#f8fafc', borderRadius: 12, border: '2px dashed #cbd5e1', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 6 }}><div style={{ fontSize: 32 }}>{uploading ? '⏳' : '📸'}</div><div style={{ fontSize: 12, fontWeight: 900, color: '#64748b' }}>{uploading ? 'جارٍ الرفع...' : 'صورة (اختياري)'}</div></div>}
          </label>
        </div>

        <div style={{ background: '#fff', borderRadius: 16, padding: 20, marginBottom: 16, border: '1px solid #e2e8f0' }}>
          <div style={{ marginBottom: 12 }}>
            <label style={labelStyle}>النوع</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6 }}>
              {TYPES.map(t => (
                <button key={t.key} type="button" onClick={() => setForm({ ...form, type: t.key })} style={{ padding: 10, background: form.type === t.key ? 'rgba(16,185,129,0.1)' : '#f8fafc', color: form.type === t.key ? '#059669' : '#475569', border: form.type === t.key ? '2px solid #10b981' : '1px solid #e2e8f0', borderRadius: 8, fontSize: 11, fontWeight: 900, cursor: 'pointer', fontFamily: 'inherit' }}>{t.icon} {t.label}</button>
              ))}
            </div>
          </div>
          <div style={{ marginBottom: 12 }}><label style={labelStyle}>العنوان *</label><input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required style={inputStyle} /></div>
          <div style={{ marginBottom: 12 }}><label style={labelStyle}>الوصف</label><textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} style={{ ...inputStyle, height: 60, resize: 'none' }} /></div>
          <div style={{ marginBottom: 12 }}><label style={labelStyle}>المكان</label><input value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} style={inputStyle} /></div>
          <div><label style={labelStyle}>القصة (اختياري)</label><textarea value={form.story_text} onChange={e => setForm({ ...form, story_text: e.target.value })} style={{ ...inputStyle, height: 100, resize: 'none' }} /></div>
        </div>

        <button type="submit" disabled={saving || uploading} style={{ width: '100%', padding: 16, background: (saving || uploading) ? '#94a3b8' : 'linear-gradient(135deg, #10b981, #059669)', color: '#fff', border: 'none', borderRadius: 14, fontWeight: 900, fontSize: 16, cursor: (saving || uploading) ? 'wait' : 'pointer', fontFamily: 'inherit', boxShadow: '0 6px 20px rgba(16,185,129,0.3)' }}>
          {saving ? '⏳ جارٍ النشر...' : '✓ نشر الذكرى'}
        </button>
      </form>
    </div>
  );
}

const labelStyle = { display: 'block', fontSize: 12, fontWeight: 800, color: '#475569', marginBottom: 6 };
const inputStyle = { width: '100%', padding: '12px 14px', borderRadius: 10, border: '1px solid #cbd5e1', fontSize: 14, fontFamily: 'inherit', boxSizing: 'border-box', outline: 'none', background: '#f8fafc' };
