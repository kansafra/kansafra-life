'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useCurrentUser } from '@/lib/useCurrentUser';
import { useToast } from '@/components/Toast';
import Link from 'next/link';
// link-to-team-injected

export default function MerchantSettingsPage() {
  const { success, error: toastError } = useToast();
  const { user, loading: userLoading, dataOwnerName } = useCurrentUser();

  const [entity, setEntity] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);

  const [form, setForm] = useState({
    display_name: '', description: '', phone: '', whatsapp: '',
    address: '', city: '', lat: '', lng: '',
    working_hours: '09:00 - 21:00',
    delivery_fee: '0', min_order: '0',
    accepts_cash: true, accepts_transfer: true,
    is_active: true,
  });

  useEffect(() => {
    if (userLoading) return;
    if (!user || !dataOwnerName) { setLoading(false); return; }
    loadEntity();
  }, [user, userLoading, dataOwnerName]);

  async function loadEntity() {
    if (!supabase || !dataOwnerName) return;
    try {
      const { data } = await supabase.from('entities').select('*').eq('display_name', dataOwnerName).maybeSingle();
      if (data) {
        setEntity(data);
        setForm({
          display_name: data.display_name || '',
          description: data.description || '',
          phone: data.phone || '',
          whatsapp: data.whatsapp || '',
          address: data.address || '',
          city: data.city || '',
          lat: data.lat != null ? String(data.lat) : '',
          lng: data.lng != null ? String(data.lng) : '',
          working_hours: data.working_hours || '09:00 - 21:00',
          delivery_fee: data.delivery_fee != null ? String(data.delivery_fee) : '0',
          min_order: data.min_order != null ? String(data.min_order) : '0',
          accepts_cash: data.accepts_cash !== false,
          accepts_transfer: data.accepts_transfer !== false,
          is_active: data.is_active !== false,
        });
      }
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }

  async function handleSave(e) {
    e.preventDefault();
    if (!entity?.id) { toastError('لم يتم العثور على المتجر'); return; }
    if (!form.display_name.trim()) { toastError('اسم المتجر مطلوب'); return; }
    setSaving(true);
    try {
      const payload = {
        display_name: form.display_name,
        description: form.description,
        phone: form.phone,
        whatsapp: form.whatsapp,
        address: form.address,
        city: form.city,
        lat: form.lat ? Number(form.lat) : null,
        lng: form.lng ? Number(form.lng) : null,
        working_hours: form.working_hours,
        delivery_fee: Number(form.delivery_fee) || 0,
        min_order: Number(form.min_order) || 0,
        accepts_cash: form.accepts_cash,
        accepts_transfer: form.accepts_transfer,
        is_active: form.is_active,
      };
      const { error } = await supabase.from('entities').update(payload).eq('id', entity.id);
      if (error) throw error;
      success('✅ تم حفظ الإعدادات بنجاح');
      setEntity({ ...entity, ...payload });
    } catch (err) {
      console.error(err);
      toastError('فشل الحفظ، تحقق من البيانات');
    } finally { setSaving(false); }
  }

  async function handleLogoUpload(e) {
    const file = e.target.files?.[0];
    if (!file || !entity?.id) return;
    if (file.size > 3 * 1024 * 1024) { toastError('حجم الصورة يجب أن يكون أقل من 3MB'); return; }
    setUploadingLogo(true);
    try {
      const ext = file.name.split('.').pop();
      const fileName = `logos/${entity.id}-${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage.from('sanad-files').upload(fileName, file, { upsert: true });
      if (upErr) throw upErr;
      const { data: urlData } = supabase.storage.from('sanad-files').getPublicUrl(fileName);
      await supabase.from('entities').update({ logo_url: urlData.publicUrl }).eq('id', entity.id);
      setEntity({ ...entity, logo_url: urlData.publicUrl });
      success('✅ تم رفع اللوجو');
    } catch (err) {
      console.error(err);
      toastError('فشل رفع الصورة');
    } finally { setUploadingLogo(false); }
  }

  async function removeLogo() {
    if (!entity?.id || !entity?.logo_url) return;
    if (!confirm('حذف اللوجو؟')) return;
    await supabase.from('entities').update({ logo_url: null }).eq('id', entity.id);
    setEntity({ ...entity, logo_url: null });
    success('🗑️ تم حذف اللوجو');
  }

  if (userLoading || loading) return <div style={{ padding: 80, textAlign: 'center' }}>⏳</div>;
  if (!entity) return <div style={{ padding: 80, textAlign: 'center' }}>لم يتم العثور على المتجر. تأكد من تسجيل الدخول بشكل صحيح.</div>;

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', paddingBottom: 100 }}>
      <div style={{ background: '#0f4d3a', padding: '16px 20px', position: 'sticky', top: 0, zIndex: 20, display: 'flex', alignItems: 'center', gap: 12 }}>
        <Link href="/merchant" style={{ color: '#fff', textDecoration: 'none', fontSize: 20 }}>→</Link>
        <h1 style={{ color: '#fff', fontSize: 18, fontWeight: 900, margin: 0, flex: 1 }}>⚙️ إعدادات المتجر</h1>
      </div>

      <form onSubmit={handleSave} style={{ padding: 16, maxWidth: 700, margin: '0 auto' }}>

        {/* Logo Section */}
        <Section title="🖼️ شعار المتجر">
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ width: 90, height: 90, borderRadius: 16, overflow: 'hidden', background: '#f1f5f9', border: '2px dashed #cbd5e1', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              {entity.logo_url ? <img src={entity.logo_url} alt="logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span style={{ fontSize: 36 }}>🏪</span>}
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'inline-block', background: '#0f4d3a', color: '#fff', padding: '10px 16px', borderRadius: 10, fontSize: 12, fontWeight: 900, cursor: uploadingLogo ? 'wait' : 'pointer' }}>
                {uploadingLogo ? '⏳ جارٍ الرفع...' : '📸 رفع لوجو جديد'}
                <input type="file" accept="image/*" onChange={handleLogoUpload} style={{ display: 'none' }} disabled={uploadingLogo} />
              </label>
              {entity.logo_url && (
                <button type="button" onClick={removeLogo} style={{ marginLeft: 8, background: 'rgba(239,68,68,0.1)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.3)', padding: '10px 14px', borderRadius: 10, fontSize: 12, fontWeight: 900, cursor: 'pointer', fontFamily: 'inherit' }}>🗑️ حذف</button>
              )}
              <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 6 }}>JPG, PNG · حد أقصى 3MB</div>
            </div>
          </div>
        </Section>

        {/* Basic Info */}
        <Section title="🏪 المعلومات الأساسية">
          <Field label="اسم المتجر *">
            <input value={form.display_name} onChange={e => setForm({ ...form, display_name: e.target.value })} required style={inputStyle} placeholder="اسم متجرك" />
          </Field>
          <Field label="الوصف">
            <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} style={{ ...inputStyle, height: 80, resize: 'none' }} placeholder="وصف قصير عن متجرك..." />
          </Field>
          <Field label="حالة المتجر">
            <div style={{ display: 'flex', gap: 8 }}>
              <button type="button" onClick={() => setForm({ ...form, is_active: true })} style={toggleBtn(form.is_active, '#10b981')}>🟢 مفتوح</button>
              <button type="button" onClick={() => setForm({ ...form, is_active: false })} style={toggleBtn(!form.is_active, '#ef4444')}>🔴 مغلق</button>
            </div>
          </Field>
        </Section>

        {/* Contact */}
        <Section title="📞 التواصل">
          <Field label="رقم الهاتف">
            <input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} type="tel" style={inputStyle} placeholder="09xxxxxxxx" />
          </Field>
          <Field label="واتساب (رقم دولي أو محلي)">
            <input value={form.whatsapp} onChange={e => setForm({ ...form, whatsapp: e.target.value })} type="tel" style={inputStyle} placeholder="9639xxxxxxxx" />
          </Field>
        </Section>

        {/* Location */}
        <Section title="📍 الموقع">
          <Field label="المدينة">
            <input value={form.city} onChange={e => setForm({ ...form, city: e.target.value })} style={inputStyle} placeholder="مثال: كنصفرة" />
          </Field>
          <Field label="العنوان التفصيلي">
            <textarea value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} style={{ ...inputStyle, height: 60, resize: 'none' }} placeholder="الحي، الشارع، رقم البناء..." />
          </Field>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <Field label="خط العرض (Lat)">
              <input value={form.lat} onChange={e => setForm({ ...form, lat: e.target.value })} type="number" step="0.000001" style={inputStyle} placeholder="36.48522" />
            </Field>
            <Field label="خط الطول (Lng)">
              <input value={form.lng} onChange={e => setForm({ ...form, lng: e.target.value })} type="number" step="0.000001" style={inputStyle} placeholder="35.65480" />
            </Field>
          </div>
        </Section>

        {/* Working Hours & Delivery */}
        <Section title="⏰ ساعات العمل والتوصيل">
          <Field label="ساعات العمل">
            <input value={form.working_hours} onChange={e => setForm({ ...form, working_hours: e.target.value })} style={inputStyle} placeholder="09:00 - 21:00" />
          </Field>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <Field label="تكلفة التوصيل">
              <input value={form.delivery_fee} onChange={e => setForm({ ...form, delivery_fee: e.target.value })} type="number" style={inputStyle} placeholder="0" />
            </Field>
            <Field label="الحد الأدنى للطلب">
              <input value={form.min_order} onChange={e => setForm({ ...form, min_order: e.target.value })} type="number" style={inputStyle} placeholder="0" />
            </Field>
          </div>
        </Section>

        {/* Payment Methods */}
        <Section title="💳 طرق الدفع">
          <label style={{ display: 'flex', alignItems: 'center', gap: 10, padding: 12, background: '#f8fafc', borderRadius: 10, border: '1px solid #e2e8f0', cursor: 'pointer', marginBottom: 8 }}>
            <input type="checkbox" checked={form.accepts_cash} onChange={e => setForm({ ...form, accepts_cash: e.target.checked })} style={{ width: 18, height: 18 }} />
            <span style={{ fontSize: 13, fontWeight: 800 }}>💵 الدفع عند الاستلام (نقداً)</span>
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: 10, padding: 12, background: '#f8fafc', borderRadius: 10, border: '1px solid #e2e8f0', cursor: 'pointer' }}>
            <input type="checkbox" checked={form.accepts_transfer} onChange={e => setForm({ ...form, accepts_transfer: e.target.checked })} style={{ width: 18, height: 18 }} />
            <span style={{ fontSize: 13, fontWeight: 800 }}>🏦 تحويل بنكي / محفظة إلكترونية</span>
          </label>
        
          <Link href="/merchant/payment_methods" style={{ display: 'block', marginTop: 12, padding: 12, background: 'rgba(14,165,233,0.1)', color: '#0284c7', border: '1px solid rgba(14,165,233,0.3)', borderRadius: 10, textAlign: 'center', fontSize: 12, fontWeight: 900, textDecoration: 'none' }}>
            ⚙️ إدارة تفصيلية لطرق الدفع ←
          </Link>
        </Section>

        {/* Fixed Save Bar */}
        <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: '#fff', borderTop: '1px solid #e2e8f0', padding: '12px 16px', paddingBottom: 'calc(12px + env(safe-area-inset-bottom))', boxShadow: '0 -4px 15px rgba(0,0,0,0.05)', zIndex: 30 }}>
          <button type="submit" disabled={saving} style={{ width: '100%', padding: 16, background: saving ? '#94a3b8' : 'linear-gradient(135deg, #10b981, #059669)', color: '#fff', border: 'none', borderRadius: 12, fontWeight: 900, fontSize: 15, cursor: saving ? 'wait' : 'pointer', fontFamily: 'inherit', boxShadow: '0 4px 12px rgba(16,185,129,0.3)' }}>
            {saving ? '⏳ جارٍ الحفظ...' : '💾 حفظ جميع الإعدادات'}
          </button>
        </div>
      </form>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div style={{ background: '#fff', borderRadius: 16, padding: 16, marginBottom: 12, border: '1px solid #e2e8f0' }}>
      <h2 style={{ fontSize: 14, fontWeight: 900, color: '#0f172a', marginBottom: 14, marginTop: 0 }}>{title}</h2>
      {children}
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <label style={labelStyle}>{label}</label>
      {children}
    </div>
  );
}

const toggleBtn = (active, color) => ({
  flex: 1, padding: '10px 14px',
  background: active ? `${color}15` : '#f8fafc',
  color: active ? color : '#64748b',
  border: active ? `2px solid ${color}` : '1px solid #e2e8f0',
  borderRadius: 10, fontSize: 12, fontWeight: 900,
  cursor: 'pointer', fontFamily: 'inherit',
});

const labelStyle = { display: 'block', fontSize: 12, fontWeight: 800, color: '#475569', marginBottom: 6 };
const inputStyle = { width: '100%', padding: '12px 14px', borderRadius: 10, border: '1px solid #cbd5e1', fontSize: 14, fontFamily: 'inherit', boxSizing: 'border-box', outline: 'none', background: '#f8fafc' };
