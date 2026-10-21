'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/components/Toast';

const ENTITY_TYPES = [
  { key: 'merchant', label: 'متجر / محل', icon: '🏪' },
  { key: 'restaurant', label: 'مطعم / مقهى', icon: '🍽️' },
  { key: 'doctor', label: 'طبيب / عيادة', icon: '👨‍⚕️' },
  { key: 'pharmacy', label: 'صيدلية', icon: '💊' },
  { key: 'school', label: 'مدرسة / معهد', icon: '🏫' },
  { key: 'mosque', label: 'جامع', icon: '🕌' },
  { key: 'charity', label: 'جمعية خيرية', icon: '🤝' },
  { key: 'sports', label: 'نادي رياضي', icon: '⚽' },
  { key: 'hotel', label: 'فندق', icon: '🏨' },
  { key: 'office', label: 'مكتب خدمات', icon: '📁' },
  { key: 'exchange', label: 'مكتب صرافة', icon: '💱' },
  { key: 'transport', label: 'مواصلات', icon: '🚗' },
  { key: 'memory', label: 'ذاكرة رقمية', icon: '📸' },
  { key: 'municipality', label: 'بلدية', icon: '🏢' },
  { key: 'craftsman', label: 'حرفي', icon: '🛠️' },
  { key: 'workshop', label: 'ورشة تصنيع', icon: '🏭' },
  { key: 'isp', label: 'مزود إنترنت', icon: '📡' },
];

async function hashPassword(password) {
  const encoder = new TextEncoder();
  const data = encoder.encode(password + 'sanad_salt_v1');
  const buf = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
}

