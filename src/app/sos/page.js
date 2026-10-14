'use client';


import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useT } from '@/lib/useT';

const CATEGORIES = [
  { key: 'medical',  label: 'طبي',    icon: '🚑', desc: 'إسعاف / حالة صحية' },
  { key: 'security', label: 'أمني',   icon: '🚨', desc: 'سرقة / اعتداء' },
  { key: 'civil',    label: 'مدني',   icon: '🚒', desc: 'حريق / إنقاذ' },
  { key: 'service',  label: 'خدمي',   icon: '⚡', desc: 'انقطاع ماء/كهرباء' },
  { key: 'env',      label: 'بيئي',   icon: '🌿', desc: 'تلوث / نفايات' },
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
  const [geoStatus, setGeoStatus] = useState('idle'); // idle | loading | ok | err
  const [geoMsg, setGeoMsg] = useState('لم يتم تحديد الموقع بعد');
  const [submitting, setSubmitting] = useState(false);
  const [refCode, setRefCode] = useState('');
  const [error, setError] = useState('');

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
          : err.code === 2 ? 'تعذّر تحديد الموقع — جرّب في مكان مفتوح'
          : 'انتهت مدة المحاولة — أعد المحاولة'
        );
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  };

  useEffect(() => { requestLocation(); }, []);

  const canSubmit = fullName.trim().length >= 3
    && phone.trim().length >= 6
    && !!category
    && geoStatus === 'ok'
    && !submitting;

  const handleSubmit = async () => {
    setError('');
    if (!canSubmit) {
      if (geoStatus !== 'ok') { setError('يجب تحديد موقعك أولًا (GPS إلزامي)'); return; }
      if (!fullName.trim() || fullName.trim().length < 3) { setError('الاسم الثلاثي إلزامي'); return; }
      if (!phone.trim() || phone.trim().length < 6) { setError('رقم الهاتف إلزامي'); return; }
      if (!category) { setError('اختر تصنيف الطوارئ'); return; }
    }
    if (!supabase) { setError('قاعدة البيانات غير متصلة'); return; }

    setSubmitting(true);
    const code = genRefCode();
    const { error: insErr } = await supabase.from('sos_alerts').insert({
      ref_code: code,
      full_name: fullName.trim(),
      phone: phone.trim(),
      category,
      description: description.trim() || null,
      lat: coords?.lat ?? null,
      lng: coords?.lng ?? null,
      address_text: geoMsg.startsWith('تم') ? null : geoMsg,
    });
    setSubmitting(false);

    if (insErr) {
      console.error('SOS insert error:', insErr);
      setError('تعذّر إرسال البلاغ — جرّب مرة أخرى');
      return;
    }
    setRefCode(code);
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
            تم استلام بلاغك بنجاح، سيتم التعامل معه في أقرب وقت.
            <br />احتفظ برقم البلاغ لمتابعة الحالة.
          </p>
          <div className="sos-ref-card">
            <div className="sos-ref-label">Reference Code</div>
            <div className="sos-ref-value">{refCode}</div>
          </div>
          <div className="sos-success-actions">
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
        <p className="sos-subtitle">
          سيتم إرسال بلاغك للجهات المختصة فوراً
        </p>
      </div>

      <div className="sos-warning">
        <span className="w-icon">⚠️</span>
        <div className="w-text">
          الإبلاغ الكاذب يعرّضك للمساءلة القانونية والغرامات. استخدم الزر فقط في الحالات الحقيقية.
        </div>
      </div>

      <div className="sos-form">

        <div className="sos-field">
          <label className="sos-label">الاسم الثلاثي <span className="req">*</span></label>
          <input
            className="sos-input"
            type="text"
            placeholder="مثال: محمد أحمد علي"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
          />
        </div>

        <div className="sos-field">
          <label className="sos-label">رقم الهاتف <span className="req">*</span></label>
          <input
            className="sos-input"
            type="tel"
            inputMode="tel"
            placeholder="09XXXXXXXX"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
        </div>

        <div className="sos-field">
          <label className="sos-label">تصنيف الطوارئ <span className="req">*</span></label>
          <div className="sos-cats">
            {CATEGORIES.map((c) => (
              <button
                key={c.key}
                type="button"
                className={`sos-cat ${category === c.key ? 'active' : ''}`}
                onClick={() => setCategory(c.key)}
              >
                <span className="c-icon">{c.icon}</span>
                <span>{c.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="sos-field">
          <label className="sos-label">وصف الحالة (اختياري)</label>
          <textarea
            className="sos-textarea"
            placeholder="صف ما حدث بإيجاز..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        <div className="sos-field">
          <label className="sos-label">الموقع الجغرافي <span className="req">*</span></label>
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

        <button
          className="sos-submit"
          type="button"
          onClick={handleSubmit}
          disabled={!canSubmit}
        >
          {submitting ? '... جارٍ الإرسال' : '🚨 إرسال البلاغ الآن'}
        </button>
      </div>
    </div>
  );
}
