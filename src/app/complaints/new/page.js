'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/components/Toast';

const CATEGORIES = [
  { key: 'road', label: 'طرق وأرصفة', icon: '🛣️' },
  { key: 'water', label: 'مياه وصرف', icon: '💧' },
  { key: 'electricity', label: 'كهرباء', icon: '⚡' },
  { key: 'cleaning', label: 'نظافة', icon: '🧹' },
  { key: 'park', label: 'حدائق', icon: '🌳' },
  { key: 'building', label: 'مخالفات بناء', icon: '🏗️' },
  { key: 'noise', label: 'ضوضاء', icon: '🔊' },
  { key: 'other', label: 'أخرى', icon: '📌' },
];

export default function NewComplaintPage() {
  const router = useRouter();
  const { success, error: toastError } = useToast();
  const [municipalities, setMunicipalities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [form, setForm] = useState({
    entity_id: '', citizen_name: '', citizen_phone: '', title: '',
    description: '', category: 'road', location: '', image_url: '',
  });

  useEffect(() => {
    loadMunicipalities();
    try {
      const cust = JSON.parse(localStorage.getItem('sanad_customer') || 'null');
      if (cust) setForm(f => ({ ...f, citizen_name: cust.name || '', citizen_phone: cust.phone || '' }));
    } catch {}
  }, []);

  async function loadMunicipalities() {
    if (!supabase) return;
    setLoading(true);
    try {
      const { data } = await supabase.from('entities').select('id, display_name').eq('entity_type', 'municipality').eq('approval_status', 'approved');
      setMunicipalities(data || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }

  async function uploadImage(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { toastError('حجم الصورة أقل من 5MB'); return; }
    setUploading(true);
    try {
      const ext = file.name.split('.').pop();
      const name = `complaints/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
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
    if (!form.entity_id) { toastError('اختر البلدية'); return; }
    if (!form.citizen_name.trim() || !form.citizen_phone.trim()) { toastError('الاسم والهاتف مطلوبان'); return; }
    if (!form.title.trim()) { toastError('عنوان الشكوى مطلوب'); return; }
    setSaving(true);
    try {
      const chosen = municipalities.find(m => m.id === form.entity_id);
      const payload = {
        entity_id: form.entity_id,
        provider_name: chosen?.display_name || '',
        citizen_name: form.citizen_name.trim(),
        citizen_phone: form.citizen_phone.trim(),
        title: form.title.trim(),
        description: form.description.trim() || null,
        category: form.category,
        location: form.location.trim() || null,
        image_url: form.image_url || null,
        status: 'pending',
      };
      const { error } = await supabase.from('municipal_complaints').insert(payload);
      if (error) throw error;
      success('🎉 تم إرسال الشكوى بنجاح');
      router.push('/');
    } catch (err) { console.error(err); toastError('فشل الإرسال'); }
    finally { setSaving(false); }
  }

  if (loading) return <div style={{ padding: 80, textAlign: 'center' }}>⏳</div>;

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', paddingBottom: 100 }}>
      <div style={{ background: '#0f4d3a', padding: '16px 20px', position: 'sticky', top: 0, zIndex: 20, display: 'flex', alignItems: 'center', gap: 12 }}>
        <button onClick={() => router.back()} style={{ background: 'none', border: 'none', color: '#fff', fontSize: 20, cursor: 'pointer' }}>←</button>
        <h1 style={{ color: '#fff', fontSize: 18, fontWeight: 900, margin: 0 }}>📢 تقديم شكوى</h1>
      </div>

      <form onSubmit={handleSubmit} style={{ padding: 16, maxWidth: 600, margin: '0 auto' }}>
        <div style={{ background: '#fff', borderRadius: 16, padding: 20, marginBottom: 16, border: '1px solid #e2e8f0' }}>
          <div style={{ marginBottom: 12 }}>
            <label style={labelStyle}>البلدية *</label>
            <select value={form.entity_id} onChange={e => setForm({ ...form, entity_id: e.target.value })} required style={inputStyle}>
              <option value="">— اختر البلدية —</option>
              {municipalities.map(m => <option key={m.id} value={m.id}>{m.display_name}</option>)}
            </select>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
            <div><label style={labelStyle}>الاسم *</label><input value={form.citizen_name} onChange={e => setForm({ ...form, citizen_name: e.target.value })} required style={inputStyle} /></div>
            <div><label style={labelStyle}>الهاتف *</label><input type="tel" value={form.citizen_phone} onChange={e => setForm({ ...form, citizen_phone: e.target.value })} required style={inputStyle} /></div>
          </div>
          <div style={{ marginBottom: 12 }}><label style={labelStyle}>عنوان الشكوى *</label><input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required style={inputStyle} placeholder="مثال: حفرة في الطريق" /></div>
          <div style={{ marginBottom: 12 }}><label style={labelStyle}>التصنيف</label><select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} style={inputStyle}>{CATEGORIES.map(c => <option key={c.key} value={c.key}>{c.icon} {c.label}</option>)}</select></div>
          <div style={{ marginBottom: 12 }}><label style={labelStyle}>الموقع</label><input value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} style={inputStyle} placeholder="الحي، الشارع..." /></div>
          <div style={{ marginBottom: 12 }}><label style={labelStyle}>الوصف</label><textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} style={{ ...inputStyle, height: 80, resize: 'none' }} /></div>
          <label style={{ cursor: uploading ? 'wait' : 'pointer', display: 'block' }}>
            <input type="file" accept="image/*" onChange={uploadImage} style={{ display: 'none' }} disabled={uploading} />
            {form.image_url ? <div style={{ position: 'relative', width: '100%', height: 120, borderRadius: 10, overflow: 'hidden' }}><img src={form.image_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /></div> : <div style={{ width: '100%', height: 120, background: '#f8fafc', borderRadius: 10, border: '2px dashed #cbd5e1', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, fontSize: 12, color: '#64748b' }}>{uploading ? '⏳' : '📸'} إرفاق صورة (اختياري)</div>}
          </label>
        </div>

        <button type="submit" disabled={saving || uploading} style={{ width: '100%', padding: 16, background: (saving || uploading) ? '#94a3b8' : 'linear-gradient(135deg, #10b981, #059669)', color: '#fff', border: 'none', borderRadius: 14, fontWeight: 900, fontSize: 16, cursor: (saving || uploading) ? 'wait' : 'pointer', fontFamily: 'inherit', boxShadow: '0 6px 20px rgba(16,185,129,0.3)' }}>
          {saving ? '⏳ جارٍ الإرسال...' : '📢 إرسال الشكوى'}
        </button>
      </form>
    </div>
  );
}

const labelStyle = { display: 'block', fontSize: 12, fontWeight: 800, color: '#475569', marginBottom: 6 };
const inputStyle = { width: '100%', padding: '12px 14px', borderRadius: 10, border: '1px solid #cbd5e1', fontSize: 14, fontFamily: 'inherit', boxSizing: 'border-box', outline: 'none', background: '#f8fafc' };
