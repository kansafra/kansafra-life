'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useToast } from '@/components/Toast';

const TARGETS = [
  { key: 'all', label: '📢 الجميع' },
  { key: 'customer', label: '👤 العملاء' },
  { key: 'merchant', label: '🏪 التجار' },
  { key: 'doctor', label: '🩺 الأطباء' },
];

export default function AdminNotificationsPage() {
  const router = useRouter();
  const { success, error: tE } = useToast();
  const [form, setForm] = useState({ title: '', message: '', url: '/', target_type: 'all', target_id: '' });
  const [sending, setSending] = useState(false);
  const [history, setHistory] = useState([]);

  useEffect(() => {
    let stored = null;
    try { stored = JSON.parse(localStorage.getItem('sanad_admin') || 'null'); } catch {}
    if (!stored) router.replace('/admin/login');
  }, [router]);

  async function send() {
    if (!form.title.trim()) { tE('العنوان مطلوب'); return; }
    if (!form.message.trim()) { tE('الرسالة مطلوبة'); return; }

    setSending(true);
    try {
      const res = await fetch('/api/push/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          target_type: form.target_type === 'all' ? null : form.target_type,
          target_id: form.target_id || null,
          title: form.title.trim(),
          message: form.message.trim(),
          url: form.url || '/',
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'فشل الإرسال');

      success(`✅ تم الإرسال إلى ${data.sent} جهاز`);
      setHistory(prev => [{ ...form, sent: data.sent, at: new Date() }, ...prev].slice(0, 10));
      setForm({ ...form, title: '', message: '' });
    } catch (e) { tE(e.message); }
    setSending(false);
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', paddingBottom: 40 }}>
      <div style={{ background: 'linear-gradient(135deg,#dc2626,#991b1b)', padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <Link href="/admin" style={{ color: '#fff', textDecoration: 'none', fontSize: 20, width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,.15)', borderRadius: '50%' }}>→</Link>
        <div style={{ flex: 1, color: '#fff', fontSize: 16, fontWeight: 900 }}>🔔 إرسال إشعار</div>
      </div>

      <div style={{ padding: 16 }}>
        <div style={{ background: '#fff', borderRadius: 16, padding: 16, border: '1px solid #e5e7eb', marginBottom: 12 }}>
          <div style={{ fontSize: 13, fontWeight: 900, marginBottom: 12 }}>🎯 الفئة المستهدفة</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 6, marginBottom: 14 }}>
            {TARGETS.map(t => (
              <button key={t.key} onClick={() => setForm({ ...form, target_type: t.key })} style={{ padding: 12, background: form.target_type === t.key ? '#dc2626' : '#f8fafc', color: form.target_type === t.key ? '#fff' : '#64748b', border: `1px solid ${form.target_type === t.key ? '#dc2626' : '#e5e7eb'}`, borderRadius: 10, fontSize: 12, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit' }}>{t.label}</button>
            ))}
          </div>

          <label style={{ display: 'block', fontSize: 12, fontWeight: 800, color: '#334155', marginBottom: 6 }}>العنوان *</label>
          <input type="text" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="مثال: عرض جديد" style={{ width: '100%', padding: 12, border: '1px solid #e5e7eb', borderRadius: 10, fontSize: 13, marginBottom: 12, boxSizing: 'border-box', fontFamily: 'inherit', outline: 'none' }} />

          <label style={{ display: 'block', fontSize: 12, fontWeight: 800, color: '#334155', marginBottom: 6 }}>الرسالة *</label>
          <textarea value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} rows={3} placeholder="اكتب نص الإشعار..." style={{ width: '100%', padding: 12, border: '1px solid #e5e7eb', borderRadius: 10, fontSize: 13, marginBottom: 12, boxSizing: 'border-box', fontFamily: 'inherit', outline: 'none', resize: 'vertical' }} />

          <label style={{ display: 'block', fontSize: 12, fontWeight: 800, color: '#334155', marginBottom: 6 }}>الرابط عند الفتح</label>
          <input type="text" value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} placeholder="/" style={{ width: '100%', padding: 12, border: '1px solid #e5e7eb', borderRadius: 10, fontSize: 13, marginBottom: 16, boxSizing: 'border-box', fontFamily: 'inherit', outline: 'none', direction: 'ltr', textAlign: 'right' }} />

          <button onClick={send} disabled={sending} style={{ width: '100%', padding: 14, background: sending ? '#94a3b8' : 'linear-gradient(135deg,#dc2626,#991b1b)', color: '#fff', border: 'none', borderRadius: 10, fontSize: 15, fontWeight: 900, cursor: sending ? 'not-allowed' : 'pointer', fontFamily: 'inherit' }}>{sending ? '... جارٍ الإرسال' : '🚀 إرسال الإشعار'}</button>
        </div>

        {history.length > 0 && (
          <div style={{ background: '#fff', borderRadius: 16, padding: 16, border: '1px solid #e5e7eb' }}>
            <div style={{ fontSize: 13, fontWeight: 900, marginBottom: 12 }}>📜 آخر الإشعارات</div>
            {history.map((h, i) => (
              <div key={i} style={{ padding: '10px 0', borderBottom: i < history.length - 1 ? '1px solid #f1f5f9' : 'none' }}>
                <div style={{ fontSize: 13, fontWeight: 900 }}>{h.title}</div>
                <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>{h.message}</div>
                <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 4 }}>✅ {h.sent} جهاز · {h.at.toLocaleString('ar-EG')}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
