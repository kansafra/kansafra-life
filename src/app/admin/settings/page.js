'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/components/Toast';

export default function AdminSettingsPage() {
  const router = useRouter();
  const { success, error: toastError } = useToast();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);

  const [form, setForm] = useState({
    site_name: 'سند',
    site_description: 'منصة مجتمعية شاملة',
    contact_email: '',
    contact_phone: '',
    whatsapp_number: '',
    facebook_url: '',
    instagram_url: '',
    telegram_url: '',
    logo_url: '',
    maintenance_mode: false,
    maintenance_message: 'الموقع قيد الصيانة، سنعود قريباً.',
    allow_registration: true,
    allow_merchant_registration: true,
  });

  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem('sanad_admin') || 'null');
    if (!stored) { router.replace('/admin/login'); return; }
    loadSettings();
  }, [router]);

  async function loadSettings() {
    if (!supabase) return;
    try {
      const { data, error } = await supabase.from('app_settings').select('*').eq('category', 'general');
      if (!error && data) {
        const obj = { ...form };
        data.forEach(row => {
          if (row.key === 'maintenance_mode' || row.key === 'allow_registration' || row.key === 'allow_merchant_registration') {
            obj[row.key] = row.value === 'true' || row.value === true;
          } else {
            obj[row.key] = row.value || '';
          }
        });
        setForm(obj);
      }
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    try {
      const updates = Object.entries(form).map(([key, value]) => ({
        key: key,
        value: typeof value === 'boolean' ? String(value) : String(value || ''),
        category: 'general',
      }));

      // upsert (تحديث أو إدراج)
      const { error } = await supabase.from('app_settings').upsert(updates, { onConflict: 'key' });
      if (error) throw error;
      success('✅ تم حفظ إعدادات المنصة بنجاح');
    } catch (err) {
      console.error(err);
      toastError('فشل حفظ الإعدادات');
    } finally { setSaving(false); }
  }

  async function handleLogoUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 3 * 1024 * 1024) { toastError('حجم الصورة يجب أن يكون أقل من 3MB'); return; }
    setUploadingLogo(true);
    try {
      const ext = file.name.split('.').pop();
      const fileName = `platform/logo-${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage.from('sanad-files').upload(fileName, file, { upsert: true });
      if (upErr) throw upErr;
      const { data: urlData } = supabase.storage.from('sanad-files').getPublicUrl(fileName);
      setForm({ ...form, logo_url: urlData.publicUrl });
      success('✅ تم رفع الشعار');
    } catch (err) {
      toastError('فشل رفع الشعار');
    } finally { setUploadingLogo(false); }
  }

  if (loading) return <div style={{ padding: 80, textAlign: 'center' }}>⏳ جارٍ التحميل...</div>;

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', paddingBottom: 100 }}>
      <div style={{ background: '#0f172a', padding: '16px 20px', position: 'sticky', top: 0, zIndex: 20, display: 'flex', alignItems: 'center', gap: 12 }}>
        <Link href="/admin" style={{ color: '#fff', textDecoration: 'none', fontSize: 20 }}>→</Link>
        <h1 style={{ color: '#fff', fontSize: 18, fontWeight: 900, margin: 0, flex: 1 }}>⚙️ إعدادات المنصة</h1>
      </div>

      <form onSubmit={handleSave} style={{ padding: 16, maxWidth: 700, margin: '0 auto' }}>

        {/* Logo & Basic Info */}
        <Section title="🖼️ هوية المنصة">
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16 }}>
            <div style={{ width: 80, height: 80, borderRadius: 16, overflow: 'hidden', background: '#f1f5f9', border: '2px dashed #cbd5e1', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              {form.logo_url ? <img src={form.logo_url} alt="logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span style={{ fontSize: 32 }}>🌐</span>}
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'inline-block', background: '#0f172a', color: '#fff', padding: '10px 16px', borderRadius: 10, fontSize: 12, fontWeight: 900, cursor: uploadingLogo ? 'wait' : 'pointer' }}>
                {uploadingLogo ? '⏳ جارٍ الرفع...' : '📸 رفع شعار جديد'}
                <input type="file" accept="image/*" onChange={handleLogoUpload} style={{ display: 'none' }} disabled={uploadingLogo} />
              </label>
            </div>
          </div>

          <Field label="اسم المنصة">
            <input value={form.site_name} onChange={e => setForm({ ...form, site_name: e.target.value })} style={inputStyle} placeholder="سند" />
          </Field>
          <Field label="الوصف القصير">
            <input value={form.site_description} onChange={e => setForm({ ...form, site_description: e.target.value })} style={inputStyle} placeholder="منصة مجتمعية شاملة" />
          </Field>
        </Section>

        {/* Maintenance Mode */}
        <Section title="🚧 وضع الصيانة">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 12, background: form.maintenance_mode ? 'rgba(239,68,68,0.05)' : '#f8fafc', border: `1px solid ${form.maintenance_mode ? '#ef4444' : '#e2e8f0'}`, borderRadius: 10, marginBottom: 12 }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 900, color: form.maintenance_mode ? '#ef4444' : '#0f172a' }}>تفعيل وضع الصيانة</div>
              <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>سيتم إخفاء المنصة عن الزوار</div>
            </div>
            <label style={{ position: 'relative', display: 'inline-block', width: 50, height: 28 }}>
              <input type="checkbox" checked={form.maintenance_mode} onChange={e => setForm({ ...form, maintenance_mode: e.target.checked })} style={{ opacity: 0, width: 0, height: 0 }} />
              <span style={{ position: 'absolute', cursor: 'pointer', inset: 0, background: form.maintenance_mode ? '#ef4444' : '#cbd5e1', borderRadius: 28, transition: '.3s' }}>
                <span style={{ position: 'absolute', content: '""', height: 22, width: 22, left: form.maintenance_mode ? 24 : 3, bottom: 3, background: '#fff', borderRadius: '50%', transition: '.3s', boxShadow: '0 2px 4px rgba(0,0,0,0.2)' }} />
              </span>
            </label>
          </div>
          {form.maintenance_mode && (
            <Field label="رسالة الصيانة للزوار">
              <textarea value={form.maintenance_message} onChange={e => setForm({ ...form, maintenance_message: e.target.value })} style={{ ...inputStyle, height: 70, resize: 'none' }} />
            </Field>
          )}
        </Section>

        {/* Registration */}
        <Section title="📝 التسجيل">
          <ToggleRow 
            label="السماح بتسجيل المستخدمين" 
            description="يمكن للزوار إنشاء حسابات جديدة"
            value={form.allow_registration} 
            onChange={v => setForm({ ...form, allow_registration: v })} 
          />
          <ToggleRow 
            label="السماح بتسجيل التجار" 
            description="يمكن لأصحاب المتاجر التسجيل"
            value={form.allow_merchant_registration} 
            onChange={v => setForm({ ...form, allow_merchant_registration: v })} 
          />
        </Section>

        {/* Contact & Social */}
        <Section title="📞 التواصل والدعم">
          <Field label="البريد الإلكتروني">
            <input value={form.contact_email} onChange={e => setForm({ ...form, contact_email: e.target.value })} type="email" style={inputStyle} placeholder="info@sanad.app" />
          </Field>
          <Field label="رقم الهاتف">
            <input value={form.contact_phone} onChange={e => setForm({ ...form, contact_phone: e.target.value })} type="tel" style={inputStyle} placeholder="09xxxxxxxx" />
          </Field>
          <Field label="رقم الواتساب (مع كود الدولة)">
            <input value={form.whatsapp_number} onChange={e => setForm({ ...form, whatsapp_number: e.target.value })} type="tel" style={inputStyle} placeholder="9639xxxxxxxx" />
          </Field>
        </Section>

        <Section title="🌐 روابط التواصل الاجتماعي">
          <Field label="فيسبوك">
            <input value={form.facebook_url} onChange={e => setForm({ ...form, facebook_url: e.target.value })} style={inputStyle} placeholder="https://facebook.com/..." />
          </Field>
          <Field label="إنستغرام">
            <input value={form.instagram_url} onChange={e => setForm({ ...form, instagram_url: e.target.value })} style={inputStyle} placeholder="https://instagram.com/..." />
          </Field>
          <Field label="تلغرام">
            <input value={form.telegram_url} onChange={e => setForm({ ...form, telegram_url: e.target.value })} style={inputStyle} placeholder="https://t.me/..." />
          </Field>
        </Section>

        {/* Save Bar */}
        <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: '#fff', borderTop: '1px solid #e2e8f0', padding: '12px 16px', paddingBottom: 'calc(12px + env(safe-area-inset-bottom))', boxShadow: '0 -4px 15px rgba(0,0,0,0.05)', zIndex: 30 }}>
          <button type="submit" disabled={saving} style={{ width: '100%', padding: 16, background: saving ? '#94a3b8' : 'linear-gradient(135deg, #10b981, #059669)', color: '#fff', border: 'none', borderRadius: 12, fontWeight: 900, fontSize: 15, cursor: saving ? 'wait' : 'pointer', fontFamily: 'inherit' }}>
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
      <h2 style={{ fontSize: 14, fontWeight: 900, color: '#0f172a', marginTop: 0, marginBottom: 14 }}>{title}</h2>
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

function ToggleRow({ label, description, value, onChange }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 12, background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 10, marginBottom: 8 }}>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 13, fontWeight: 900, color: '#0f172a' }}>{label}</div>
        {description && <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>{description}</div>}
      </div>
      <label style={{ position: 'relative', display: 'inline-block', width: 50, height: 28, flexShrink: 0 }}>
        <input type="checkbox" checked={value} onChange={e => onChange(e.target.checked)} style={{ opacity: 0, width: 0, height: 0 }} />
        <span style={{ position: 'absolute', cursor: 'pointer', inset: 0, background: value ? '#10b981' : '#cbd5e1', borderRadius: 28, transition: '.3s' }}>
          <span style={{ position: 'absolute', height: 22, width: 22, left: value ? 24 : 3, bottom: 3, background: '#fff', borderRadius: '50%', transition: '.3s', boxShadow: '0 2px 4px rgba(0,0,0,0.2)' }} />
        </span>
      </label>
    </div>
  );
}

const labelStyle = { display: 'block', fontSize: 12, fontWeight: 800, color: '#475569', marginBottom: 6 };
const inputStyle = { width: '100%', padding: '12px 14px', borderRadius: 10, border: '1px solid #cbd5e1', fontSize: 14, fontFamily: 'inherit', boxSizing: 'border-box', outline: 'none', background: '#f8fafc' };
