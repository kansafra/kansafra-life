'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/components/Toast';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const { success, error: toastError } = useToast();

  const [userType, setUserType] = useState('customer');
  const [phone, setPhone] = useState('');
  const [name, setName] = useState('');
  const [notes, setNotes] = useState('');
  const [sending, setSending] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  function normalizePhone(p) {
    return (p || '').replace(/[^0-9]/g, '');
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const normalizedPhone = normalizePhone(phone);
    if (normalizedPhone.length < 8) { toastError('رقم الهاتف غير صحيح'); return; }

    setSending(true);
    try {
      // التحقق من وجود الحساب
      let accountExists = false;
      let userId = null;
      let accountName = name.trim();

      if (userType === 'customer') {
        const { data } = await supabase.from('customers').select('*').like('phone', '%' + normalizedPhone.slice(-9)).maybeSingle();
        if (data) {
          accountExists = true;
          userId = data.id;
          if (!accountName) accountName = data.name;
        }
      } else {
        const { data } = await supabase.from('entities').select('*').like('phone', '%' + normalizedPhone.slice(-9)).maybeSingle();
        if (data) {
          accountExists = true;
          userId = data.id;
          if (!accountName) accountName = data.display_name;
        }
      }

      if (!accountExists) {
        toastError('لا يوجد حساب مسجل بهذا الرقم');
        return;
      }

      // التحقق من عدم وجود طلب معلق
      const { data: existing } = await supabase
        .from('password_reset_requests')
        .select('id')
        .eq('phone', normalizedPhone)
        .eq('status', 'pending')
        .maybeSingle();

      if (existing) {
        toastError('لديك طلب معلق بالفعل. يرجى الانتظار حتى تتم معالجته.');
        return;
      }

      // إنشاء طلب
      const { error } = await supabase.from('password_reset_requests').insert({
        phone: normalizedPhone,
        user_type: userType,
        user_id: userId,
        name: accountName || 'مستخدم',
        notes: notes.trim() || null,
        status: 'pending',
      });

      if (error) throw error;

      success('✅ تم استلام طلبك');
      setSubmitted(true);
    } catch (err) {
      console.error(err);
      toastError('فشل إرسال الطلب، حاول مجدداً');
    } finally { setSending(false); }
  }

  if (submitted) {
    return (
      <div style={{ minHeight: '100vh', background: 'linear-gradient(180deg, #f0fdf4 0%, #f8fafc 40%)', padding: 20 }}>
        <div style={{ maxWidth: 500, margin: '60px auto 0' }}>
          <div style={{ background: '#fff', borderRadius: 24, padding: 40, textAlign: 'center', boxShadow: '0 20px 40px rgba(0,0,0,0.05)' }}>
            <div style={{ fontSize: 64, marginBottom: 20 }}>✅</div>
            <h1 style={{ fontSize: 22, fontWeight: 900, color: '#0f172a', marginBottom: 12 }}>تم استلام طلبك</h1>
            <p style={{ fontSize: 14, color: '#64748b', lineHeight: 1.7, marginBottom: 24 }}>
              سيقوم فريق الدعم بمعالجة طلبك خلال 24 ساعة. سيتم التواصل معك على رقمك <strong>{phone}</strong> عبر واتساب لتزويدك بكلمة المرور الجديدة.
            </p>
            <div style={{ background: 'rgba(14,165,233,0.08)', border: '1px solid rgba(14,165,233,0.2)', borderRadius: 12, padding: 14, marginBottom: 24, textAlign: 'right' }}>
              <div style={{ fontSize: 12, color: '#0284c7', fontWeight: 900, marginBottom: 4 }}>💡 نصيحة</div>
              <div style={{ fontSize: 11, color: '#475569', lineHeight: 1.6 }}>احتفظ برقم هاتفك مفتوحاً ومتاحاً. إذا لم يصلك رد خلال 24 ساعة، تواصل معنا مباشرة.</div>
            </div>
            <Link href={userType === 'customer' ? '/login' : '/merchant/login'} style={{ display: 'inline-block', background: '#0f4d3a', color: '#fff', padding: '12px 24px', borderRadius: 12, textDecoration: 'none', fontSize: 14, fontWeight: 900 }}>
              ← العودة لتسجيل الدخول
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(180deg, #f0fdf4 0%, #f8fafc 40%)' }}>
      <div style={{ padding: '16px 20px' }}>
        <Link href="/" style={{ color: '#0f4d3a', textDecoration: 'none', fontSize: 14, fontWeight: 900 }}>← العودة للرئيسية</Link>
      </div>

      <div style={{ padding: '0 20px', maxWidth: 480, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div style={{ width: 80, height: 80, borderRadius: 22, background: 'linear-gradient(135deg, #f59e0b, #d97706)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 38, marginBottom: 12, boxShadow: '0 10px 30px rgba(245,158,11,0.25)' }}>🔑</div>
          <h1 style={{ fontSize: 24, fontWeight: 900, color: '#0f172a', margin: 0 }}>نسيت كلمة المرور؟</h1>
          <p style={{ fontSize: 13, color: '#64748b', margin: '6px 0 0' }}>أدخل رقم هاتفك وسنتواصل معك</p>
        </div>

        <div style={{ display: 'flex', background: '#fff', borderRadius: 14, padding: 4, marginBottom: 20, border: '1px solid #e2e8f0' }}>
          <button onClick={() => setUserType('customer')} style={{ flex: 1, padding: 12, background: userType === 'customer' ? '#0f4d3a' : 'transparent', color: userType === 'customer' ? '#fff' : '#64748b', border: 'none', borderRadius: 10, fontSize: 13, fontWeight: 900, cursor: 'pointer', fontFamily: 'inherit' }}>
            🛒 زبون
          </button>
          <button onClick={() => setUserType('merchant')} style={{ flex: 1, padding: 12, background: userType === 'merchant' ? '#0f4d3a' : 'transparent', color: userType === 'merchant' ? '#fff' : '#64748b', border: 'none', borderRadius: 10, fontSize: 13, fontWeight: 900, cursor: 'pointer', fontFamily: 'inherit' }}>
            🏪 تاجر
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ background: '#fff', borderRadius: 20, padding: 24, boxShadow: '0 4px 20px rgba(0,0,0,0.04)' }}>
          <div style={{ marginBottom: 14 }}>
            <label style={labelStyle}>رقم الهاتف المسجل *</label>
            <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} required style={inputStyle} placeholder="09xxxxxxxx" />
          </div>

          <div style={{ marginBottom: 14 }}>
            <label style={labelStyle}>الاسم (اختياري)</label>
            <input value={name} onChange={e => setName(e.target.value)} style={inputStyle} placeholder="اسمك" />
          </div>

          <div style={{ marginBottom: 20 }}>
            <label style={labelStyle}>ملاحظات (اختياري)</label>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} style={{ ...inputStyle, height: 60, resize: 'none' }} placeholder="أي معلومة إضافية قد تساعدنا..." />
          </div>

          <button type="submit" disabled={sending} style={{ width: '100%', padding: 16, background: sending ? '#94a3b8' : 'linear-gradient(135deg, #f59e0b, #d97706)', color: '#fff', border: 'none', borderRadius: 14, fontSize: 15, fontWeight: 900, cursor: sending ? 'wait' : 'pointer', fontFamily: 'inherit', boxShadow: '0 6px 20px rgba(245,158,11,0.3)' }}>
            {sending ? '⏳ جارٍ الإرسال...' : '📩 إرسال طلب الاستعادة'}
          </button>
        </form>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '24px 0 16px' }}>
          <div style={{ flex: 1, height: 1, background: '#e2e8f0' }} />
          <span style={{ fontSize: 11, color: '#94a3b8', fontWeight: 900 }}>تذكرت كلمة المرور؟</span>
          <div style={{ flex: 1, height: 1, background: '#e2e8f0' }} />
        </div>

        <Link href={userType === 'customer' ? '/login' : '/merchant/login'} style={{ display: 'block', width: '100%', padding: 14, background: '#fff', color: '#0f4d3a', border: '2px solid #0f4d3a', borderRadius: 14, fontSize: 14, fontWeight: 900, textAlign: 'center', textDecoration: 'none', boxSizing: 'border-box' }}>
          ← العودة لتسجيل الدخول
        </Link>
      </div>
    </div>
  );
}

const labelStyle = { display: 'block', fontSize: 12, fontWeight: 900, color: '#475569', marginBottom: 6 };
const inputStyle = { width: '100%', padding: '12px 16px', borderRadius: 12, border: '1px solid #cbd5e1', fontSize: 14, fontFamily: 'inherit', boxSizing: 'border-box', outline: 'none', background: '#f8fafc' };
