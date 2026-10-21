'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useCurrentUser } from '@/lib/useCurrentUser';
import { useToast } from '@/components/Toast';

const CATEGORIES = [
  { key: 'religious', label: 'ديني', icon: '🕌' },
  { key: 'historical', label: 'تاريخي', icon: '🏛️' },
  { key: 'nature', label: 'طبيعة', icon: '🌳' },
  { key: 'entertainment', label: 'ترفيه', icon: '🎡' },
  { key: 'food', label: 'مطاعم', icon: '🍽️' },
  { key: 'park', label: 'حدائق', icon: '🌷' },
  { key: 'museum', label: 'متاحف', icon: '🏛️' },
  { key: 'other', label: 'أخرى', icon: '📸' },
];

export default function MerchantNewTourismPage() {
  const router = useRouter();
  const { success, error: toastError } = useToast();
  const { user, loading: userLoading, dataOwnerName } = useCurrentUser();
  const [entityId, setEntityId] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    title: '', description: '', category: 'historical', city: '', address: '',
    location: '', lat: '', lng: '', working_hours: '', entry_fee: '',
    phone: '', whatsapp: '', image_url: '', is_featured: false,
  });

  useEffect(() => {
    if (userLoading) return;
    if (!user) { router.replace('/login'); return; }
    const stored = JSON.parse(localStorage.getItem('sanad_entity') || 'null');
    if (stored?.parent_entity_id) setEntityId(stored.parent_entity_id);
    else if (dataOwnerName) {
      supabase.from('entities').select('id, phone').eq('display_name', dataOwnerName).maybeSingle().then(({ data }) => {
        if (data) { setEntityId(data.id); if (data.phone) setForm(f => ({ ...f, phone: data.phone })); }
      });
    }
  }, [user, userLoading, dataOwnerName, router]);

  async function uploadImage(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { toastError('حجم الصورة أقل من 5MB'); return; }
    setUploading(true);
    try {
      const ext = file.name.split('.').pop();
      const name = `tourism/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
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
      const { error } = await supabase.from('touristic_places').insert({
        entity_id: entityId, provider_name: dataOwnerName,
        title: form.title.trim(), description: form.description.trim() || null,
        category: form.category, city: form.city.trim() || null,
        address: form.address.trim() || null, location: form.location.trim() || null,
        lat: form.lat ? Number(form.lat) : null, lng: form.lng ? Number(form.lng) : null,
        working_hours: form.working_hours.trim() || null,
        entry_fee: form.entry_fee ? Number(form.entry_fee) : 0,
        phone: form.phone.trim() || null, whatsapp: form.whatsapp.trim() || null,
        image_url: form.image_url || null, is_featured: form.is_featured,
        is_active: true,
      });
      if (error) throw error;
      success('🎉 تم نشر المعلم السياحي');
      router.push('/merchant/tourism');
    } catch (err) { console.error(err); toastError('فشل النشر'); }
    finally { setSaving(false); }
  }

  if (userLoading) return <div style={{ padding: 80, textAlign: 'center' }}>⏳</div>;

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', paddingBottom: 100 }}>
      <div style={{ background: '#0f4d3a', padding: '16px 20px', position: 'sticky', top: 0, zIndex: 20, display: 'flex', alignItems: 'center', gap: 12 }}>
        <button onClick={() => router.back()} style={{ background: 'none', border: 'none', color: '#fff', fontSize: 20, cursor: 'pointer' }}>←</button>
        <h1 style={{ color: '#fff', fontSize: 18, fontWeight: 900, margin: 0 }}>🏛️ معلم سياحي جديد</h1>
      </div>

      <form onSubmit={handleSubmit} style={{ padding: 16, maxWidth: 600, margin: '0 auto' }}>
        <div style={{ background: '#fff', borderRadius: 16, padding: 16, marginBottom: 16, border: '1px solid #e2e8f0', textAlign: 'center' }}>
          <label style={{ cursor: uploading ? 'wait' : 'pointer', display: 'block' }}>
            <input type="file" accept="image/*" onChange={uploadImage} style={{ display: 'none' }} disabled={uploading} />
            {form.image_url ? (
              <div style={{ position: 'relative', width: '100%', height: 180, borderRadius: 12, overflow: 'hidden' }}>
                <img src={form.image_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
            ) : (
              <div style={{ width: '100%', height: 180, background: '#f8fafc', borderRadius: 12, border: '2px dashed #cbd5e1', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                <div style={{ fontSize: 36 }}>{uploading ? '⏳' : '📸'}</div>
                <div style={{ fontSize: 13, fontWeight: 900, color: '#64748b' }}>{uploading ? 'جارٍ الرفع...' : 'صورة المعلم'}</div>
              </div>
            )}
          </label>
        </div>

        <div style={{ background: '#fff', borderRadius: 16, padding: 20, marginBottom: 16, border: '1px solid #e2e8f0' }}>
          <div style={{ marginBottom: 12 }}>
            <label style={labelStyle}>اسم المعلم *</label>
            <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required style={inputStyle} placeholder="مثال: جامع كنصفرة الكبير" />
          </div>
          <div style={{ marginBottom: 12 }}>
            <label style={labelStyle}>الوصف</label>
            <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} style={{ ...inputStyle, height: 80, resize: 'none' }} placeholder="معلومات عن المكان..." />
          </div>
          <div>
            <label style={labelStyle}>التصنيف</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6 }}>
              {CATEGORIES.map(c => (
                <button key={c.key} type="button" onClick={() => setForm({ ...form, category: c.key })} style={catBtn(form.category === c.key)}>
                  <div style={{ fontSize: 18 }}>{c.icon}</div>
                  <div style={{ fontSize: 10, fontWeight: 900 }}>{c.label}</div>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div style={{ background: '#fff', borderRadius: 16, padding: 20, marginBottom: 16, border: '1px solid #e2e8f0' }}>
          <h2 style={{ fontSize: 14, fontWeight: 900, marginTop: 0, marginBottom: 12 }}>📍 الموقع</h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
            <div>
              <label style={labelStyle}>المدينة</label>
              <input value={form.city} onChange={e => setForm({ ...form, city: e.target.value })} style={inputStyle} placeholder="كنصفرة" />
            </div>
            <div>
              <label style={labelStyle}>الحي</label>
              <input value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} style={inputStyle} placeholder="الحي..." />
            </div>
          </div>
          <div style={{ marginBottom: 12 }}>
            <label style={labelStyle}>العنوان التفصيلي</label>
            <input value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} style={inputStyle} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={labelStyle}>Lat</label>
              <input type="number" step="0.000001" value={form.lat} onChange={e => setForm({ ...form, lat: e.target.value })} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Lng</label>
              <input type="number" step="0.000001" value={form.lng} onChange={e => setForm({ ...form, lng: e.target.value })} style={inputStyle} />
            </div>
          </div>
        </div>

        <div style={{ background: '#fff', borderRadius: 16, padding: 20, marginBottom: 16, border: '1px solid #e2e8f0' }}>
          <h2 style={{ fontSize: 14, fontWeight: 900, marginTop: 0, marginBottom: 12 }}>ℹ️ معلومات إضافية</h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
            <div>
              <label style={labelStyle}>ساعات العمل</label>
              <input value={form.working_hours} onChange={e => setForm({ ...form, working_hours: e.target.value })} style={inputStyle} placeholder="08:00 - 20:00" />
            </div>
            <div>
              <label style={labelStyle}>رسم الدخول (0 = مجاني)</label>
              <input type="number" value={form.entry_fee} onChange={e => setForm({ ...form, entry_fee: e.target.value })} style={inputStyle} placeholder="0" />
            </div>
          </div>
          <div style={{ marginBottom: 12 }}>
            <label style={labelStyle}>الهاتف</label>
            <input type="tel" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} style={inputStyle} placeholder="09xxxxxxxx" />
          </div>
          <div style={{ marginBottom: 12 }}>
            <label style={labelStyle}>واتساب</label>
            <input type="tel" value={form.whatsapp} onChange={e => setForm({ ...form, whatsapp: e.target.value })} style={inputStyle} placeholder="09xxxxxxxx" />
          </div>
          <label style={{ display: 'flex', alignItems: 'center', gap: 10, padding: 12, background: '#f8fafc', borderRadius: 10, border: '1px solid #e2e8f0', cursor: 'pointer' }}>
            <input type="checkbox" checked={form.is_featured} onChange={e => setForm({ ...form, is_featured: e.target.checked })} style={{ width: 18, height: 18 }} />
            <span style={{ fontSize: 13, fontWeight: 800 }}>⭐ معلم مميز (يظهر أولاً)</span>
          </label>
        </div>

        <button type="submit" disabled={saving || uploading} style={{ width: '100%', padding: 16, background: (saving || uploading) ? '#94a3b8' : 'linear-gradient(135deg, #10b981, #059669)', color: '#fff', border: 'none', borderRadius: 14, fontWeight: 900, fontSize: 16, cursor: (saving || uploading) ? 'wait' : 'pointer', fontFamily: 'inherit', boxShadow: '0 6px 20px rgba(16,185,129,0.3)' }}>
          {saving ? '⏳ جارٍ النشر...' : '🏛️ نشر المعلم'}
        </button>
      </form>
    </div>
  );
}

const labelStyle = { display: 'block', fontSize: 12, fontWeight: 800, color: '#475569', marginBottom: 6 };
const inputStyle = { width: '100%', padding: '12px 14px', borderRadius: 10, border: '1px solid #cbd5e1', fontSize: 14, fontFamily: 'inherit', boxSizing: 'border-box', outline: 'none', background: '#f8fafc' };
const catBtn = (active) => ({ padding: 8, background: active ? 'rgba(16,185,129,0.1)' : '#f8fafc', color: active ? '#059669' : '#475569', border: active ? '2px solid #10b981' : '1px solid #e2e8f0', borderRadius: 8, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 });
