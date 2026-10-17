'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { registerEntity } from '@/lib/auth';
import { supabase } from '@/lib/supabase';

const ENTITY_TYPES = [
  { key: 'merchant',    label: 'متجر / محل',     icon: '🏪' },
  { key: 'restaurant',  label: 'مطعم',           icon: '🍽️' },
  { key: 'doctor',      label: 'طبيب / عيادة',   icon: '👨‍⚕️' },
  { key: 'pharmacy',    label: 'صيدلية',         icon: '💊' },
  { key: 'school',      label: 'مدرسة / معهد',   icon: '🏫' },
  { key: 'mosque',      label: 'جامع',           icon: '🕌' },
  { key: 'charity',     label: 'جمعية خيرية',    icon: '🤝' },
  { key: 'sports',      label: 'نادي رياضي',     icon: '⚽' },
  { key: 'hotel',       label: 'فندق',           icon: '🏨' },
  { key: 'office',      label: 'مكتب خدمات',     icon: '📁' },
  { key: 'exchange',    label: 'مكتب صرافة',     icon: '💱' },
  { key: 'transport',   label: 'مواصلات',        icon: '🚗' },
  { key: 'memory',      label: 'ذاكرة رقمية',    icon: '📸' },
  { key: 'municipality',label: 'بلدية',          icon: '🏢' },
  { key: 'craftsman',   label: 'حرفي',          icon: '🛠️' },
  { key: 'workshop',    label: 'ورشة تصنيع',    icon: '🏭' },
  { key: 'isp',         label: 'مزود إنترنت',   icon: '📡' },

];

