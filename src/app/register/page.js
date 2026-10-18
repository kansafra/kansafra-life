'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { registerEntity } from '@/lib/auth';
import { useToast } from '@/components/Toast';

const ENTITY_TYPES = [
  { key: 'merchant', label: 'متجر / محل', icon: '🏪' },
  { key: 'restaurant', label: 'مطعم', icon: '🍽️' },
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

export default function RegisterPage() {
  const router = useRouter();
  const { success, error: tE } = useToast();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({ display_name: '', phone: '', password: '', password_confirm: '', entity_type: 'merchant' });
  const [availablePlans, setAvailablePlans] = useState([]);
  const [selectedPlanId, setSelectedPlanId] = useState('');
  const [loading, setLoading] = useState(false);
  const [pendingApproval, setPendingApproval] = useState(null);

  useEffect(() => {
    async function loadPlans() {
      if (!supabase) return;
      const { data } = await supabase.from('subscription_plans').select('*').eq('is_active', true).order('sort_order');
      if (Array.isArray(data)) {
        setAvailablePlans(data);
        const free = data.find((p) => p.name === 'free');
        if (free) setSelectedPlanId(free.id);
      }
    }
    loadPlans();
  }, []);

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.display_name.trim() || form.display_name.trim().length < 3) { tE('اسم النشاط مطلوب (3 أحرف+)'); return; }
    if (!form.phone.trim() || form.phone.replace(/\D/g, '').length < 9) { tE('رقم الهاتف غير صحيح'); return; }
    if (!form.password || form.password.length < 6) { tE('كلمة المرور 6 أحرف+'); return; }
    if (form.password !== form.password_confirm) { tE('كلمتا المرور غير متطابقتين'); return; }

    setLoading(true);
    try {
      const newEntity = await registerEntity({
        phone: form.phone.trim(),
        password: form.password,
        display_name: form.display_name.trim(),
        entity_type: form.entity_type,
        pendingApproval: true,
        plan_id: selectedPlanId || null,
      });
      setPendingApproval(newEntity);
    } catch (err) {
      tE(err.message || 'تعذّر إنشاء الحساب');
    } finally {
      setLoading(false);
    }
  }

  // ═══ Success Screen ═══
  if (pendingApproval) {
    return (
      <div style={{ minHeight: '100vh', background: 'linear-gradient(180deg, #0a1f16 0%, #061410 100%)', padding: 20, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ background: 'rgba(255,255,255,.03)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,.1)', borderRadius: 24, padding: 32, textAlign: 'center', maxWidth: 400, width: '100%' }}>
          <div style={{ width: 80, height: 80, margin: '0 auto 20px', background: 'rgba(251,191,36,.15)', border: '2px solid #fbbf24', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 40 }}>⏳</div>
          <h2 style={{ fontSize: 22, fontWeight: 900, color: '#fff', marginBottom: 8 }}>تم إرسال طلبك</h2>
          <p style={{ fontSize: 14, color: 'rgba(255,255,255,.7)', lineHeight: 1.7, marginBottom: 24 }}>حسابك قيد المراجعة من الإدارة. سيتم تفعيله قريباً.</p>
          <div style={{ padding: 16, background: 'rgba(255,255,255,.06)', borderRadius: 12, marginBottom: 24 }}>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,.5)', marginBottom: 6 }}>رقم حسابك</div>
            <div style={{ fontSize: 16, fontWeight: 900, color: '#22c55e', fontFamily: 'monospace', direction: 'ltr' }}>{pendingApproval.username}</div>
          </div>
          <Link href="/login" style={{ display: 'block', padding: 14, background: 'linear-gradient(135deg,#10b981,#059669)', color: '#fff', borderRadius: 12, textDecoration: 'none', fontWeight: 900 }}>← العودة للدخول</Link>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(180deg, #0a1f16 0%, #061410 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div style={{ background: 'rgba(255,255,255,.03)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,.1)', borderRadius: 24, padding: '32px 24px', maxWidth: 440, width: '100%' }}>
        
        {/* Brand */}
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 56, height: 56, borderRadius: 16, background: 'linear-gradient(135deg, #10b981, #059669)', fontSize: 28, marginBottom: 12 }}>🏪</div>
          <h1 style={{ fontSize: 22, fontWeight: 900, color: '#fff', marginBottom: 4 }}>انضم لمنصة سند</h1>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,.6)' }}>سجّل نشاطك وابدأ البيع</p>
        </div>

        {/* Steps */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginBottom: 24 }}>
          {[1, 2].map(s => (
            <div key={s} style={{ width: 40, height: 4, borderRadius: 2, background: step >= s ? '#10b981' : 'rgba(255,255,255,.15)' }} />
          ))}
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 800, color: 'rgba(255,255,255,.8)', marginBottom: 6 }}>نوع النشاط</label>
            <select value={form.entity_type} onChange={(e) => update('entity_type', e.target.value)} style={{ width: '100%', padding: '14px 16px', background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.1)', borderRadius: 12, color: '#fff', fontSize: 14, fontFamily: 'inherit', boxSizing: 'border-box', outline: 'none' }}>
              {ENTITY_TYPES.map(t => <option key={t.key} value={t.key} style={{ background: '#0a1f16', color: '#fff' }}>{t.icon} {t.label}</option>)}
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 800, color: 'rgba(255,255,255,.8)', marginBottom: 6 }}>اسم النشاط</label>
            <input type="text" value={form.display_name} onChange={(e) => update('display_name', e.target.value)} placeholder="اسم متجرك أو نشاطك" style={{ width: '100%', padding: '14px 16px', background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.1)', borderRadius: 12, color: '#fff', fontSize: 14, fontFamily: 'inherit', boxSizing: 'border-box', outline: 'none', textAlign: 'right' }} />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 800, color: 'rgba(255,255,255,.8)', marginBottom: 6 }}>رقم الهاتف</label>
            <input type="tel" value={form.phone} onChange={(e) => update('phone', e.target.value)} placeholder="09XXXXXXXX" style={{ width: '100%', padding: '14px 16px', background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.1)', borderRadius: 12, color: '#fff', fontSize: 14, fontFamily: 'inherit', boxSizing: 'border-box', outline: 'none', direction: 'ltr', textAlign: 'right' }} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 800, color: 'rgba(255,255,255,.8)', marginBottom: 6 }}>كلمة المرور</label>
              <input type="password" value={form.password} onChange={(e) => update('password', e.target.value)} placeholder="••••••••" style={{ width: '100%', padding: '14px 16px', background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.1)', borderRadius: 12, color: '#fff', fontSize: 14, fontFamily: 'inherit', boxSizing: 'border-box', outline: 'none' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 800, color: 'rgba(255,255,255,.8)', marginBottom: 6 }}>تأكيدها</label>
              <input type="password" value={form.password_confirm} onChange={(e) => update('password_confirm', e.target.value)} placeholder="••••••••" style={{ width: '100%', padding: '14px 16px', background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.1)', borderRadius: 12, color: '#fff', fontSize: 14, fontFamily: 'inherit', boxSizing: 'border-box', outline: 'none' }} />
            </div>
          </div>

          {availablePlans.length > 0 && (
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 800, color: 'rgba(255,255,255,.8)', marginBottom: 6 }}>اختر الباقة</label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
                {availablePlans.map(p => (
                  <button key={p.id} type="button" onClick={() => setSelectedPlanId(p.id)} style={{ padding: 12, background: selectedPlanId === p.id ? 'rgba(16,185,129,.15)' : 'rgba(255,255,255,.04)', border: `1px solid ${selectedPlanId === p.id ? '#10b981' : 'rgba(255,255,255,.1)'}`, borderRadius: 10, color: '#fff', cursor: 'pointer', textAlign: 'center', fontFamily: 'inherit' }}>
                    <div style={{ fontSize: 18, marginBottom: 4 }}>{p.icon || '💎'}</div>
                    <div style={{ fontSize: 12, fontWeight: 900 }}>{p.name_en}</div>
                    <div style={{ fontSize: 11, color: '#fbbf24', marginTop: 2 }}>${p.price}</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          <button type="submit" disabled={loading} style={{ marginTop: 8, padding: 16, background: loading ? 'rgba(255,255,255,.1)' : 'linear-gradient(135deg,#10b981,#059669)', color: '#fff', border: 'none', borderRadius: 12, fontSize: 15, fontWeight: 900, cursor: loading ? 'not-allowed' : 'pointer', fontFamily: 'inherit' }}>
            {loading ? '... جارٍ الإرسال' : '✓ إنشاء حساب'}
          </button>
        </form>

        <div style={{ marginTop: 24, textAlign: 'center' }}>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,.6)', marginBottom: 12 }}>لديك حساب بالفعل؟</p>
          <Link href="/login" style={{ display: 'block', padding: 12, background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.1)', color: '#fff', borderRadius: 10, textDecoration: 'none', fontSize: 13, fontWeight: 800 }}>← تسجيل الدخول</Link>
        </div>
      </div>
    </div>
  );
}
