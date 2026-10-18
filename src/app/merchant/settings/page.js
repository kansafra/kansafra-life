'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { useCurrentUser } from '@/lib/useCurrentUser';
import { useToast } from '@/components/Toast';
import ImageUploader from '@/components/ImageUploader';

export default function SettingsPage() {
  const router = useRouter();
  const { user, loading: userLoading, isOwner, isSectionAdmin, dataOwnerName } = useCurrentUser();
  const { success, error: toastError } = useToast();
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (userLoading) return;
    if (!user) { router.replace('/login'); return; }
    if (!isOwner && !isSectionAdmin) {
      // موظف — لا يصل
      router.replace('/merchant');
      return;
    }
    load();
  }, [user, userLoading, isOwner, isSectionAdmin]);

  async function load() {
    if (!supabase || !user?.id) { setLoading(false); return; }
    try {
      const { data } = await supabase.from('entities').select('*').eq('id', user.id).maybeSingle();
      if (data) {
        setForm({
          display_name: data.display_name || '',
          phone: data.phone || '',
          whatsapp: data.whatsapp || '',
          email: data.email || '',
          address: data.address || '',
          city: data.city || '',
          governorate: data.governorate || '',
          bio: data.bio || '',
          logo_url: data.logo_url || '',
          cover_url: data.cover_url || '',
          opening_hours: data.opening_hours || '',
          facebook_url: data.facebook_url || '',
          instagram_url: data.instagram_url || '',
        });
      }
    } catch (e) { toastError('تعذّر التحميل'); }
    setLoading(false);
  }

  function update(k, v) { setForm(f => ({ ...f, [k]: v })); }

  async function save() {
    if (!form.display_name?.trim()) { toastError('اسم المتجر مطلوب'); return; }
    if (!form.phone?.trim()) { toastError('رقم الهاتف مطلوب'); return; }
    
    setSaving(true);
    try {
      const { error } = await supabase.from('entities').update({
        display_name: form.display_name.trim(),
        phone: form.phone.trim(),
        whatsapp: form.whatsapp?.trim() || null,
        email: form.email?.trim() || null,
        address: form.address?.trim() || null,
        city: form.city?.trim() || null,
        governorate: form.governorate?.trim() || null,
        bio: form.bio?.trim() || null,
        logo_url: form.logo_url || null,
        cover_url: form.cover_url || null,
        opening_hours: form.opening_hours?.trim() || null,
        facebook_url: form.facebook_url?.trim() || null,
        instagram_url: form.instagram_url?.trim() || null,
        updated_at: new Date().toISOString(),
      }).eq('id', user.id);
      
      if (error) throw error;
      success('✅ تم الحفظ');
    } catch (e) { toastError('تعذّر: ' + e.message); }
    setSaving(false);
  }

  if (userLoading || loading) {
    return <div style={{ padding: 60, textAlign: 'center' }}>⏳</div>;
  }

  const F = ({ label, value, onChange, type = 'text', placeholder = '', required = false }) => (
    <div style={{ marginBottom: 14 }}>
      <label style={{ display: 'block', fontSize: 12, fontWeight: 800, color: '#334155', marginBottom: 6 }}>
        {label} {required && <span style={{ color: '#ef4444' }}>*</span>}
      </label>
      <input
        type={type}
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        style={{
          width: '100%', padding: 12, border: '1px solid #e5e7eb', borderRadius: 10,
          fontSize: 13, fontFamily: 'inherit', boxSizing: 'border-box', outline: 'none',
          background: '#fff',
        }}
      />
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', paddingBottom: 100 }}>
      <div style={{ position: 'sticky', top: 0, zIndex: 10, background: '#0f4d3a', padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <Link href="/merchant" style={{ color: '#fff', textDecoration: 'none', fontSize: 20, width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,.1)', borderRadius: '50%' }}>→</Link>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 16, fontWeight: 900, color: '#fff' }}>⚙️ إعدادات المتجر</div>
        </div>
      </div>

      <div style={{ padding: 16 }}>
        {/* Logo & Cover */}
        <div style={{ background: '#fff', borderRadius: 16, padding: 16, marginBottom: 12, border: '1px solid #e5e7eb' }}>
          <div style={{ fontSize: 14, fontWeight: 900, marginBottom: 12, color: '#0f172a' }}>🎨 الهوية البصرية</div>
          <div style={{ marginBottom: 12 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 800, color: '#334155', marginBottom: 6 }}>شعار المتجر</label>
            <ImageUploader
              label="ارفع شعار المتجر"
              folder="logos"
              value={form.logo_url}
              onUpload={(url) => update('logo_url', url)}
              aspect="1/1"
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 800, color: '#334155', marginBottom: 6 }}>صورة الغلاف</label>
            <ImageUploader
              label="ارفع صورة الغلاف"
              folder="covers"
              value={form.cover_url}
              onUpload={(url) => update('cover_url', url)}
              aspect="16/9"
            />
          </div>
        </div>

        {/* Basic Info */}
        <div style={{ background: '#fff', borderRadius: 16, padding: 16, marginBottom: 12, border: '1px solid #e5e7eb' }}>
          <div style={{ fontSize: 14, fontWeight: 900, marginBottom: 12, color: '#0f172a' }}>📝 معلومات أساسية</div>
          <F label="اسم المتجر" value={form.display_name} onChange={(v) => update('display_name', v)} required placeholder="اسم متجرك" />
          <F label="نبذة عن المتجر" value={form.bio} onChange={(v) => update('bio', v)} placeholder="وصف قصير عن متجرك" />
          <F label="ساعات العمل" value={form.opening_hours} onChange={(v) => update('opening_hours', v)} placeholder="مثال: 9 صباحاً - 10 مساءً" />
        </div>

        {/* Contact */}
        <div style={{ background: '#fff', borderRadius: 16, padding: 16, marginBottom: 12, border: '1px solid #e5e7eb' }}>
          <div style={{ fontSize: 14, fontWeight: 900, marginBottom: 12, color: '#0f172a' }}>📞 معلومات التواصل</div>
          <F label="رقم الهاتف" value={form.phone} onChange={(v) => update('phone', v)} type="tel" required placeholder="09XXXXXXXX" />
          <F label="WhatsApp" value={form.whatsapp} onChange={(v) => update('whatsapp', v)} type="tel" placeholder="09XXXXXXXX" />
          <F label="البريد الإلكتروني" value={form.email} onChange={(v) => update('email', v)} type="email" placeholder="email@example.com" />
        </div>

        {/* Location */}
        <div style={{ background: '#fff', borderRadius: 16, padding: 16, marginBottom: 12, border: '1px solid #e5e7eb' }}>
          <div style={{ fontSize: 14, fontWeight: 900, marginBottom: 12, color: '#0f172a' }}>📍 الموقع</div>
          <F label="المحافظة" value={form.governorate} onChange={(v) => update('governorate', v)} placeholder="إدلب" />
          <F label="المدينة" value={form.city} onChange={(v) => update('city', v)} placeholder="كنصفرة" />
          <F label="العنوان" value={form.address} onChange={(v) => update('address', v)} placeholder="الحي / الشارع" />
        </div>

        {/* Social */}
        <div style={{ background: '#fff', borderRadius: 16, padding: 16, marginBottom: 12, border: '1px solid #e5e7eb' }}>
          <div style={{ fontSize: 14, fontWeight: 900, marginBottom: 12, color: '#0f172a' }}>📱 حسابات التواصل</div>
          <F label="Facebook" value={form.facebook_url} onChange={(v) => update('facebook_url', v)} placeholder="https://facebook.com/..." />
          <F label="Instagram" value={form.instagram_url} onChange={(v) => update('instagram_url', v)} placeholder="https://instagram.com/..." />
        </div>
      </div>

      {/* Save Button */}
      <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, padding: 16, background: '#fff', borderTop: '1px solid #e5e7eb', boxShadow: '0 -4px 12px rgba(0,0,0,.05)' }}>
        <button onClick={save} disabled={saving} style={{
          width: '100%', padding: 16, background: saving ? '#94a3b8' : 'linear-gradient(135deg,#10b981,#059669)',
          color: '#fff', border: 'none', borderRadius: 12, fontSize: 15, fontWeight: 900,
          cursor: saving ? 'not-allowed' : 'pointer', fontFamily: 'inherit',
          boxShadow: '0 4px 12px rgba(16,185,129,.3)',
        }}>
          {saving ? '... جارٍ الحفظ' : '✓ حفظ الإعدادات'}
        </button>
      </div>
    </div>
  );
}
