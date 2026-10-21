'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useCurrentUser } from '@/lib/useCurrentUser';
import { useToast } from '@/components/Toast';

const WORKSHOP_TYPES = [
  { key: 'metal', label: 'حدادة', icon: '🔨' },
  { key: 'aluminum', label: 'ألمنيوم', icon: '🪟' },
  { key: 'carpentry', label: 'نجارة', icon: '🪚' },
  { key: 'blacksmith', label: 'حدادة فنية', icon: '⚒️' },
  { key: 'upholstery', label: 'تنجيد', icon: '🪑' },
  { key: 'glass', label: 'زجاج', icon: '🔍' },
  { key: 'marble', label: 'رخام', icon: '🪨' },
  { key: 'other', label: 'ورشات أخرى', icon: '🏭' },
];

export default function NewWorkshopPage() {
  const router = useRouter();
  const { success, error: toastError } = useToast();
  const { user, loading: userLoading, dataOwnerName } = useCurrentUser();
  const [entityId, setEntityId] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ workshop_type: 'metal', name: '', description: '', phone: '', whatsapp: '', city: '', address: '', image_url: '', experience_years: '' });

  useEffect(() => {
    if (userLoading) return;
    if (!user) { router.replace('/login'); return; }
    const stored = JSON.parse(localStorage.getItem('sanad_entity') || 'null');
    if (stored?.parent_entity_id) setEntityId(stored.parent_entity_id);
    else if (dataOwnerName) supabase.from('entities').select('id, phone').eq('display_name', dataOwnerName).maybeSingle().then(({ data }) => { if (data) { setEntityId(data.id); if (data.phone) setForm(f => ({ ...f, phone: data.phone })); } });
  }, [user, userLoading, dataOwnerName, router]);

  async function uploadImage(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { toastError('حجم الصورة أقل من 5MB'); return; }
    setUploading(true);
    try {
      const ext = file.name.split('.').pop();
      const name = `workshops/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
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
    if (!form.name.trim()) { toastError('اسم الورشة مطلوب'); return; }
    if (!form.phone.trim()) { toastError('رقم الهاتف مطلوب'); return; }
    setSaving(true);
    try {
      const payload = {
        entity_id: entityId, provider_name: dataOwnerName,
        workshop_type: form.workshop_type, name: form.name.trim(),
        description: form.description.trim() || null, city: form.city.trim() || null,
        address: form.address.trim() || null,
        phone: form.phone.trim(), whatsapp: form.whatsapp.trim() || null,
        image_url: form.image_url || null,
        experience_years: form.experience_years ? Number(form.experience_years) : null,
        is_active: true,
      };
      const { error } = await supabase.from('workshops').insert(payload);
      if (error) throw error;
      success('🎉 تم نشر الورشة');
      router.push('/merchant/workshops');
    } catch (err) { console.error(err); toastError('فشل النشر'); }
    finally { setSaving(false); }
  }

  if (userLoading) return <div style={{ padding: 80, textAlign: 'center' }}>⏳</div>;

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', paddingBottom: 100 }}>
      <div style={{ background: '#0f4d3a', padding: '16px 20px', position: 'sticky', top: 0, zIndex: 20, display: 'flex', alignItems: 'center', gap: 12 }}>
        <button onClick={() => router.back()} style={{ background: 'none', border: 'none', color: '#fff', fontSize: 20, cursor: 'pointer' }}>←</button>
        <h1 style={{ color: '#fff', fontSize: 18, fontWeight: 900, margin: 0 }}>🏭 ورشة جديدة</h1>
      </div>

      <form onSubmit={handleSubmit} style={{ padding: 16, maxWidth: 600, margin: '0 auto' }}>
        <div style={{ background: '#fff', borderRadius: 16, padding: 16, marginBottom: 16, border: '1px solid #e2e8f0', textAlign: 'center' }}>
          <label style={{ cursor: uploading ? 'wait' : 'pointer', display: 'block' }}>
            <input type="file" accept="image/*" onChange={uploadImage} style={{ display: 'none' }} disabled={uploading} />
            {form.image_url ? <div style={{ position: 'relative', width: '100%', height: 160, borderRadius: 12, overflow: 'hidden' }}><img src={form.image_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /></div> : <div style={{ width: '100%', height: 160, background: '#f8fafc', borderRadius: 12, border: '2px dashed #cbd5e1', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 6 }}><div style={{ fontSize: 32 }}>{uploading ? '⏳' : '📸'}</div><div style={{ fontSize: 12, fontWeight: 900, color: '#64748b' }}>{uploading ? 'جارٍ الرفع...' : 'صورة الورشة (اختياري)'}</div></div>}
          </label>
        </div>

        <div style={{ background: '#fff', borderRadius: 16, padding: 20, marginBottom: 16, border: '1px solid #e2e8f0' }}>
          <div style={{ marginBottom: 12 }}>
            <label style={labelStyle}>نوع الورشة</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 6 }}>
              {WORKSHOP_TYPES.map(t => (
                <button key={t.key} type="button" onClick={() => setForm({ ...form, workshop_type: t.key })} style={{ padding: 10, background: form.workshop_type === t.key ? 'rgba(16,185,129,0.1)' : '#f8fafc', color: form.workshop_type === t.key ? '#059669' : '#475569', border: form.workshop_type === t.key ? '2px solid #10b981' : '1px solid #e2e8f0', borderRadius: 8, fontSize: 11, fontWeight: 900, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 4, justifyContent: 'center' }}>{t.icon} {t.label}</button>
              ))}
            </div>
          </div>
          <div style={{ marginBottom: 12 }}><label style={labelStyle}>اسم الورشة *</label><input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required style={inputStyle} placeholder="مثال: ورشة الأمل للحدادة" /></div>
          <div style={{ marginBottom: 12 }}><label style={labelStyle}>الوصف</label><textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} style={{ ...inputStyle, height: 80, resize: 'none' }} placeholder="المنتجات، الخدمات، سنوات الخبرة..." /></div>
          <div style={{ marginBottom: 12 }}><label style={labelStyle}>سنوات الخبرة</label><input type="number" value={form.experience_years} onChange={e => setForm({ ...form, experience_years: e.target.value })} style={inputStyle} placeholder="10" /></div>
        </div>

        <div style={{ background: '#fff', borderRadius: 16, padding: 20, marginBottom: 16, border: '1px solid #e2e8f0' }}>
          <div style={{ marginBottom: 12 }}><label style={labelStyle}>المدينة</label><input value={form.city} onChange={e => setForm({ ...form, city: e.target.value })} style={inputStyle} placeholder="كنصفرة" /></div>
          <div style={{ marginBottom: 12 }}><label style={labelStyle}>العنوان</label><input value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} style={inputStyle} /></div>
          <div style={{ marginBottom: 12 }}><label style={labelStyle}>الهاتف *</label><input type="tel" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} required style={inputStyle} placeholder="09xxxxxxxx" /></div>
          <div><label style={labelStyle}>واتساب</label><input type="tel" value={form.whatsapp} onChange={e => setForm({ ...form, whatsapp: e.target.value })} style={inputStyle} /></div>
        </div>

        <button type="submit" disabled={saving || uploading} style={{ width: '100%', padding: 16, background: (saving || uploading) ? '#94a3b8' : 'linear-gradient(135deg, #10b981, #059669)', color: '#fff', border: 'none', borderRadius: 14, fontWeight: 900, fontSize: 16, cursor: (saving || uploading) ? 'wait' : 'pointer', fontFamily: 'inherit', boxShadow: '0 6px 20px rgba(16,185,129,0.3)' }}>
          {saving ? '⏳ جارٍ النشر...' : '✓ نشر الورشة'}
        </button>
      </form>
    </div>
  );
}

const labelStyle = { display: 'block', fontSize: 12, fontWeight: 800, color: '#475569', marginBottom: 6 };
const inputStyle = { width: '100%', padding: '12px 14px', borderRadius: 10, border: '1px solid #cbd5e1', fontSize: 14, fontFamily: 'inherit', boxSizing: 'border-box', outline: 'none', background: '#f8fafc' };
