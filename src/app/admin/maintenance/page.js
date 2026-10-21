'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/components/Toast';

export default function AdminMaintenancePage() {
  const router = useRouter();
  const { success, error: toastError } = useToast();
  const [enabled, setEnabled] = useState(false);
  const [message, setMessage] = useState('الموقع قيد الصيانة، سنعود قريباً.');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const admin = JSON.parse(localStorage.getItem('sanad_admin') || 'null');
    if (!admin) { router.replace('/admin/login'); return; }
    loadSettings();
  }, [router]);

  async function loadSettings() {
    if (!supabase) return;
    setLoading(true);
    try {
      const { data } = await supabase.from('app_settings').select('*').eq('key', 'maintenance_mode').maybeSingle();
      const { data: msg } = await supabase.from('app_settings').select('*').eq('key', 'maintenance_message').maybeSingle();
      if (data) setEnabled(data.value === 'true');
      if (msg) setMessage(msg.value || 'الموقع قيد الصيانة...');
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }

  async function saveSettings() {
    setSaving(true);
    try {
      const updates = [
        { key: 'maintenance_mode', value: String(enabled), category: 'general' },
        { key: 'maintenance_message', value: message, category: 'general' },
      ];
      const { error } = await supabase.from('app_settings').upsert(updates, { onConflict: 'key' });
      if (error) throw error;
      success('✅ تم الحفظ');
    } catch (err) { toastError('فشل الحفظ'); }
    finally { setSaving(false); }
  }

  if (loading) return <div style={{ padding: 80, textAlign: 'center' }}>⏳</div>;

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', paddingBottom: 40 }}>
      <div style={{ background: '#0f172a', padding: '16px 20px', position: 'sticky', top: 0, zIndex: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Link href="/admin" style={{ color: '#fff', textDecoration: 'none', fontSize: 20 }}>←</Link>
          <h1 style={{ color: '#fff', fontSize: 18, fontWeight: 900, margin: 0, flex: 1 }}>🔧 وضع الصيانة</h1>
        </div>
      </div>
      <div style={{ padding: 16, maxWidth: 600, margin: '0 auto' }}>
        <div style={{ background: enabled ? 'rgba(239,68,68,0.08)' : '#fff', borderRadius: 16, padding: 24, border: enabled ? '2px solid #ef4444' : '1px solid #e2e8f0', textAlign: 'center' }}>
          <div style={{ fontSize: 60, marginBottom: 12 }}>{enabled ? '🚫' : '✅'}</div>
          <h2 style={{ fontSize: 20, fontWeight: 900, color: enabled ? '#ef4444' : '#10b981', marginBottom: 8 }}>
            {enabled ? 'المنصة في وضع الصيانة' : 'المنصة تعمل بشكل طبيعي'}
          </h2>
          <p style={{ fontSize: 13, color: '#64748b', marginBottom: 20 }}>
            {enabled ? 'الزوار يرون صفحة الصيانة فقط. الأدمن والتجار يستطيعون الدخول.' : 'جميع المستخدمين يستطيعون الوصول للمنصة.'}
          </p>
          <button onClick={() => setEnabled(!enabled)} style={{ padding: '14px 32px', background: enabled ? '#10b981' : '#ef4444', color: '#fff', border: 'none', borderRadius: 12, fontSize: 15, fontWeight: 900, cursor: 'pointer', fontFamily: 'inherit' }}>
            {enabled ? '✅ إيقاف الصيانة' : '🔧 تفعيل الصيانة'}
          </button>
        </div>

        {enabled && (
          <div style={{ background: '#fff', borderRadius: 16, padding: 20, marginTop: 16, border: '1px solid #e2e8f0' }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 800, color: '#475569', marginBottom: 8 }}>رسالة الصيانة للزوار</label>
            <textarea value={message} onChange={e => setMessage(e.target.value)} style={{ width: '100%', padding: 12, borderRadius: 10, border: '1px solid #cbd5e1', fontSize: 14, fontFamily: 'inherit', height: 80, resize: 'none', boxSizing: 'border-box', outline: 'none', background: '#f8fafc' }} />
          </div>
        )}

        <button onClick={saveSettings} disabled={saving} style={{ width: '100%', padding: 16, marginTop: 16, background: saving ? '#94a3b8' : '#0f4d3a', color: '#fff', border: 'none', borderRadius: 12, fontSize: 15, fontWeight: 900, cursor: saving ? 'wait' : 'pointer', fontFamily: 'inherit' }}>
          {saving ? '⏳ جارٍ الحفظ...' : '💾 حفظ الإعدادات'}
        </button>
      </div>
    </div>
  );
}
