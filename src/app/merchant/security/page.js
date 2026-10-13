'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function SecurityPage() {
  const router = useRouter();
  const [entity, setEntity] = useState(null);
  const [settings, setSettings] = useState({
    twoFactor: false,
    loginAlerts: true,
    deviceLock: false,
  });

  useEffect(() => {
    let stored = null;
    try { stored = JSON.parse(localStorage.getItem('sanad_entity') || 'null'); } catch {}
    if (!stored) { router.replace('/login'); return; }
    setEntity(stored);
    try {
      const s = JSON.parse(localStorage.getItem('sanad_sec') || 'null');
      if (s) setSettings(s);
    } catch {}
  }, [router]);

  function toggle(key) {
    const next = { ...settings, [key]: !settings[key] };
    setSettings(next);
    try { localStorage.setItem('sanad_sec', JSON.stringify(next)); } catch {}
  }

  if (!entity) return <div className="sect-empty" style={{ padding: 80 }}><span className="em">⏳</span></div>;

  return (
    <div className="sec-page">
      <div className="notif-header">
        <Link href="/merchant" className="notif-back">→</Link>
        <span className="notif-title">🔒 الأمان</span>
      </div>

      <div className="sec-card">
        <div className="sec-card-title">التحقق بخطوتين (2FA)</div>
        <div className="sec-card-desc">
          طبقة حماية إضافية عند تسجيل الدخول — تمنع أي شخص من الدخول حتى لو عرف كلمة المرور
        </div>

        <div className="sec-row">
          <div>
            <div className="sec-row-title">التحقق بخطوتين</div>
            <div className="sec-row-desc">رمز يتغير كل 30 ثانية عبر تطبيق Google Authenticator</div>
          </div>
          <button className={`sec-toggle ${settings.twoFactor ? 'on' : ''}`} onClick={() => toggle('twoFactor')} type="button" />
        </div>

        {settings.twoFactor && (
          <div className="qr-code">📱</div>
        )}

        <div className="sec-row">
          <div>
            <div className="sec-row-title">تنبيهات الدخول</div>
            <div className="sec-row-desc">إشعار عند تسجيل دخول من جهاز جديد</div>
          </div>
          <button className={`sec-toggle ${settings.loginAlerts ? 'on' : ''}`} onClick={() => toggle('loginAlerts')} type="button" />
        </div>

        <div className="sec-row">
          <div>
            <div className="sec-row-title">قفل الجهاز</div>
            <div className="sec-row-desc">ربط الحساب بالجهاز الحالي فقط</div>
          </div>
          <button className={`sec-toggle ${settings.deviceLock ? 'on' : ''}`} onClick={() => toggle('deviceLock')} type="button" />
        </div>
      </div>

      <div className="sec-card">
        <div className="sec-card-title">نشاط الحساب</div>
        <div className="sec-row">
          <div>
            <div className="sec-row-title">آخر تسجيل دخول</div>
            <div className="sec-row-desc">اليوم — من هذا الجهاز</div>
          </div>
        </div>
        <div className="sec-row">
          <div>
            <div className="sec-row-title">حالة الحساب</div>
            <div className="sec-row-desc" style={{ color: '#16a34a', fontWeight: 800 }}>✓ نشط وآمن</div>
          </div>
        </div>
      </div>
    </div>
  );
}
