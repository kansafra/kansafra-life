'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/components/Toast';

export default function AdminSettings() {
  const router = useRouter();
  const { success, error: tE } = useToast();
  const [settings, setSettings] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [tab, setTab] = useState('general');

  useEffect(() => {
    let stored = null;
    try { stored = JSON.parse(localStorage.getItem('sanad_admin') || 'null'); } catch {}
    if (!stored) { router.replace('/admin/login'); return; }
    load();
  }, [router]);

  async function load() {
    if (!supabase) { setLoading(false); return; }
    const { data } = await supabase.from('app_settings').select('*');
    const obj = {};
    (data || []).forEach(s => { obj[s.key] = s.value; });
    setSettings(obj);
    setLoading(false);
  }

  function update(k, v) {
    setSettings(s => ({ ...s, [k]: v }));
  }

  async function saveAll() {
    setSaving(true);
    try {
      const entries = Object.entries(settings);
      for (const [key, value] of entries) {
        const { data: existing } = await supabase.from('app_settings').select('key').eq('key', key).maybeSingle();
        if (existing) {
          await supabase.from('app_settings').update({ value: String(value ?? '') }).eq('key', key);
        } else {
          await supabase.from('app_settings').insert({ key, value: String(value ?? '') });
        }
      }
      success('✅ تم حفظ الإعدادات');
    } catch (e) { tE('تعذّر: ' + e.message); }
    setSaving(false);
  }

  if (loading) return <div style={{ padding: 60, textAlign: 'center' }}>⏳</div>;

  const Toggle = ({ k, label, desc }) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 14, background: '#f8fafc', borderRadius: 10, marginBottom: 8 }}>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 13, fontWeight: 800, color: '#0f172a' }}>{label}</div>
        {desc && <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>{desc}</div>}
      </div>
      <button onClick={() => update(k, settings[k] === 'true' ? 'false' : 'true')} style={{
        width: 48, height: 28, borderRadius: 14, border: 'none',
        background: settings[k] === 'true' ? 'linear-gradient(135deg,#10b981,#059669)' : '#cbd5e1',
        position: 'relative', cursor: 'pointer', transition: 'background .2s',
      }}>
        <div style={{
          position: 'absolute', top: 3, left: settings[k] === 'true' ? 23 : 3,
          width: 22, height: 22, borderRadius: '50%', background: '#fff',
          transition: 'left .2s', boxShadow: '0 1px 4px rgba(0,0,0,.2)',
        }} />
      </button>
    </div>
  );

  const Field = ({ k, label, placeholder, type = 'text', desc }) => (
    <div style={{ marginBottom: 12 }}>
      <label style={{ display: 'block', fontSize: 12, fontWeight: 800, color: '#334155', marginBottom: 6 }}>{label}</label>
      <input type={type} value={settings[k] || ''} onChange={(e) => update(k, e.target.value)} placeholder={placeholder}
        style={{ width: '100%', padding: 12, border: '1px solid #e5e7eb', borderRadius: 10, fontSize: 13, fontFamily: 'inherit', boxSizing: 'border-box', outline: 'none' }} />
      {desc && <div style={{ fontSize: 10.5, color: '#64748b', marginTop: 4 }}>{desc}</div>}
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', paddingBottom: 100 }}>
      <div style={{ position: 'sticky', top: 0, zIndex: 10, background: '#0f4d3a', padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <Link href="/admin" style={{ color: '#fff', textDecoration: 'none', fontSize: 20, width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,.1)', borderRadius: '50%' }}>→</Link>
        <div style={{ flex: 1, color: '#fff', fontSize: 16, fontWeight: 900 }}>⚙️ إعدادات المنصة</div>
      </div>

      <div style={{ padding: 16 }}>
        <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 8, marginBottom: 12 }}>
          {[['general','🏢 عام'],['moderation','🛡️ المراجعة'],['contact','📞 تواصل'],['features','🔧 ميزات']].map(([k,l]) => (
            <button key={k} onClick={() => setTab(k)} style={{
              padding: '8px 14px', background: tab === k ? '#0f4d3a' : '#fff',
              color: tab === k ? '#fff' : '#64748b',
              border: `1px solid ${tab === k ? '#0f4d3a' : '#e5e7eb'}`,
              borderRadius: 10, fontSize: 11.5, fontWeight: 800, cursor: 'pointer', whiteSpace: 'nowrap', fontFamily: 'inherit',
            }}>{l}</button>
          ))}
        </div>

        {tab === 'general' && (
          <div style={{ background: '#fff', borderRadius: 14, padding: 16, marginBottom: 12, border: '1px solid #e5e7eb' }}>
            <div style={{ fontSize: 14, fontWeight: 900, marginBottom: 14 }}>🏢 معلومات المنصة</div>
            <Field k="site_name" label="اسم المنصة" placeholder="سند" />
            <Field k="site_tagline" label="الشعار" placeholder="كل خدمات مجتمعك بين يديك" />
            <Field k="site_description" label="الوصف" placeholder="منصة سند تجمع الخدمات..." />
            <Field k="site_location" label="الموقع" placeholder="كنصفرة · إدلب · سوريا" />
          </div>
        )}

        {tab === 'moderation' && (
          <div style={{ background: '#fff', borderRadius: 14, padding: 16, marginBottom: 12, border: '1px solid #e5e7eb' }}>
            <div style={{ fontSize: 14, fontWeight: 900, marginBottom: 14 }}>🛡️ إعدادات المراجعة</div>
            <Toggle k="moderation_enabled" label="تفعيل نظام المراجعة" desc="عند التعطيل، كل المحتوى يُنشر مباشرة" />
            <Toggle k="auto_publish_all" label="نشر تلقائي لكل المحتوى" desc="تجاوز المراجعة لكل الأنواع" />
            <Toggle k="auto_publish_products" label="نشر تلقائي للمنتجات" desc="المنتجات تُنشر بدون مراجعة" />
            <Toggle k="auto_publish_services" label="نشر تلقائي للخدمات" desc="الخدمات تُنشر بدون مراجعة" />
          </div>
        )}

        {tab === 'contact' && (
          <div style={{ background: '#fff', borderRadius: 14, padding: 16, marginBottom: 12, border: '1px solid #e5e7eb' }}>
            <div style={{ fontSize: 14, fontWeight: 900, marginBottom: 14 }}>📞 معلومات التواصل</div>
            <Field k="admin_whatsapp" label="واتساب الأدمن" placeholder="963930694339" desc="يُستخدم لاستقبال طلبات التجديد" />
            <Field k="admin_phone" label="هاتف الأدمن" placeholder="09XXXXXXXX" />
            <Field k="admin_email" label="بريد الأدمن" placeholder="admin@sanad.app" type="email" />
            <Field k="support_phone" label="هاتف الدعم" placeholder="09XXXXXXXX" />
          </div>
        )}

        {tab === 'features' && (
          <div style={{ background: '#fff', borderRadius: 14, padding: 16, marginBottom: 12, border: '1px solid #e5e7eb' }}>
            <div style={{ fontSize: 14, fontWeight: 900, marginBottom: 14 }}>🔧 الميزات العامة</div>
            <Toggle k="sos_open_whatsapp" label="SOS: فتح واتساب تلقائياً" desc="فتح واتساب عند إرسال بلاغ طوارئ" />
            <Toggle k="sos_send_via_whatsapp" label="SOS: إرسال عبر واتساب" />
            <Toggle k="subscriptions_enabled" label="تفعيل نظام الاشتراكات" desc="عند التعطيل، كل المزودين مجانيون" />
            <Toggle k="reviews_enabled" label="تفعيل التقييمات" />
            <Toggle k="push_notifications" label="تفعيل الإشعارات Push" />
          </div>
        )}
      </div>

      <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, padding: 16, background: '#fff', borderTop: '1px solid #e5e7eb', boxShadow: '0 -4px 12px rgba(0,0,0,.05)' }}>
        <button onClick={saveAll} disabled={saving} style={{
          width: '100%', padding: 16, background: saving ? '#94a3b8' : 'linear-gradient(135deg,#10b981,#059669)',
          color: '#fff', border: 'none', borderRadius: 12, fontSize: 15, fontWeight: 900,
          cursor: saving ? 'not-allowed' : 'pointer', fontFamily: 'inherit',
        }}>
          {saving ? '... جارٍ الحفظ' : '✓ حفظ كل الإعدادات'}
        </button>
      </div>
    </div>
  );
}
