'use client';

// Safe date for hydration
const __safeDate = (d) => (typeof window !== 'undefined' ? __safeDate(d) : __safeDate(0));

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function AdminSettings() {
  const router = useRouter();
  const [admin, setAdmin] = useState(null);
  const [settings, setSettings] = useState({
    notifications: true,
    autoApprove: false,
    maintenance: false,
    sosAlerts: true,
    reviewsApproval: true,
    arabicOnly: true,
  });

  useEffect(() => {
    let stored = null;
    try { stored = JSON.parse(localStorage.getItem('sanad_admin') || 'null'); } catch {}
    if (!stored) { router.replace('/admin/login'); return; }
    setAdmin(stored);
    try {
      const s = JSON.parse(localStorage.getItem('sanad_settings') || 'null');
      if (s) setSettings(s);
    } catch {}
  }, [router]);

  function toggle(key) {
    const next = { ...settings, [key]: !settings[key] };
    setSettings(next);
    try { localStorage.setItem('sanad_settings', JSON.stringify(next)); } catch {}
  }

  if (!admin) return <div className="admin-page"><div style={{ padding: 80, textAlign: 'center' }}>...</div></div>;

  const OPTIONS = [
    { key: 'notifications', title: 'الإشعارات', desc: 'استقبال إشعارات النظام والبلاغات' },
    { key: 'sosAlerts', title: 'تنبيهات SOS', desc: 'تنبيه فوري عند وصول بلاغ طوارئ' },
    { key: 'reviewsApproval', title: 'موافقة التقييمات', desc: 'مراجعة التقييمات قبل نشرها' },
    { key: 'autoApprove', title: 'موافقة تلقائية على الكيانات', desc: 'قبول الكيانات الجديدة تلقائياً' },
    { key: 'arabicOnly', title: 'عربي فقط', desc: 'عرض الواجهات بالعربية فقط حالياً' },
    { key: 'maintenance', title: 'وضع الصيانة', desc: 'إيقاف الموقع مؤقتاً أمام الزوار' },
  ];

  return (
    <div className="admin-page">
      <div className="admin-sub-header">
        <Link href="/admin" className="admin-sub-back">→</Link>
        <span className="admin-sub-title">الإعدادات</span>
      </div>

      <div className="admin-stats" style={{ marginTop: 20 }}>
        <div className="admin-stat">
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,.4)', marginBottom: 4, fontWeight: 700 }}>المدير</div>
          <div style={{ fontSize: 15, fontWeight: 900, color: '#fff' }}>{admin.full_name}</div>
        </div>
        <div className="admin-stat">
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,.4)', marginBottom: 4, fontWeight: 700 }}>الصلاحية</div>
          <div style={{ fontSize: 15, fontWeight: 900, color: '#e8b923' }}>{admin.role}</div>
        </div>
      </div>

      <div style={{ padding: '0 20px 20px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        <h3 style={{ fontSize: 13, fontWeight: 900, color: 'rgba(255,255,255,.6)', marginBottom: 4, letterSpacing: 1 }}>تفضيلات النظام</h3>
        {OPTIONS.map((o) => (
          <div key={o.key} className="admin-setting-row">
            <div className="admin-setting-info">
              <div className="admin-setting-title">{o.title}</div>
              <div className="admin-setting-desc">{o.desc}</div>
            </div>
            <button
              className={`admin-toggle ${settings[o.key] ? 'on' : ''}`}
              onClick={() => toggle(o.key)}
              type="button"
              aria-label={o.title}
            />
          </div>
        ))}
      </div>

      <div style={{ padding: '0 20px 40px' }}>
        <Link href="/admin" style={{
          display: 'block',
          textAlign: 'center',
          padding: 16,
          borderRadius: 14,
          background: 'rgba(232,185,35,.1)',
          border: '1px solid rgba(232,185,35,.25)',
          color: '#e8b923',
          fontWeight: 800,
          fontSize: 14,
          textDecoration: 'none',
        }}>
          ← العودة للوحة الرئيسية
        </Link>
      </div>
    </div>
  );
}
