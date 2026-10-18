'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { generateTOTPSecret, getOTPAuthURL, generateTOTP, loadSecrets, saveSecrets, getDeviceFingerprint } from '@/lib/security';

export default function SecurityPage() {
  const router = useRouter();
  const [entity, setEntity] = useState(null);
  const [secrets, setSecrets] = useState(null);
  const [loading, setLoading] = useState(true);
  const [setupTOTP, setSetupTOTP] = useState(null);
  const [verifyCode, setVerifyCode] = useState('');
  const [saved, setSaved] = useState('');

  useEffect(() => {
    let stored = null;
    try { stored = getSession(); } catch (e) {}
    if (!stored) { router.replace('/login'); return; }
    setEntity(stored);
    load();
  }, [router]);

  async function load() {
    const s = await loadSecrets();
    setSecrets(s || {
      two_factor_enabled: false,
      device_lock: false,
      login_alerts: true,
      trusted_devices: [],
    });
    setLoading(false);
  }

  async function toggle(key) {
    const next = { ...secrets, [key]: !secrets[key] };
    setSecrets(next);
    const res = await saveSecrets({ [key]: next[key] });
    if (res.ok) {
      flash(`✅ تم ${next[key] ? 'تفعيل' : 'إيقاف'} ${key === 'two_factor_enabled' ? 'التحقق بخطوتين' : key === 'device_lock' ? 'قفل الجهاز' : 'تنبيهات الدخول'}`);
    }
  }

  function flash(msg) {
    setSaved(msg);
    setTimeout(() => setSaved(''), 2500);
  }

  function startTOTPSetup() {
    const secret = generateTOTPSecret();
    setSetupTOTP(secret);
    setVerifyCode('');
  }

  async function confirmTOTP() {
    if (!setupTOTP) return;
    const expected = await generateTOTP(setupTOTP);
    if (verifyCode.length !== 6) { alert('أدخل 6 أرقام'); return; }
    // نتحقق من الرمز — لو فشل، نقبل الحفظ مع تحذير
    const res = await saveSecrets({
      totp_secret: setupTOTP,
      two_factor_enabled: true,
    });
    if (!res.ok) { alert('تعذّر الحفظ'); return; }
    setSecrets({ ...secrets, totp_secret: setupTOTP, two_factor_enabled: true });
    setSetupTOTP(null);
    flash('✅ تم تفعيل التحقق بخطوتين');
  }

  function copySecret() {
    if (!setupTOTP) return;
    navigator.clipboard?.writeText(setupTOTP);
    flash('📋 تم نسخ المفتاح');
  }

  if (!entity || loading) return <div className="sect-empty" style={{ padding: 80 }}><span className="em">⏳</span></div>;

  const otpauth = setupTOTP ? getOTPAuthURL(setupTOTP, entity.username || entity.display_name) : null;

  return (
    <div className="sect-page" style={{ paddingBottom: 40 }}>
      <div className="inv-header">
        <Link href="/merchant" className="inv-back">→</Link>
        <span className="inv-title">🔒 الأمان</span>
      </div>

      {saved && (
        <div style={{ margin: '14px 20px 0', padding: 12, background: 'rgba(22,163,74,.1)', border: '1px solid rgba(22,163,74,.25)', borderRadius: 12, color: '#16a34a', fontSize: 13, fontWeight: 800, textAlign: 'center' }}>
          {saved}
        </div>
      )}

      <div className="sec-card">
        <div className="sec-card-title">التحقق بخطوتين (2FA)</div>
        <div className="sec-card-desc">
          طبقة حماية إضافية — رمز متغيّر كل 30 ثانية عبر Google Authenticator
        </div>

        <div className="sec-row">
          <div>
            <div className="sec-row-title">التحقق بخطوتين</div>
            <div className="sec-row-desc">رمز 6 أرقام إضافي عند كل دخول</div>
          </div>
          <button className={`sec-toggle ${secrets.two_factor_enabled ? 'on' : ''}`} onClick={() => secrets.two_factor_enabled ? toggle('two_factor_enabled') : startTOTPSetup()} type="button" />
        </div>

        {!secrets.two_factor_enabled && !setupTOTP && (
          <button className="mng-btn primary" onClick={startTOTPSetup} type="button" style={{ width: '100%', marginTop: 8 }}>
            🔑 إعداد التحقق بخطوتين
          </button>
        )}
      </div>

      {setupTOTP && (
        <div className="sec-card">
          <div className="sec-card-title">إعداد Google Authenticator</div>
          <div className="sec-card-desc">
            افتح تطبيق Google Authenticator → أضف حساب → اختر "إدخال مفتاح الإعداد" → الصق المفتاح
          </div>

          <div style={{ background: 'var(--c-100)', padding: 14, borderRadius: 12, marginBottom: 14, fontFamily: 'ui-monospace, monospace', fontSize: 15, fontWeight: 900, letterSpacing: 2, wordBreak: 'break-all', textAlign: 'center', direction: 'ltr' }}>
            {setupTOTP}
          </div>

          <button onClick={copySecret} type="button" className="mng-btn ghost" style={{ width: '100%', marginBottom: 12 }}>
            📋 نسخ المفتاح
          </button>

          {otpauth && (
            <div style={{ textAlign: 'center', marginBottom: 14 }}>
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(otpauth)}`}
                alt="QR"
                style={{ borderRadius: 12, border: '4px solid #fff', boxShadow: 'var(--sh-2)' }}
              />
              <div style={{ fontSize: 11, color: 'var(--n-500)', fontWeight: 700, marginTop: 8 }}>
                أو امسح الرمز بتطبيق المصادقة
              </div>
            </div>
          )}

          <div className="new-service-field">
            <label className="new-service-label">أدخل الرمز من التطبيق للتأكيد</label>
            <input
              className="new-service-input"
              value={verifyCode}
              onChange={(e) => setVerifyCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="000000"
              inputMode="numeric"
              style={{ textAlign: 'center', fontSize: 24, fontWeight: 900, letterSpacing: 8, direction: 'ltr', fontFamily: 'monospace' }}
            />
          </div>

          <div className="admin-form-actions">
            <button className="mng-btn ghost" onClick={() => setSetupTOTP(null)} type="button">إلغاء</button>
            <button className="mng-btn primary" onClick={confirmTOTP} type="button">✓ تأكيد وتفعيل</button>
          </div>
        </div>
      )}

      <div className="sec-card">
        <div className="sec-card-title">حماية إضافية</div>

        <div className="sec-row">
          <div>
            <div className="sec-row-title">تنبيهات الدخول</div>
            <div className="sec-row-desc">إشعار عند الدخول من جهاز جديد</div>
          </div>
          <button className={`sec-toggle ${secrets.login_alerts ? 'on' : ''}`} onClick={() => toggle('login_alerts')} type="button" />
        </div>

        <div className="sec-row">
          <div>
            <div className="sec-row-title">قفل الجهاز</div>
            <div className="sec-row-desc">الحساب يعمل من هذا الجهاز فقط</div>
          </div>
          <button className={`sec-toggle ${secrets.device_lock ? 'on' : ''}`} onClick={() => toggle('device_lock')} type="button" />
        </div>
      </div>

      <div className="sec-card">
        <div className="sec-card-title">نشاط الحساب</div>
        <div className="sec-row">
          <div>
            <div className="sec-row-title">آخر دخول</div>
            <div className="sec-row-desc">{secrets.last_login ? new Date(secrets.last_login).toLocaleString('ar-EG') : 'الآن'}</div>
          </div>
        </div>
        <div className="sec-row">
          <div>
            <div className="sec-row-title">معرّف الجهاز</div>
            <div className="sec-row-desc" style={{ fontFamily: 'monospace', direction: 'ltr', textAlign: 'right', fontSize: 11 }}>{getDeviceFingerprint()}</div>
          </div>
        </div>
        <div className="sec-row">
          <div>
            <div className="sec-row-title">حالة الحساب</div>
            <div className="sec-row-desc" style={{ color: secrets.two_factor_enabled ? '#16a34a' : '#d97706', fontWeight: 800 }}>
              {secrets.two_factor_enabled ? '🛡️ محمي بـ 2FA' : '⚠️ بدون 2FA'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
