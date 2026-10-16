'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useT } from '@/lib/useT';

const FALLBACK_CATEGORIES = [
  { category: 'medical',  name_ar: 'طبي',    icon: '🚑', color: '#dc2626', whatsapp: null, phone: null },
  { category: 'security', name_ar: 'أمني',   icon: '🚨', color: '#1e40af', whatsapp: null, phone: null },
  { category: 'civil',    name_ar: 'مدني',   icon: '🚒', color: '#ea580c', whatsapp: null, phone: null },
  { category: 'service',  name_ar: 'خدمي',   icon: '⚡', color: '#ca8a04', whatsapp: null, phone: null },
  { category: 'env',      name_ar: 'بيئي',   icon: '🌿', color: '#16a34a', whatsapp: null, phone: null },
];

const genRefCode = () => {
  const d = new Date();
  const yy = String(d.getFullYear()).slice(-2);
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  const rand = Math.floor(Math.random() * 9000) + 1000;
  return `SND-${yy}${mm}${dd}-${rand}`;
};

export default function SosPage() {
  const router = useRouter();
  const { t } = useT();
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [coords, setCoords] = useState(null);
  const [geoStatus, setGeoStatus] = useState('idle');
  const [geoMsg, setGeoMsg] = useState('لم يتم تحديد الموقع بعد');
  const [submitting, setSubmitting] = useState(false);
  const [refCode, setRefCode] = useState('');
  const [error, setError] = useState('');
  const [categories, setCategories] = useState(FALLBACK_CATEGORIES);
  const [sentContact, setSentContact] = useState(null);
  const [locationRequired, setLocationRequired] = useState(true);

  // تحديد الموقع
  const requestLocation = () => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      setGeoStatus('err');
      setGeoMsg('المتصفح لا يدعم تحديد الموقع');
      return;
    }
    setGeoStatus('loading');
    setGeoMsg('جارٍ تحديد موقعك...');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setGeoStatus('ok');
        setGeoMsg(`${pos.coords.latitude.toFixed(5)}, ${pos.coords.longitude.toFixed(5)}`);
      },
      (err) => {
        setGeoStatus('err');
        setGeoMsg(
          err.code === 1 ? 'تم رفض الوصول للموقع — يرجى السماح'
          : err.code === 2 ? 'تعذّر تحديد الموقع — جرّب يوجد مكان مفتوح'
          : 'انتهت مدة المحاولة — أعد المحاولة'
        );
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  };

  useEffect(() => { requestLocation(); }, []);

  // تحميل الأصناف من DB + الإعدادات
  useEffect(() => {
    async function load() {
      if (!supabase) return;
      try {
        const [contactsRes, settingsRes] = await Promise.all([
          supabase.from('emergency_contacts').select('*').eq('is_active', true).order('sort_order'),
          supabase.from('app_settings').select('*').eq('key', 'sos_location_required').maybeSingle(),
        ]);
        if (contactsRes.data?.length) setCategories(contactsRes.data);
        if (settingsRes.data?.value) setLocationRequired(settingsRes.data.value !== 'false');
      } catch (e) { console.warn('SOS load:', e); }
    }
    load();
  }, []);

  const locationOk = !locationRequired || geoStatus === 'ok';
  const canSubmit = fullName.trim().length >= 3
    && phone.trim().length >= 6
    && !!category
    && locationOk
    && !submitting;

  // بناء رسالة الواتساب
  const buildMessage = (contact, code) => {
    const tpl = contact?.message_template || 'استغاثة عاجلة\nالاسم: {name}\nالهاتف: {phone}\nالموقع: {location}\nالوصف: {description}';
    const locStr = coords ? `${coords.lat.toFixed(5)},${coords.lng.toFixed(5)}\nhttps://maps.google.com/?q=${coords.lat},${coords.lng}` : 'غير محدد';
    return tpl
      .replace(/{name}/g, fullName.trim())
      .replace(/{phone}/g, phone.trim())
      .replace(/{location}/g, locStr)
      .replace(/{description}/g, description.trim() || 'بدون وصف')
      .replace(/{ref}/g, code);
  };

  const handleSubmit = async () => {
    setError('');
    if (!canSubmit) {
      if (locationRequired && geoStatus !== 'ok') { setError('يجب تحديد موقعك أولًا (GPS إلزامي)'); return; }
      if (!fullName.trim() || fullName.trim().length < 3) { setError('الاسم الثلاثي إلزامي'); return; }
      if (!phone.trim() || phone.trim().length < 6) { setError('رقم الهاتف إلزامي'); return; }
      if (!category) { setError('اختر تصنيف الطوارئ'); return; }
    }

    setSubmitting(true);
    const code = genRefCode();
    const currentContact = categories.find((c) => c.category === category);

    // حفظ يوجد قاعدة البيانات
    if (supabase) {
      const { error: insErr } = await supabase.from('sos_alerts').insert({
        ref_code: code,
        full_name: fullName.trim(),
        phone: phone.trim(),
        category,
        description: description.trim() || null,
        lat: coords?.lat ?? null,
        lng: coords?.lng ?? null,
        address_text: null,
      });
      if (insErr) {
        console.error('SOS insert error:', insErr);
        // ما نوقف — نكمل للواتساب حتى لو DB فشل
      }
    }

    setSubmitting(false);
    setRefCode(code);
    setSentContact(currentContact);

    // فتح واتساب (بعد ثانية حتى يشوف المستخدم شاشة النجاح)
    if (currentContact?.whatsapp) {
      const msg = buildMessage(currentContact, code);
      const waUrl = `https://wa.me/${currentContact.whatsapp.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(msg)}`;
      setTimeout(() => { window.location.href = waUrl; }, 800);
    }
  };

  // ═══ شاشة النجاح ═══
  if (refCode) {
    return (
      <div className="sos-page">
        <div className="sos-topbar">
          <button className="sos-back" onClick={() => router.push('/')} aria-label="رجوع">→</button>
          <span className="sos-topbar-title">S O S</span>
          <span style={{ width: 42 }} />
        </div>
        <div className="sos-success">
          <div className="sos-success-icon"><span className="chk">✓</span></div>
          <h1 className="sos-success-title">{t("sos.success")}</h1>
          <p className="sos-success-sub">
            تم استلام بلاغك بنجاح، سيتم التعامل معه يوجد أقرب وقت.
            <br />احتفظ برقم البلاغ لمتابعة الحالة.
          </p>
          <div className="sos-ref-card">
            <div className="sos-ref-label">Reference Code</div>
            <div className="sos-ref-value">{refCode}</div>
          </div>

          {sentContact && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 16 }}>
              {sentContact.whatsapp && (
                <a
                  className="sos-btn-solid"
                  href={`https://wa.me/${sentContact.whatsapp.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(buildMessage(sentContact, refCode))}`}
                  style={{ textDecoration: 'none', textAlign: 'center' }}
                >
                  💬 فتح واتساب مع {sentContact.name_ar}
                </a>
              )}
              {sentContact.phone && (
                <a
                  className="sos-btn-ghost"
                  href={`tel:${sentContact.phone}`}
                  style={{ textDecoration: 'none', textAlign: 'center' }}
                >
                  📞 اتصال مباشر ({sentContact.phone})
                </a>
              )}
            </div>
          )}

          <div className="sos-success-actions" style={{ marginTop: 16 }}>
            <button
              className="sos-btn-solid"
              onClick={() => navigator.clipboard?.writeText(refCode).then(() => alert('تم نسخ رقم البلاغ'))}
            >
              📋 نسخ رقم البلاغ
            </button>
            <button className="sos-btn-ghost" onClick={() => router.push('/')}>
              العودة للرئيسية
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ═══ النموذج ═══
  return (
    <div className="sos-page">
      <div className="sos-topbar">
        <button className="sos-back" onClick={() => router.back()} aria-label="رجوع">→</button>
        <span className="sos-topbar-title">S O S</span>
        <span style={{ width: 42 }} />
      </div>

      <div className="sos-hero">
        <div className="sos-pulse-ring">
          <div className="sos-pulse-icon">🚨</div>
        </div>
        <h1 className="sos-title">{t("sos.title")}</h1>
        <p className="sos-subtitle">سيتم إرسال بلاغك للجهات المختصة فوراً</p>
      </div>

      <div className="sos-warning">
        <span className="w-icon">⚠️</span>
        <div className="w-text">
          الإبلاغ الكاذب يعرّضك للمساءلة القانونية والغرامات. استخدم الزر فقط يوجد الحالات الحقيقية.
        </div>
      </div>

      <div className="sos-form">

        <div className="sos-field">
          <label className="sos-label">الاسم الثلاثي <span className="req">*</span></label>
          <input className="sos-input" type="text" placeholder="مثال: محمد أحمد علي" value={fullName} onChange={(e) => setFullName(e.target.value)} />
        </div>

        <div className="sos-field">
          <label className="sos-label">رقم الهاتف <span className="req">*</span></label>
          <input className="sos-input" type="tel" inputMode="tel" placeholder="09XXXXXXXX" value={phone} onChange={(e) => setPhone(e.target.value)} />
        </div>

        <div className="sos-field">
          <label className="sos-label">تصنيف الطوارئ <span className="req">*</span></label>
          <div className="sos-cats">
            {categories.map((c) => (
              <button
                key={c.category}
                type="button"
                className={`sos-cat ${category === c.category ? 'active' : ''}`}
                onClick={() => setCategory(c.category)}
                style={category === c.category && c.color ? { borderColor: c.color, background: c.color + '15' } : {}}
              >
                <span className="c-icon">{c.icon || '🚨'}</span>
                <span>{c.name_ar}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="sos-field">
          <label className="sos-label">وصف الحالة (اختياري)</label>
          <textarea className="sos-textarea" placeholder="صف ما حدث بإيجاز..." value={description} onChange={(e) => setDescription(e.target.value)} />
        </div>

        <div className="sos-field">
          <label className="sos-label">
            الموقع الجغرافي {locationRequired && <span className="req">*</span>}
          </label>
          <div className="sos-location">
            <div className="loc-icon">📍</div>
            <div className="loc-body">
              <div className="loc-label">Current Location</div>
              <div className={`loc-value ${geoStatus}`}>{geoMsg}</div>
            </div>
            {geoStatus !== 'ok' && (
              <button className="loc-btn" type="button" onClick={requestLocation}>
                {geoStatus === 'loading' ? '...' : 'تحديد'}
              </button>
            )}
          </div>
        </div>

        {error && (
          <div className="sos-warning" style={{ margin: 0 }}>
            <span className="w-icon">!</span>
            <div className="w-text">{error}</div>
          </div>
        )}

        <button className="sos-submit" type="button" onClick={handleSubmit} disabled={!canSubmit}>
          {submitting ? '... جارٍ الإرسال' : '🚨 إرسال البلاغ الآن'}
        </button>

        <div style={{ fontSize: 11, color: 'rgba(255,255,255,.5)', textAlign: 'center', marginTop: 12 }}>
          💬 سيتم فتح واتساب تلقائياً بعد الإرسال للتواصل المباشر
        </div>
      </div>
    </div>
  );
}
