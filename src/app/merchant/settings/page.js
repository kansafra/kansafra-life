'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { getSession, updateSession, logout } from '@/lib/auth';

const IMAGE_BUCKETS = {
  logo: 'sanad-files',
  cover: 'sanad-files',
};

export default function MerchantSettings() {
  const router = useRouter();
  const [session, setSession] = useState(null);
  const [entity, setEntity] = useState(null);
  const [form, setForm] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState({ logo: false, cover: false });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    const s = getSession();
    if (!s) { router.replace('/login'); return; }
    setSession(s);
    loadEntity(s);
  }, [router]);

  async function loadEntity(s) {
    if (!supabase) { setLoading(false); return; }
    const { data } = await supabase.from('entities').select('*').eq('id', s.id).single();
    if (data) {
      setEntity(data);
      setForm({
        display_name: data.display_name || '',
        bio: data.bio || '',
        phone: data.phone || '',
        whatsapp: data.whatsapp || '',
        email: data.email || '',
        address: data.address || '',
        city: data.city || 'كنصفرة',
        governorate: data.governorate || 'إدلب',
        opening_hours: data.opening_hours || '',
        facebook_url: data.facebook_url || '',
        instagram_url: data.instagram_url || '',
      });
    }
    setLoading(false);
  }

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
    setError('');
    setSuccess('');
  }

  async function uploadImage(file, type) {
    if (!file || !supabase || !entity) return;

    // التحقق من النوع
    if (!file.type.startsWith('image/')) {
      setError('يرجى اختيار ملف صورة');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('حجم الصورة يجب أن يكون أقل من 5 ميجابايت');
      return;
    }

    setUploading((u) => ({ ...u, [type]: true }));
    setError('');

    try {
      const bucket = IMAGE_BUCKETS[type];
      const ext = file.name.split('.').pop() || 'jpg';
      const fileName = `${entity.id}/${type}-${Date.now()}.${ext}`;

      // رفع الملف
      const { error: upErr } = await supabase.storage
        .from(bucket)
        .upload(fileName, file, { cacheControl: '3600', upsert: true });

      if (upErr) throw upErr;

      // الرابط العام
      const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(fileName);
      const publicUrl = urlData.publicUrl;

      // تحديث السجل
      const field = type === 'logo' ? 'logo_url' : 'cover_url';
      const { error: dbErr } = await supabase
        .from('entities')
        .update({ [field]: publicUrl, updated_at: new Date().toISOString() })
        .eq('id', entity.id);

      if (dbErr) throw dbErr;

      setEntity((e) => ({ ...e, [field]: publicUrl }));
      setSuccess(`✅ تم رفع ${type === 'logo' ? 'الشعار' : 'الغلاف'} بنجاح`);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('تعذّر رفع الصورة: ' + (err.message || 'خطأ غير معروف'));
    } finally {
      setUploading((u) => ({ ...u, [type]: false }));
    }
  }

  async function save() {
    if (!form.display_name?.trim()) { setError('اسم النشاط مطلوب'); return; }
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const { error: updErr } = await supabase
        .from('entities')
        .update({
          display_name: form.display_name.trim(),
          bio: form.bio?.trim() || null,
          phone: form.phone?.trim() || null,
          whatsapp: form.whatsapp?.trim() || null,
          email: form.email?.trim() || null,
          address: form.address?.trim() || null,
          city: form.city?.trim() || null,
          governorate: form.governorate?.trim() || null,
          opening_hours: form.opening_hours?.trim() || null,
          facebook_url: form.facebook_url?.trim() || null,
          instagram_url: form.instagram_url?.trim() || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', entity.id);

      if (updErr) throw updErr;
      updateSession({ display_name: form.display_name.trim() });
      setSuccess('✅ تم حفظ التغييرات');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('تعذّر الحفظ: ' + (err.message || 'خطأ'));
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className="sect-empty" style={{ padding: 80 }}><span className="em">⏳</span></div>;
  if (!entity) return <div className="sect-empty" style={{ padding: 80 }}><span className="em">❌</span><p>لم يتم العثور على الحساب</p></div>;

  return (
    <div className="sect-page" style={{ paddingBottom: 100 }}>
      <div className="inv-header">
        <Link href="/merchant" className="inv-back">→</Link>
        <span className="inv-title">⚙️ إعدادات حسابي</span>
        <span style={{ width: 40 }} />
      </div>

      {/* ═══ الغلاف والشعار ═══ */}
      <div style={{ position: 'relative', marginBottom: 60 }}>
        {/* الغلاف */}
        <label
          style={{
            display: 'block',
            height: 180,
            background: entity.cover_url
              ? `url(${entity.cover_url}) center/cover`
              : 'linear-gradient(135deg, #0f4d3a, #0a6b50)',
            position: 'relative',
            cursor: 'pointer',
          }}
        >
          <input
            type="file"
            accept="image/*"
            style={{ display: 'none' }}
            onChange={(e) => uploadImage(e.target.files?.[0], 'cover')}
          />
          <div style={{
            position: 'absolute', bottom: 12, left: 12,
            background: 'rgba(0,0,0,.6)', color: '#fff',
            padding: '6px 14px', borderRadius: 999,
            fontSize: 11.5, fontWeight: 900,
          }}>
            {uploading.cover ? '⏳ جارٍ الرفع...' : '📸 تغيير الغلاف'}
          </div>
        </label>

        {/* الشعار */}
        <label style={{
          position: 'absolute', bottom: -50, right: 20,
          width: 100, height: 100, borderRadius: '50%',
          background: '#0f4d3a',
          border: '4px solid #061410',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          overflow: 'hidden', cursor: 'pointer',
          boxShadow: '0 4px 12px rgba(0,0,0,.4)',
        }}>
          <input
            type="file"
            accept="image/*"
            style={{ display: 'none' }}
            onChange={(e) => uploadImage(e.target.files?.[0], 'logo')}
          />
          {uploading.logo ? (
            <span style={{ color: '#fff', fontSize: 12 }}>⏳</span>
          ) : entity.logo_url ? (
            <img src={entity.logo_url} alt="logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <span style={{ fontSize: 40 }}>🏪</span>
          )}
        </label>
      </div>

      {/* ═══ الحقول ═══ */}
      <div style={{ padding: '0 16px' }}>
        <Field label="اسم النشاط *" value={form.display_name} onChange={(v) => update('display_name', v)} />
        <Field label="نبذة عنك" value={form.bio} onChange={(v) => update('bio', v)} multiline />
        <Field label="رقم الهاتف" value={form.phone} onChange={(v) => update('phone', v)} ltr />
        <Field label="رقم الواتساب" value={form.whatsapp} onChange={(v) => update('whatsapp', v)} ltr />
        <Field label="البريد الإلكتروني" value={form.email} onChange={(v) => update('email', v)} ltr />
        <Field label="العنوان" value={form.address} onChange={(v) => update('address', v)} />
        <Field label="البلدة" value={form.city} onChange={(v) => update('city', v)} />
        <Field label="المحافظة" value={form.governorate} onChange={(v) => update('governorate', v)} />
        <Field label="ساعات العمل" value={form.opening_hours} onChange={(v) => update('opening_hours', v)} placeholder="مثال: 9ص - 9م" />
        <Field label="رابط فيسبوك" value={form.facebook_url} onChange={(v) => update('facebook_url', v)} ltr />
        <Field label="رابط إنستغرام" value={form.instagram_url} onChange={(v) => update('instagram_url', v)} ltr />

        {error && (
          <div style={{ padding: 12, background: 'rgba(220,38,38,.1)', border: '1px solid rgba(220,38,38,.3)', borderRadius: 12, color: '#f87171', fontSize: 12.5, marginBottom: 12, textAlign: 'center' }}>
            ⚠️ {error}
          </div>
        )}
        {success && (
          <div style={{ padding: 12, background: 'rgba(34,197,94,.1)', border: '1px solid rgba(34,197,94,.3)', borderRadius: 12, color: '#4ade80', fontSize: 12.5, marginBottom: 12, textAlign: 'center' }}>
            {success}
          </div>
        )}

        <button
          onClick={save}
          disabled={saving}
          style={{
            width: '100%', padding: 16, marginTop: 12,
            background: saving ? '#555' : 'linear-gradient(135deg, #22c55e, #16a34a)',
            color: '#fff', border: 'none', borderRadius: 14,
            fontSize: 15, fontWeight: 900,
            cursor: saving ? 'wait' : 'pointer',
          }}
        >
          {saving ? '... جارٍ الحفظ' : '✓ حفظ التغييرات'}
        </button>
      </div>
    </div>
  );
}
        <button
          onClick={() => { if (confirm('تسجيل الخروج؟')) { logout(); router.push('/'); } }}
          style={{
            width: '100%', padding: 14, marginTop: 24,
            background: 'rgba(220,38,38,.1)',
            color: '#f87171',
            border: '1px solid rgba(220,38,38,.3)',
            borderRadius: 14,
            fontSize: 14, fontWeight: 900,
            cursor: 'pointer',
          }}
          type="button"
        >
          🚪 تسجيل الخروج
        </button>


function Field({ label, value, onChange, placeholder, multiline, ltr }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <label style={{ display: 'block', fontSize: 12, fontWeight: 800, color: 'var(--n-300)', marginBottom: 6 }}>
        {label}
      </label>
      {multiline ? (
        <textarea
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="new-service-input"
          style={{ minHeight: 80, fontFamily: 'inherit' }}
        />
      ) : (
        <input
          type="text"
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="new-service-input"
          style={ltr ? { direction: 'ltr', textAlign: 'right' } : {}}
        />
      )}
    </div>
  );
}
