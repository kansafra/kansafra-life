'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/components/Toast';

const VEHICLE_TYPES = [
  { key: 'motorcycle', label: 'دراجة نارية', icon: '🏍️' },
  { key: 'car', label: 'سيارة', icon: '🚗' },
  { key: 'van', label: 'فان / شاحنة صغيرة', icon: '🚐' },
  { key: 'truck', label: 'شاحنة', icon: '🚚' },
  { key: 'bicycle', label: 'دراجة هوائية', icon: '🚲' },
];

export default function DriverRegisterPage() {
  const router = useRouter();
  const { success, error: toastError } = useToast();
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [alreadyRegistered, setAlreadyRegistered] = useState(false);
  const [form, setForm] = useState({
    full_name: '', phone: '', vehicle_type: 'motorcycle', vehicle_number: '',
    city: '', area: '', image_url: '',
  });

  useEffect(() => {
    try {
      const cust = JSON.parse(localStorage.getItem('sanad_customer') || 'null');
      if (cust) setForm(f => ({ ...f, full_name: cust.name || '', phone: cust.phone || '' }));
    } catch {}
    checkIfRegistered();
  }, []);

  async function checkIfRegistered() {
    if (!supabase) return;
    try {
      const cust = JSON.parse(localStorage.getItem('sanad_customer') || 'null');
      if (!cust?.phone) return;
      const { data } = await supabase.from('delivery_drivers').select('id').eq('phone', cust.phone).maybeSingle();
      if (data) setAlreadyRegistered(true);
    } catch {}
  }

  async function uploadImage(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { toastError('حجم الصورة أقل من 5MB'); return; }
    setUploading(true);
    try {
      const ext = file.name.split('.').pop();
      const name = `drivers/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
      const { error } = await supabase.storage.from('sanad-files').upload(name, file);
      if (error) throw error;
      const { data: url } = await supabase.storage.from('sanad-files').getPublicUrl(name);
      setForm({ ...form, image_url: url.publicUrl });
      success('✅ تم رفع الصورة');
    } catch (err) { toastError('فشل الرفع'); }
    finally { setUploading(false); }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.full_name.trim()) { toastError('الاسم مطلوب'); return; }
    if (!form.phone.trim()) { toastError('الهاتف مطلوب'); return; }
    setSaving(true);
    try {
      const payload = {
        full_name: form.full_name.trim(),
        phone: form.phone.trim(),
        vehicle_type: form.vehicle_type,
        vehicle_number: form.vehicle_number.trim() || null,
        city: form.city.trim() || null,
        area: form.area.trim() || null,
        image_url: form.image_url || null,
        is_available: false,
        is_approved: false,
      };
      const { error } = await supabase.from('delivery_drivers').insert(payload);
      if (error) throw error;
      success('🎉 تم استلام طلبك! سيتم مراجعته من قِبَل الإدارة');
      router.push('/delivery');
    } catch (err) { console.error(err); toastError('فشل التسجيل'); }
    finally { setSaving(false); }
  }

  if (alreadyRegistered) {
    return (
      <div style={{ minHeight: '100vh', background: '#f8fafc', padding: 20, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ background: '#fff', borderRadius: 20, padding: 40, maxWidth: 400, textAlign: 'center', boxShadow: '0 10px 30px rgba(0,0,0,0.05)' }}>
          <div style={{ fontSize: 60, marginBottom: 12 }}>✅</div>
          <h2 style={{ fontSize: 20, fontWeight: 900, color: '#0f172a', marginBottom: 12 }}>أنت مسجل مسبقاً</h2>
          <p style={{ fontSize: 13, color: '#64748b', marginBottom: 20 }}>حسابك موجود كسائق. يمكنك العودة للصفحة الرئيسية.</p>
          <Link href="/delivery" style={{ display: 'inline-block', background: '#0f4d3a', color: '#fff', padding: '12px 24px', borderRadius: 10, textDecoration: 'none', fontSize: 14, fontWeight: 900 }}>← صفحة التوصيل</Link>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', paddingBottom: 100 }}>
      <div style={{ background: '#0f4d3a', padding: '16px 20px', position: 'sticky', top: 0, zIndex: 20, display: 'flex', alignItems: 'center', gap: 12 }}>
        <button onClick={() => router.back()} style={{ background: 'none', border: 'none', color: '#fff', fontSize: 20, cursor: 'pointer' }}>←</button>
        <h1 style={{ color: '#fff', fontSize: 18, fontWeight: 900, margin: 0 }}>🚚 انضم كسائق</h1>
      </div>

      <div style={{ padding: 16, maxWidth: 600, margin: '0 auto' }}>
        <div style={{ background: 'linear-gradient(135deg, #0ea5e9, #0284c7)', borderRadius: 16, padding: 20, color: '#fff', marginBottom: 16, textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: 8 }}>🚚</div>
          <h2 style={{ fontSize: 20, fontWeight: 900, margin: '0 0 6px' }}>كن سائق توصيل</h2>
          <p style={{ fontSize: 12, opacity: 0.9, margin: 0 }}>أربح دخلاً إضافياً في وقتك الحر</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ background: '#fff', borderRadius: 16, padding: 20, marginBottom: 16, border: '1px solid #e2e8f0' }}>
            <div style={{ marginBottom: 12 }}>
              <label style={labelStyle}>الاسم الكامل *</label>
              <input value={form.full_name} onChange={e => setForm({ ...form, full_name: e.target.value })} required style={inputStyle} />
            </div>
            <div style={{ marginBottom: 12 }}>
              <label style={labelStyle}>رقم الهاتف *</label>
              <input type="tel" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} required style={inputStyle} />
            </div>
            <div style={{ marginBottom: 12 }}>
              <label style={labelStyle}>نوع المركبة</label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 6 }}>
                {VEHICLE_TYPES.map(v => (
                  <button key={v.key} type="button" onClick={() => setForm({ ...form, vehicle_type: v.key })} style={{ padding: 10, background: form.vehicle_type === v.key ? 'rgba(14,165,233,0.1)' : '#f8fafc', color: form.vehicle_type === v.key ? '#0284c7' : '#475569', border: form.vehicle_type === v.key ? '2px solid #0ea5e9' : '1px solid #e2e8f0', borderRadius: 8, fontSize: 11, fontWeight: 900, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 4, justifyContent: 'center' }}>{v.icon} {v.label}</button>
                ))}
              </div>
            </div>
            <div style={{ marginBottom: 12 }}>
              <label style={labelStyle}>رقم المركبة (اختياري)</label>
              <input value={form.vehicle_number} onChange={e => setForm({ ...form, vehicle_number: e.target.value })} style={inputStyle} placeholder="مثال: 123456" />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div><label style={labelStyle}>المدينة</label><input value={form.city} onChange={e => setForm({ ...form, city: e.target.value })} style={inputStyle} /></div>
              <div><label style={labelStyle}>الحي</label><input value={form.area} onChange={e => setForm({ ...form, area: e.target.value })} style={inputStyle} /></div>
            </div>
          </div>

          <div style={{ background: '#fff', borderRadius: 16, padding: 20, marginBottom: 16, border: '1px solid #e2e8f0' }}>
            <label style={labelStyle}>صورة شخصية (اختياري)</label>
            <label style={{ cursor: uploading ? 'wait' : 'pointer', display: 'block' }}>
              <input type="file" accept="image/*" onChange={uploadImage} style={{ display: 'none' }} disabled={uploading} />
              {form.image_url ? <div style={{ width: '100%', height: 160, borderRadius: 12, overflow: 'hidden' }}><img src={form.image_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /></div> : <div style={{ width: '100%', height: 120, background: '#f8fafc', borderRadius: 12, border: '2px dashed #cbd5e1', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, fontSize: 12, color: '#64748b' }}>{uploading ? '⏳ جارٍ الرفع...' : '📸 اضغط لرفع صورة'}</div>}
            </label>
          </div>

          <div style={{ background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.3)', borderRadius: 10, padding: 12, marginBottom: 16 }}>
            <div style={{ fontSize: 11.5, color: '#92400e', fontWeight: 800, lineHeight: 1.6 }}>
              ⏳ <strong>ملاحظة:</strong> بعد التسجيل، سيتم مراجعة طلبك من قِبَل الإدارة خلال 24 ساعة. سيتم تفعيل حسابك بعد الموافقة.
            </div>
          </div>

          <button type="submit" disabled={saving || uploading} style={{ width: '100%', padding: 16, background: (saving || uploading) ? '#94a3b8' : 'linear-gradient(135deg, #0ea5e9, #0284c7)', color: '#fff', border: 'none', borderRadius: 14, fontWeight: 900, fontSize: 16, cursor: (saving || uploading) ? 'wait' : 'pointer', fontFamily: 'inherit', boxShadow: '0 6px 20px rgba(14,165,233,0.3)' }}>
            {saving ? '⏳ جارٍ التسجيل...' : '🚚 تسجيل كسائق'}
          </button>
        </form>
      </div>
    </div>
  );
}

const labelStyle = { display: 'block', fontSize: 12, fontWeight: 800, color: '#475569', marginBottom: 6 };
const inputStyle = { width: '100%', padding: '12px 14px', borderRadius: 10, border: '1px solid #cbd5e1', fontSize: 14, fontFamily: 'inherit', boxSizing: 'border-box', outline: 'none', background: '#f8fafc' };
