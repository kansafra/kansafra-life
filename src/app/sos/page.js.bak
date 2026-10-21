'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/components/Toast';

const CATEGORIES = [
  { key: 'medical', label: 'طبي', icon: '🚑', color: '#ef4444' },
  { key: 'fire', label: 'حريق', icon: '🚒', color: '#f97316' },
  { key: 'police', label: 'أمني', icon: '🚔', color: '#3b82f6' },
  { key: 'rescue', label: 'إنقاذ', icon: '🆘', color: '#8b5cf6' },
  { key: 'other', label: 'أخرى', icon: '⚠️', color: '#64748b' },
];

export default function SOSPage() {
  const router = useRouter();
  const { success, error: tE } = useToast();
  const [step, setStep] = useState(1);
  const [category, setCategory] = useState(null);
  const [form, setForm] = useState({ full_name: '', phone: '', description: '', location_text: '' });
  const [loc, setLoc] = useState(null);
  const [sending, setSending] = useState(false);
  const [contacts, setContacts] = useState([]);
  const [locating, setLocating] = useState(false);

  useEffect(() => {
    loadContacts();
  }, []);

  async function loadContacts() {
    if (!supabase) return;
    const { data } = await supabase.from('emergency_contacts').select('*').eq('is_active', true).order('sort_order');
    setContacts(data || []);
  }

  function getLocation() {
    if (!navigator.geolocation) { tE('المتصفح لا يدعم GPS'); return; }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLoc({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLocating(false);
        success('✅ تم تحديد الموقع');
      },
      (err) => {
        setLocating(false);
        tE('تعذّر تحديد الموقع — يمكنك إدخال العنوان يدوياً');
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }

  async function sendAlert() {
    if (!form.full_name?.trim()) { tE('الاسم مطلوب'); return; }
    if (!form.phone?.trim()) { tE('رقم الهاتف مطلوب'); return; }
    setSending(true);
    try {
      // حفظ في DB
      const { data, error } = await supabase.from('sos_alerts').insert({
        full_name: form.full_name.trim(),
        phone: form.phone.trim(),
        category: category?.label || 'other',
        description: form.description?.trim() || null,
        location_text: form.location_text?.trim() || null,
        lat: loc?.lat || null,
        lng: loc?.lng || null,
        status: 'pending',
      }).select('id').single();

      if (error) throw error;

      // فتح واتساب الأدمن إذا مفعل
      try {
        const { data: setting } = await supabase.from('app_settings').select('value').eq('key', 'admin_whatsapp').maybeSingle();
        const { data: waSetting } = await supabase.from('app_settings').select('value').eq('key', 'sos_open_whatsapp').maybeSingle();
        
        if (setting?.value && waSetting?.value === 'true') {
          const lines = [
            '🚨 *بلاغ طوارئ — سند*',
            '',
            `📋 النوع: ${category?.label || 'غير محدد'}`,
            `👤 الاسم: ${form.full_name.trim()}`,
            `📞 الهاتف: ${form.phone.trim()}`,
            form.description ? `📝 الوصف: ${form.description.trim()}` : '',
            form.location_text ? `📍 العنوان: ${form.location_text.trim()}` : '',
            loc ? `🗺️ الموقع: https://maps.google.com/?q=${loc.lat},${loc.lng}` : '',
            '',
            `⏰ ${new Date().toLocaleString('ar-EG')}`,
          ].filter(Boolean);
          const adminWa = String(setting.value).replace(/\D/g, '');
          window.open(`https://wa.me/${adminWa}?text=${encodeURIComponent(lines.join('\n'))}`, '_blank');
        }
      } catch (e) { console.warn(e); }

      setStep(3);
      success('✅ تم إرسال البلاغ');
    } catch (e) { tE('تعذّر: ' + e.message); }
    setSending(false);
  }

  function callNumber(phone) {
    window.location.href = `tel:${phone}`;
  }

  // ═══ Step 3: Success ═══
  if (step === 3) {
    return (
      <div style={{ minHeight: '100vh', background: 'linear-gradient(180deg,#7f1d1d,#450a0a)', padding: 20, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ background: 'rgba(255,255,255,.08)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,.15)', borderRadius: 24, padding: 32, textAlign: 'center', maxWidth: 420, width: '100%' }}>
          <div style={{ width: 80, height: 80, margin: '0 auto 20px', background: 'linear-gradient(135deg,#10b981,#059669)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 40, color: '#fff' }}>✓</div>
          <h2 style={{ fontSize: 22, fontWeight: 900, color: '#fff', marginBottom: 8 }}>تم إرسال البلاغ</h2>
          <p style={{ fontSize: 14, color: 'rgba(255,255,255,.75)', lineHeight: 1.7, marginBottom: 24 }}>
            سيتم التواصل معك في أقرب وقت. إذا كانت الحالة خطيرة، اتصل مباشرة برقم الطوارئ.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <Link href="/" style={{ padding: 14, background: 'linear-gradient(135deg,#10b981,#059669)', color: '#fff', borderRadius: 12, textAlign: 'center', textDecoration: 'none', fontWeight: 900 }}>← العودة للرئيسية</Link>
            <button onClick={() => { setStep(1); setCategory(null); setForm({ full_name: '', phone: '', description: '', location_text: '' }); setLoc(null); }} style={{ padding: 12, background: 'rgba(255,255,255,.1)', color: '#fff', border: '1px solid rgba(255,255,255,.15)', borderRadius: 12, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit' }}>بلاغ جديد</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(180deg,#7f1d1d,#450a0a)', paddingBottom: 40 }}>
      {/* Header */}
      <div style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <button onClick={() => step > 1 ? setStep(step - 1) : router.back()} style={{ background: 'rgba(255,255,255,.15)', color: '#fff', border: 'none', width: 40, height: 40, borderRadius: '50%', fontSize: 18, cursor: 'pointer', fontFamily: 'inherit' }}>←</button>
        <div style={{ flex: 1 }}>
          <div style={{ color: '#fff', fontSize: 16, fontWeight: 900 }}>🚨 الطوارئ</div>
          <div style={{ color: 'rgba(255,255,255,.7)', fontSize: 11, marginTop: 2 }}>الخطوة {step} من 2</div>
        </div>
        <button onClick={() => router.push('/')} style={{ background: 'rgba(255,255,255,.15)', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: 8, fontSize: 11, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit' }}>✕</button>
      </div>

      {/* Progress Bar */}
      <div style={{ padding: '0 16px', marginBottom: 20 }}>
        <div style={{ height: 4, background: 'rgba(255,255,255,.15)', borderRadius: 2, overflow: 'hidden' }}>
          <div style={{ width: `${(step / 2) * 100}%`, height: '100%', background: 'linear-gradient(90deg,#10b981,#34d399)', transition: 'width .3s' }} />
        </div>
      </div>

      {/* Step 1: Category */}
      {step === 1 && (
        <div style={{ padding: '0 16px' }}>
          <h1 style={{ fontSize: 24, fontWeight: 900, color: '#fff', marginBottom: 8, textAlign: 'center' }}>ما نوع الحالة؟</h1>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,.6)', marginBottom: 24, textAlign: 'center' }}>اختر النوع لإرسال البلاغ للمختصين</p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12, marginBottom: 24 }}>
            {CATEGORIES.map(c => (
              <button key={c.key} onClick={() => { setCategory(c); setStep(2); }} style={{ background: category?.key === c.key ? `${c.color}40` : 'rgba(255,255,255,.08)', border: `2px solid ${category?.key === c.key ? c.color : 'rgba(255,255,255,.15)'}`, borderRadius: 16, padding: 20, textAlign: 'center', cursor: 'pointer', fontFamily: 'inherit', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                <div style={{ fontSize: 48 }}>{c.icon}</div>
                <div style={{ fontSize: 14, fontWeight: 900, color: '#fff' }}>{c.label}</div>
              </button>
            ))}
          </div>

          {/* Emergency Numbers */}
          {contacts.length > 0 && (
            <div>
              <div style={{ fontSize: 14, fontWeight: 900, color: '#fff', marginBottom: 12, textAlign: 'center' }}>☎️ أرقام الطوارئ</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
                {contacts.map(c => (
                  <button key={c.id} onClick={() => callNumber(c.phone)} style={{ background: 'rgba(255,255,255,.08)', border: '1px solid rgba(255,255,255,.15)', borderRadius: 12, padding: 12, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                    <div style={{ fontSize: 20 }}>{c.icon || '📞'}</div>
                    <div style={{ fontSize: 11, fontWeight: 800, color: '#fff' }}>{c.name}</div>
                    <div style={{ fontSize: 12, fontWeight: 900, color: '#fbbf24', direction: 'ltr' }}>{c.phone}</div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Step 2: Form */}
      {step === 2 && category && (
        <div style={{ padding: '0 16px' }}>
          <div style={{ textAlign: 'center', marginBottom: 20 }}>
            <div style={{ fontSize: 60, marginBottom: 8 }}>{category.icon}</div>
            <h1 style={{ fontSize: 22, fontWeight: 900, color: '#fff', marginBottom: 4 }}>{category.label}</h1>
            <p style={{ fontSize: 12, color: 'rgba(255,255,255,.6)' }}>املأ البيانات بسرعة</p>
          </div>

          <div style={{ background: 'rgba(255,255,255,.08)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,.15)', borderRadius: 20, padding: 20 }}>
            <div style={{ marginBottom: 14 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 800, color: 'rgba(255,255,255,.85)', marginBottom: 6 }}>الاسم *</label>
              <input type="text" value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} placeholder="اسمك الكامل" style={{ width: '100%', padding: 12, background: 'rgba(255,255,255,.1)', border: '1px solid rgba(255,255,255,.2)', borderRadius: 10, fontSize: 14, color: '#fff', fontFamily: 'inherit', boxSizing: 'border-box', outline: 'none' }} />
            </div>
            <div style={{ marginBottom: 14 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 800, color: 'rgba(255,255,255,.85)', marginBottom: 6 }}>رقم الهاتف *</label>
              <input type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="09XXXXXXXX" style={{ width: '100%', padding: 12, background: 'rgba(255,255,255,.1)', border: '1px solid rgba(255,255,255,.2)', borderRadius: 10, fontSize: 14, color: '#fff', fontFamily: 'inherit', boxSizing: 'border-box', outline: 'none', direction: 'ltr', textAlign: 'right' }} />
            </div>
            <div style={{ marginBottom: 14 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 800, color: 'rgba(255,255,255,.85)', marginBottom: 6 }}>الوصف</label>
              <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} placeholder="اشرح الحالة..." style={{ width: '100%', padding: 12, background: 'rgba(255,255,255,.1)', border: '1px solid rgba(255,255,255,.2)', borderRadius: 10, fontSize: 13, color: '#fff', fontFamily: 'inherit', boxSizing: 'border-box', outline: 'none', resize: 'vertical' }} />
            </div>
            <div style={{ marginBottom: 14 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 800, color: 'rgba(255,255,255,.85)', marginBottom: 6 }}>الموقع</label>
              <input type="text" value={form.location_text} onChange={(e) => setForm({ ...form, location_text: e.target.value })} placeholder="الحي / الشارع / علامة مميزة" style={{ width: '100%', padding: 12, background: 'rgba(255,255,255,.1)', border: '1px solid rgba(255,255,255,.2)', borderRadius: 10, fontSize: 14, color: '#fff', fontFamily: 'inherit', boxSizing: 'border-box', outline: 'none' }} />
            </div>
            
            <button onClick={getLocation} disabled={locating} style={{ width: '100%', padding: 12, background: loc ? 'rgba(16,185,129,.3)' : 'rgba(59,130,246,.3)', border: '1px solid rgba(255,255,255,.2)', borderRadius: 10, fontSize: 13, fontWeight: 800, color: '#fff', cursor: locating ? 'wait' : 'pointer', fontFamily: 'inherit', marginBottom: 16 }}>
              {locating ? '⏳ جارٍ التحديد...' : loc ? `✅ تم تحديد الموقع` : '📍 تحديد موقعي GPS'}
            </button>

            <button onClick={sendAlert} disabled={sending} style={{ width: '100%', padding: 16, background: sending ? '#94a3b8' : 'linear-gradient(135deg,#dc2626,#991b1b)', color: '#fff', border: 'none', borderRadius: 12, fontSize: 16, fontWeight: 900, cursor: sending ? 'not-allowed' : 'pointer', fontFamily: 'inherit', boxShadow: '0 8px 24px rgba(220,38,38,.4)' }}>
              {sending ? '... جارٍ الإرسال' : '🚨 إرسال البلاغ'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