export default function RegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    entity_type: 'merchant',
    display_name: '',
    phone: '',
    password: '',
    password2: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [pendingApproval, setPendingApproval] = useState(null);
  const [availablePlans, setAvailablePlans] = useState([]);
  const [selectedPlanId, setSelectedPlanId] = useState('');

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
    setError('');
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    if (!form.display_name.trim() || form.display_name.trim().length < 3) {
      setError('الاسم مطلوب (3 أحرف على الأقل)');
      return;
    }
    const cleanPhone = form.phone.replace(/[^0-9]/g, '');
    if (cleanPhone.length < 9) {
      setError('رقم الهاتف غير صحيح');
      return;
    }
    if (!form.password || form.password.length < 6) {
      setError('كلمة المرور 6 أحرف على الأقل');
      return;
    }
    if (form.password !== form.password2) {
      setError('كلمتا المرور غير متطابقتين');
      return;
    }

    setLoading(true);
    try {
      const newEntity = await registerEntity({
        phone: cleanPhone,
        password: form.password,
        display_name: form.display_name,
        entity_type: form.entity_type,
        pendingApproval: true,
        plan_id: selectedPlanId});
      
      // نجهز رسالة واتساب للأدمن
      try {
        const { data: settings } = await supabase
          .from('app_settings')
          .select('value')
          .eq('key', 'admin_whatsapp')
          .maybeSingle();
        
        const adminPhone = settings?.value || '963930694339';
        const msg = `🆕 *طلب حساب جديد على سند*\n\n` +
          `👤 *الاسم:* ${form.display_name}\n` +
          `📞 *الهاتف:* ${cleanPhone}\n` +
          `🏪 *النوع:* ${form.entity_type}\n` +
          `🔐 *رقم الحساب:* ${newEntity.username}\n` +
          `⏰ *الوقت:* ${new Date().toLocaleString('ar-EG')}\n\n` +
          `✅ للموافقة: افتح لوحة الأدمن → إدارة الكيانات\n` +
          `🔗 ${window.location.origin}/admin/entities`;
        
        const waUrl = `https://wa.me/${adminPhone}?text=${encodeURIComponent(msg)}`;
        
        // نفتح واتساب يوجد نفس التبويب
        setPendingApproval({ entity: newEntity, waUrl });
        
        // نحاول نفتح واتساب تلقائياً بعد ثانية
        setTimeout(() => {
          window.location.href = waUrl;
        }, 1200);
      } catch (e) {
        setPendingApproval({ entity: newEntity, waUrl: null });
      }
    } catch (err) {
      setError(err.message || 'تعذّر إنشاء الحساب');
      setLoading(false);
    }
  }

  useEffect(() => {
    async function loadPlans() {
      if (!supabase) return;
      const { data } = await supabase
        .from('subscription_plans')
        .select('*')
        .eq('is_active', true)
        .order('sort_order');
      if (Array.isArray(data)) {
        setAvailablePlans(data);
        // نختار Free افتراضياً
        const free = data.find((p) => p.name === 'free');
        if (free) setSelectedPlanId(free.id);
      }
    }
    loadPlans();
  }, []);

  if (pendingApproval) {
    return (
      <div className="sect-page" style={{ minHeight: '100vh', background: 'linear-gradient(180deg, #0a1f16 0%, #061410 100%)', paddingBottom: 40 }}>
        <div className="inv-header" style={{ background: 'transparent', border: 'none' }}>
          <span className="inv-title" style={{ color: '#fff' }}>طلبك قيد المراجعة</span>
        </div>
        <div style={{ padding: '40px 24px', textAlign: 'center' }}>
          <div style={{ fontSize: 72, marginBottom: 20 }}>⏳</div>
          <h1 style={{ fontSize: 24, fontWeight: 900, color: '#fff', marginBottom: 12 }}>
            تم إرسال طلبك بنجاح
          </h1>
          <p style={{ fontSize: 14, color: 'rgba(255,255,255,.7)', lineHeight: 1.8, maxWidth: 340, margin: '0 auto 24px' }}>
            طلبك قيد المراجعة من الإدارة. سيتم تفعيل الحساب بعد الموافقة.
            <br />يرجى الانتظار حتى تصلك رسالة التأكيد.
          </p>

          <div style={{ padding: 16, background: 'rgba(255,255,255,.05)', borderRadius: 14, marginBottom: 24, maxWidth: 340, margin: '0 auto 24px' }}>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,.5)', marginBottom: 6 }}>رقم حسابك</div>
            <div style={{ fontSize: 15, fontWeight: 900, color: '#22c55e', fontFamily: 'monospace', direction: 'ltr' }}>
              {pendingApproval.entity?.username}
            </div>
          </div>

          {pendingApproval.waUrl && (
            <div style={{ maxWidth: 340, margin: '0 auto' }}>
              <a
                href={pendingApproval.waUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'block', padding: 16,
                  background: 'linear-gradient(135deg, #25D366, #128C7E)',
                  color: '#fff', borderRadius: 14,
                  fontSize: 15, fontWeight: 900,
                  textDecoration: 'none', marginBottom: 12,
                }}
              >
                💬 إرسال الطلب للإدارة عبر واتساب
              </a>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,.5)' }}>
                اضغط الزر إذا لم يفتح تلقائياً
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="sect-page" style={{ minHeight: '100vh', background: 'linear-gradient(180deg, #0a1f16 0%, #061410 100%)', paddingBottom: 40 }}>
      <div className="inv-header" style={{ background: 'transparent', border: 'none' }}>
        <button
          className="inv-back"
          onClick={() => router.push('/')}
          type="button"
          style={{ color: '#fff', background: 'rgba(255,255,255,.1)' }}
        >
          →
        </button>
        <span className="inv-title" style={{ color: '#fff' }}>إنشاء حساب</span>
        <span style={{ width: 40 }} />
      </div>

      <div style={{ padding: '20px 24px 30px', textAlign: 'center' }}>
        <div style={{ fontSize: 48, marginBottom: 10 }}>🎉</div>
        <h1 style={{ fontSize: 24, fontWeight: 900, color: '#fff', marginBottom: 8 }}>
          انضم إلى سند
        </h1>
        <p style={{ fontSize: 13, color: 'rgba(255,255,255,.6)', lineHeight: 1.7 }}>
          سجّل حسابك المجاني وابدأ رحلتك الرقمية
        </p>
      </div>

      <form onSubmit={handleSubmit} style={{ padding: '0 20px' }}>
        {/* الخطوة 1: نوع الحساب */}
        {step === 1 && (
          <>
            <div style={{ fontSize: 13, fontWeight: 900, color: '#fff', marginBottom: 12 }}>
              1️⃣ اختر نوع نشاطك
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10, marginBottom: 20 }}>
              {ENTITY_TYPES.map((t) => (
                <button
                  key={t.key}
                  type="button"
                  onClick={() => update('entity_type', t.key)}
                  style={{
                    padding: 14,
                    background: form.entity_type === t.key ? 'rgba(34,197,94,.15)' : 'rgba(255,255,255,.04)',
                    border: form.entity_type === t.key ? '2px solid #22c55e' : '1px solid rgba(255,255,255,.1)',
                    borderRadius: 14,
                    color: '#fff',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 6,
                  }}
                >
                  <span style={{ fontSize: 24 }}>{t.icon}</span>
                  <span style={{ fontSize: 11.5, fontWeight: 800 }}>{t.label}</span>
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={() => setStep(2)}
              style={{ width: '100%', padding: 16, background: 'linear-gradient(135deg, #22c55e, #16a34a)', color: '#fff', border: 'none', borderRadius: 14, fontSize: 15, fontWeight: 900, cursor: 'pointer' }}
            >
              التالي ←
            </button>
          </>
        )}

        {/* الخطوة 2: البيانات */}
        {step === 2 && (
          <>
            <div style={{ fontSize: 13, fontWeight: 900, color: '#fff', marginBottom: 12 }}>
              2️⃣ بياناتك
            </div>

            <div className="new-service-field" style={{ marginBottom: 12 }}>
              <label style={{ color: '#fff', fontSize: 12, fontWeight: 800, marginBottom: 6, display: 'block' }}>
                اسم النشاط أو اسمك الكامل *
              </label>
              <input
                type="text"
                value={form.display_name}
                onChange={(e) => update('display_name', e.target.value)}
                placeholder="مثال: متجر النور"
                className="new-service-input"
                style={{ background: 'rgba(255,255,255,.06)', color: '#fff', border: '1px solid rgba(255,255,255,.12)' }}
              />
            </div>

            <div className="new-service-field" style={{ marginBottom: 12 }}>
              <label style={{ color: '#fff', fontSize: 12, fontWeight: 800, marginBottom: 6, display: 'block' }}>
                رقم الهاتف *
              </label>
              <input
                type="tel"
                inputMode="tel"
                value={form.phone}
                onChange={(e) => update('phone', e.target.value)}
                placeholder="09XXXXXXXX"
                className="new-service-input"
                style={{ background: 'rgba(255,255,255,.06)', color: '#fff', border: '1px solid rgba(255,255,255,.12)', direction: 'ltr', textAlign: 'right' }}
              />
            </div>

            <div className="new-service-field" style={{ marginBottom: 12 }}>
              <label style={{ color: '#fff', fontSize: 12, fontWeight: 800, marginBottom: 6, display: 'block' }}>
                كلمة المرور *
              </label>
              <input
                type="password"
                value={form.password}
                onChange={(e) => update('password', e.target.value)}
                placeholder="6 أحرف على الأقل"
                className="new-service-input"
                style={{ background: 'rgba(255,255,255,.06)', color: '#fff', border: '1px solid rgba(255,255,255,.12)' }}
              />
            </div>

            <div className="new-service-field" style={{ marginBottom: 20 }}>
              <label style={{ color: '#fff', fontSize: 12, fontWeight: 800, marginBottom: 6, display: 'block' }}>
                تأكيد كلمة المرور *
              </label>
              <input
                type="password"
                value={form.password2}
                onChange={(e) => update('password2', e.target.value)}
                placeholder="أعد كتابة كلمة المرور"
                className="new-service-input"
                style={{ background: 'rgba(255,255,255,.06)', color: '#fff', border: '1px solid rgba(255,255,255,.12)' }}
              />
            </div>

            {error && (
              <div style={{ padding: 12, background: 'rgba(220,38,38,.15)', border: '1px solid rgba(220,38,38,.3)', borderRadius: 12, color: '#fca5a5', fontSize: 12.5, marginBottom: 16, textAlign: 'center' }}>
                ⚠️ {error}
              </div>
            )}

            <div style={{ display: 'flex', gap: 10 }}>
              <button
                type="button"
                onClick={() => setStep(1)}
                style={{ flex: 1, padding: 16, background: 'rgba(255,255,255,.08)', color: '#fff', border: 'none', borderRadius: 14, fontSize: 14, fontWeight: 900, cursor: 'pointer' }}
              >
                → رجوع
              </button>
              <button
                type="button"
                onClick={() => setStep(3)}
                style={{ flex: 2, padding: 16, background: 'linear-gradient(135deg, #22c55e, #16a34a)', color: '#fff', border: 'none', borderRadius: 14, fontSize: 15, fontWeight: 900, cursor: 'pointer' }}
              >
                التالي ←
              </button>
            </div>
          </>
        )}

        {/* الخطوة 3: اختيار الباقة */}
        {step === 3 && (
          <>
            <div style={{ fontSize: 13, fontWeight: 900, color: '#fff', marginBottom: 12 }}>
              3️⃣ اختر باقتك
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
              {availablePlans.map((p) => {
                const isSelected = selectedPlanId === p.id;
                const isFree = Number(p.price) === 0;
                const features = Array.isArray(p.features) ? p.features.slice(0, 3) : [];
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setSelectedPlanId(p.id)}
                    style={{
                      padding: 16,
                      background: isSelected ? p.color + '25' : 'rgba(255,255,255,.04)',
                      border: isSelected ? '2px solid ' + (p.color || '#22c55e') : '1px solid rgba(255,255,255,.1)',
                      borderRadius: 14,
                      color: '#fff',
                      cursor: 'pointer',
                      textAlign: 'right',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                      <span style={{ fontSize: 26 }}>{p.icon || '💎'}</span>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 15, fontWeight: 900 }}>
                          {p.name_en || p.name}
                          {p.is_featured && <span style={{ fontSize: 10, marginInlineStart: 8, color: '#fbbf24' }}>⭐ مميزة</span>}
                        </div>
                        <div style={{ fontSize: 16, fontWeight: 900, color: p.color || '#22c55e', direction: 'ltr', marginTop: 4 }}>
                          ${p.price} <span style={{ fontSize: 10, color: 'rgba(255,255,255,.5)' }}>/شهر</span>
                        </div>
                      </div>
                      {isSelected && (
                        <span style={{ fontSize: 20 }}>✅</span>
                      )}
                    </div>
                    {features.length > 0 && (
                      <div style={{ fontSize: 11, color: 'rgba(255,255,255,.7)', lineHeight: 1.6 }}>
                        {features.map((f, i) => <div key={i}>✓ {f}</div>)}
                      </div>
                    )}
                    {isFree && (
                      <div style={{ fontSize: 11, marginTop: 6, color: '#22c55e', fontWeight: 900 }}>
                        🎁 يبدأ فوراً بعد الموافقة
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            {error && (
              <div style={{ padding: 12, background: 'rgba(220,38,38,.15)', border: '1px solid rgba(220,38,38,.3)', borderRadius: 12, color: '#fca5a5', fontSize: 12.5, marginBottom: 16, textAlign: 'center' }}>
                ⚠️ {error}
              </div>
            )}

            <div style={{ display: 'flex', gap: 10 }}>
              <button
                type="button"
                onClick={() => setStep(2)}
                style={{ flex: 1, padding: 16, background: 'rgba(255,255,255,.08)', color: '#fff', border: 'none', borderRadius: 14, fontSize: 14, fontWeight: 900, cursor: 'pointer' }}
              >
                → رجوع
              </button>
              <button
                type="submit"
                disabled={loading}
                style={{ flex: 2, padding: 16, background: loading ? '#555' : 'linear-gradient(135deg, #22c55e, #16a34a)', color: '#fff', border: 'none', borderRadius: 14, fontSize: 15, fontWeight: 900, cursor: loading ? 'wait' : 'pointer' }}
              >
                {loading ? '... جارٍ التسجيل' : '🎉 إنشاء الحساب'}
              </button>
            </div>
          </>
        )}
      </form>

      <div style={{ textAlign: 'center', marginTop: 30, padding: '0 20px' }}>
        <div style={{ fontSize: 12.5, color: 'rgba(255,255,255,.5)' }}>
          لديك حساب؟
          <Link href="/login" style={{ color: '#22c55e', fontWeight: 900, marginInlineStart: 6, textDecoration: 'none' }}>
            سجّل دخولك
          </Link>
        </div>
      </div>
    </div>
  );
}