export default function RegisterPage() {
  const router = useRouter();
  const { success, error: toastError } = useToast();

  const [step, setStep] = useState(1); // 1: نوع النشاط، 2: البيانات
  const [selectedType, setSelectedType] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [form, setForm] = useState({
    display_name: '',
    phone: '',
    password: '',
    city: '',
    address: '',
    description: '',
  });

  function normalizePhone(p) {
    return (p || '').replace(/[^0-9]/g, '');
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.display_name.trim()) { toastError('اسم النشاط مطلوب'); return; }
    const phone = normalizePhone(form.phone);
    if (phone.length < 8) { toastError('رقم الهاتف غير صحيح'); return; }
    if (form.password.length < 6) { toastError('كلمة المرور يجب أن تكون 6 أحرف على الأقل'); return; }

    setLoading(true);
    try {
      // التحقق من عدم تكرار الرقم
      const { data: existing } = await supabase
        .from('entities')
        .select('id')
        .eq('phone', phone)
        .maybeSingle();
      
      if (existing) {
        toastError('هذا الرقم مسجل مسبقاً. سجّل دخولك من بوابة المزودين.');
        return;
      }

      // تشفير كلمة المرور
      const hashed = await hashPassword(form.password);

      // إنشاء النشاط
      const { data, error } = await supabase
        .from('entities')
        .insert({
          display_name: form.display_name,
          entity_type: selectedType,
          phone: phone,
          city: form.city,
          address: form.address,
          description: form.description,
          password_hash: hashed,
          is_active: true,
          approval_status: 'pending',
        })
        .select('id, display_name, entity_type, phone')
        .single();

      if (error) throw error;

      // حفظ الجلسة
      localStorage.setItem('sanad_entity', JSON.stringify(data));
      
      success('🎉 تم إنشاء حسابك! حسابك الآن قيد المراجعة.');
      
      setTimeout(() => router.push('/merchant'), 800);
    } catch (err) {
      console.error(err);
      toastError('فشل التسجيل: ' + (err.message || 'خطأ غير متوقع'));
    } finally { setLoading(false); }
  }

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(180deg, #f0fdf4 0%, #f8fafc 40%)' }}>
      
      {/* Header */}
      <div style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <Link href="/" style={{ color: '#0f4d3a', textDecoration: 'none', fontSize: 20 }}>←</Link>
        <h1 style={{ fontSize: 16, fontWeight: 900, color: '#0f172a', margin: 0, flex: 1 }}>
          {step === 1 ? 'انضم إلى سند' : 'بيانات النشاط'}
        </h1>
      </div>

      {/* Progress */}
      <div style={{ display: 'flex', gap: 6, padding: '0 20px', marginBottom: 24 }}>
        <div style={{ flex: 1, height: 4, background: step >= 1 ? '#10b981' : '#e2e8f0', borderRadius: 2 }} />
        <div style={{ flex: 1, height: 4, background: step >= 2 ? '#10b981' : '#e2e8f0', borderRadius: 2 }} />
      </div>

      <div style={{ padding: '0 20px', maxWidth: 600, margin: '0 auto' }}>
        
        {/* Step 1: Type Selection */}
        {step === 1 && (
          <>
            <div style={{ textAlign: 'center', marginBottom: 24 }}>
              <div style={{ width: 70, height: 70, borderRadius: 20, background: 'linear-gradient(135deg, #0f4d3a, #075640)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 34, marginBottom: 12, boxShadow: '0 10px 30px rgba(15,77,58,0.25)' }}>
                🏢
              </div>
              <h2 style={{ fontSize: 20, fontWeight: 900, color: '#0f172a', margin: 0, marginBottom: 6 }}>
                ما نوع نشاطك؟
              </h2>
              <p style={{ fontSize: 13, color: '#64748b', margin: 0 }}>
                اختر الفئة الأنسب وسنساعدك في الإعداد
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10, marginBottom: 24 }}>
              {ENTITY_TYPES.map(t => (
                <button
                  key={t.key}
                  type="button"
                  onClick={() => { setSelectedType(t.key); setStep(2); }}
                  style={{
                    background: '#fff',
                    border: '1px solid #e2e8f0',
                    borderRadius: 14,
                    padding: '16px 10px',
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 6,
                    transition: 'all 0.15s',
                  }}
                  onTouchStart={(e) => e.currentTarget.style.transform = 'scale(0.97)'}
                  onTouchEnd={(e) => e.currentTarget.style.transform = 'scale(1)'}
                >
                  <div style={{ fontSize: 28 }}>{t.icon}</div>
                  <div style={{ fontSize: 11.5, fontWeight: 900, color: '#1e293b', textAlign: 'center', lineHeight: 1.3 }}>{t.label}</div>
                </button>
              ))}
            </div>

            <p style={{ fontSize: 11, color: '#94a3b8', textAlign: 'center', marginTop: 16, lineHeight: 1.6 }}>
              بالتسجيل، أنت توافق على <Link href="/legal/terms" style={{ color: '#0ea5e9', textDecoration: 'underline' }}>شروط الاستخدام</Link>
            </p>
          </>
        )}

        {/* Step 2: Basic Info */}
        {step === 2 && (
          <form onSubmit={handleSubmit}>
            
            {/* Selected Type Badge */}
            <div style={{ marginBottom: 20, display: 'flex', alignItems: 'center', gap: 12, background: '#fff', padding: 14, borderRadius: 14, border: '1px solid #e2e8f0' }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(15,77,58,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>
                {ENTITY_TYPES.find(t => t.key === selectedType)?.icon}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 10, color: '#64748b', fontWeight: 800, marginBottom: 2 }}>نوع النشاط</div>
                <div style={{ fontSize: 14, fontWeight: 900, color: '#0f172a' }}>
                  {ENTITY_TYPES.find(t => t.key === selectedType)?.label}
                </div>
              </div>
              <button type="button" onClick={() => setStep(1)} style={{ background: 'none', border: 'none', color: '#0ea5e9', fontSize: 12, fontWeight: 900, cursor: 'pointer', fontFamily: 'inherit' }}>
                تغيير
              </button>
            </div>

            <Field label="اسم النشاط *">
              <input type="text" value={form.display_name} onChange={e => setForm({ ...form, display_name: e.target.value })} placeholder="مثال: صيدلية النور" style={inputStyle} required />
            </Field>

            <Field label="رقم الهاتف *">
              <input type="tel" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="09xxxxxxxx" style={inputStyle} required />
            </Field>

            <Field label="كلمة المرور *">
              <div style={{ position: 'relative' }}>
                <input type={showPassword ? 'text' : 'password'} value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} placeholder="6 أحرف على الأقل" style={{ ...inputStyle, paddingLeft: 44 }} required minLength={6} />
                <button type="button" onClick={() => setShowPassword(!showPassword)} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', fontSize: 18, cursor: 'pointer', padding: 4 }}>
                  {showPassword ? '🙈' : '👁️'}
                </button>
              </div>
              <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 4 }}>ستحتاجها للدخول إلى لوحة التحكم</div>
            </Field>

            <Field label="المدينة">
              <input type="text" value={form.city} onChange={e => setForm({ ...form, city: e.target.value })} placeholder="مثال: كنصفرة" style={inputStyle} />
            </Field>

            <Field label="العنوان التفصيلي">
              <input type="text" value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} placeholder="الحي، الشارع..." style={inputStyle} />
            </Field>

            <Field label="وصف النشاط (اختياري)">
              <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="وصف قصير عن نشاطك..." style={{ ...inputStyle, height: 80, resize: 'none' }} />
            </Field>

            <div style={{ background: 'rgba(251,191,36,0.1)', border: '1px solid rgba(251,191,36,0.3)', borderRadius: 10, padding: 12, marginBottom: 20 }}>
              <div style={{ fontSize: 11.5, color: '#92400e', fontWeight: 800, lineHeight: 1.6 }}>
                ⏳ <strong>ملاحظة:</strong> بعد التسجيل، سيكون حسابك قيد المراجعة من قِبل الإدارة. سيتم تفعيله خلال 24 ساعة.
              </div>
            </div>

            <button type="submit" disabled={loading} style={{ width: '100%', padding: 16, background: loading ? '#94a3b8' : 'linear-gradient(135deg, #10b981, #059669)', color: '#fff', border: 'none', borderRadius: 14, fontSize: 15, fontWeight: 900, cursor: loading ? 'wait' : 'pointer', fontFamily: 'inherit', boxShadow: '0 6px 20px rgba(16,185,129,0.3)', marginBottom: 12 }}>
              {loading ? '⏳ جارٍ إنشاء الحساب...' : '✓ إنشاء الحساب'}
            </button>

            <div style={{ textAlign: 'center', fontSize: 12, color: '#64748b' }}>
              لديك حساب؟ <Link href="/merchant/login" style={{ color: '#0f4d3a', fontWeight: 900, textDecoration: 'underline' }}>سجّل دخولك</Link>
            </div>
          </form>
        )}

        <div style={{ height: 40 }} />
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={{ display: 'block', fontSize: 12, fontWeight: 900, color: '#475569', marginBottom: 6 }}>{label}</label>
      {children}
    </div>
  );
}

const inputStyle = {
  width: '100%',
  padding: '14px 16px',
  borderRadius: 12,
  border: '1px solid #cbd5e1',
  fontSize: 15,
  fontFamily: 'inherit',
  boxSizing: 'border-box',
  outline: 'none',
  background: '#fff',
  color: '#0f172a',
};
