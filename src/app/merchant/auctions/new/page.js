'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useCurrentUser } from '@/lib/useCurrentUser';
import { useToast } from '@/components/Toast';

export default function NewAuctionPage() {
  const router = useRouter();
  const { success, error: toastError } = useToast();
  const { user, loading: userLoading, dataOwnerName } = useCurrentUser();
  const [entityId, setEntityId] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    title: '', description: '', starting_price: '', min_increment: '100',
    ends_at: '', phone: '', whatsapp: '', image_url: ''
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
      const name = `auctions/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
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
    if (!form.starting_price || Number(form.starting_price) <= 0) { toastError('السعر الابتدائي مطلوب'); return; }
    if (!form.ends_at) { toastError('تاريخ الانتهاء مطلوب'); return; }
    if (new Date(form.ends_at) <= new Date()) { toastError('تاريخ الانتهاء يجب أن يكون في المستقبل'); return; }

    setSaving(true);
    try {
      const payload = {
        entity_id: entityId, provider_name: dataOwnerName,
        title: form.title.trim(), description: form.description.trim() || null,
        starting_price: Number(form.starting_price),
        current_price: Number(form.starting_price),
        min_increment: Number(form.min_increment) || 100,
        ends_at: new Date(form.ends_at).toISOString(),
        phone: form.phone.trim() || null, whatsapp: form.whatsapp.trim() || null,
        image_url: form.image_url || null, status: 'active'
      };
      const { error } = await supabase.from('auctions').insert(payload);
      if (error) throw error;
      success('🎉 تم نشر المزاد');
      router.push('/merchant/auctions');
    } catch (err) { console.error(err); toastError('فشل النشر'); }
    finally { setSaving(false); }
  }

  if (userLoading) return <div style={{ padding: 80, textAlign: 'center' }}>⏳</div>;

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', paddingBottom: 100 }}>
      <div style={{ background: '#0f4d3a', padding: '16px 20px', position: 'sticky', top: 0, zIndex: 20, display: 'flex', alignItems: 'center', gap: 12 }}>
        <button onClick={() => router.back()} style={{ background: 'none', border: 'none', color: '#fff', fontSize: 20, cursor: 'pointer' }}>←</button>
        <h1 style={{ color: '#fff', fontSize: 18, fontWeight: 900, margin: 0 }}>🏆 مزاد جديد</h1>
      </div>

      <form onSubmit={handleSubmit} style={{ padding: 16, maxWidth: 600, margin: '0 auto' }}>
        <div style={{ background: '#fff', borderRadius: 16, padding: 16, marginBottom: 16, border: '1px solid #e2e8f0', textAlign: 'center' }}>
          <label style={{ cursor: uploading ? 'wait' : 'pointer', display: 'block' }}>
            <input type="file" accept="image/*" onChange={uploadImage} style={{ display: 'none' }} disabled={uploading} />
            {form.image_url ? <div style={{ position: 'relative', width: '100%', height: 180, borderRadius: 12, overflow: 'hidden' }}><img src={form.image_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /></div> : <div style={{ width: '100%', height: 180, background: '#f8fafc', borderRadius: 12, border: '2px dashed #cbd5e1', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 6 }}><div style={{ fontSize: 32 }}>{uploading ? '⏳' : '📸'}</div><div style={{ fontSize: 12, fontWeight: 900, color: '#64748b' }}>{uploading ? 'جارٍ الرفع...' : 'صورة المنتج / السلعة'}</div></div>}
          </label>
        </div>

        <div style={{ background: '#fff', borderRadius: 16, padding: 20, marginBottom: 16, border: '1px solid #e2e8f0' }}>
          <div style={{ marginBottom: 12 }}><label style={labelStyle}>عنوان المزاد *</label><input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required style={inputStyle} placeholder="مثال: ساعة أثرية نادرة" /></div>
          <div style={{ marginBottom: 12 }}><label style={labelStyle}>الوصف</label><textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} style={{ ...inputStyle, height: 80, resize: 'none' }} placeholder="تفاصيل السلعة، حالتها، تاريخها..." /></div>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
            <div><label style={labelStyle}>السعر الابتدائي (ل.س) *</label><input type="number" value={form.starting_price} onChange={e => setForm({ ...form, starting_price: e.target.value })} required style={inputStyle} placeholder="0" /></div>
            <div><label style={labelStyle}>الحد الأدنى للزيادة</label><input type="number" value={form.min_increment} onChange={e => setForm({ ...form, min_increment: e.target.value })} style={inputStyle} placeholder="100" /></div>
          </div>
          
          <div style={{ marginBottom: 12 }}><label style={labelStyle}>تاريخ ووقت الانتهاء *</label><input type="datetime-local" value={form.ends_at} onChange={e => setForm({ ...form, ends_at: e.target.value })} required style={inputStyle} /></div>
        </div>

        <div style={{ background: '#fff', borderRadius: 16, padding: 20, marginBottom: 16, border: '1px solid #e2e8f0' }}>
          <h3 style={{ fontSize: 14, fontWeight: 900, marginTop: 0, marginBottom: 12 }}>📞 للتواصل</h3>
          <div style={{ marginBottom: 12 }}><label style={labelStyle}>الهاتف</label><input type="tel" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} style={inputStyle} /></div>
          <div><label style={labelStyle}>واتساب</label><input type="tel" value={form.whatsapp} onChange={e => setForm({ ...form, whatsapp: e.target.value })} style={inputStyle} /></div>
        </div>

        <button type="submit" disabled={saving || uploading} style={{ width: '100%', padding: 16, background: (saving || uploading) ? '#94a3b8' : 'linear-gradient(135deg, #10b981, #059669)', color: '#fff', border: 'none', borderRadius: 14, fontWeight: 900, fontSize: 16, cursor: (saving || uploading) ? 'wait' : 'pointer', fontFamily: 'inherit', boxShadow: '0 6px 20px rgba(16,185,129,0.3)' }}>
          {saving ? '⏳ جارٍ النشر...' : '✓ نشر المزاد'}
        </button>
      </form>
    </div>
  );
}

const labelStyle = { display: 'block', fontSize: 12, fontWeight: 800, color: '#475569', marginBottom: 6 };
const inputStyle = { width: '100%', padding: '12px 14px', borderRadius: 10, border: '1px solid #cbd5e1', fontSize: 14, fontFamily: 'inherit', boxSizing: 'border-box', outline: 'none', background: '#f8fafc' };
