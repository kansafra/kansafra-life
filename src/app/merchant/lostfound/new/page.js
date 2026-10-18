'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { useCurrentUser } from '@/lib/useCurrentUser';
import { useToast } from '@/components/Toast';
import ImageUploader from '@/components/ImageUploader';

export default function NewLostFound() {
  const router = useRouter();
  const { dataOwnerName, user } = useCurrentUser();
  const { success, error: tE } = useToast();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    title: '', description: '', item_type: 'مفقود', category: '',
    location_text: '', lost_date: new Date().toISOString().slice(0, 10),
    reporter_phone: user?.phone || '', image_url: '',
  });

  function u(k, v) { setForm(f => ({ ...f, [k]: v })); }

  async function save() {
    if (form.title.trim().length < 3) { tE('العنوان مطلوب (3 أحرف+)'); return; }
    if (!form.description.trim()) { tE('الوصف مطلوب'); return; }
    if (!form.reporter_phone.trim()) { tE('رقم التواصل مطلوب'); return; }

    setSaving(true);
    try {
      const { error } = await supabase.from('lost_found').insert({
        reporter_name: dataOwnerName,
        reporter_phone: form.reporter_phone.trim(),
        title: form.title.trim(),
        description: form.description.trim(),
        item_type: form.item_type,
        category: form.category.trim() || null,
        location_text: form.location_text.trim() || null,
        lost_date: form.lost_date || null,
        image_url: form.image_url || null,
      });
      if (error) throw error;
      success('✅ تم نشر البلاغ');
      router.push('/merchant/lostfound');
    } catch (e) { tE('تعذّر: ' + e.message); }
    setSaving(false);
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', paddingBottom: 100 }}>
      <div style={{ position: 'sticky', top: 0, zIndex: 10, background: '#dc2626', padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <Link href="/merchant/lostfound" style={{ color: '#fff', textDecoration: 'none', fontSize: 20, width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,.15)', borderRadius: '50%' }}>←</Link>
        <div style={{ color: '#fff', fontSize: 16, fontWeight: 900 }}>🔍 بلاغ جديد</div>
      </div>

      <div style={{ padding: 16 }}>
        <div style={{ background: '#fff', borderRadius: 16, padding: 16, marginBottom: 12, border: '1px solid #e5e7eb' }}>
          <div style={{ fontSize: 13, fontWeight: 900, color: '#dc2626', marginBottom: 12 }}>📋 نوع البلاغ</div>
          <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
            {['مفقود', 'وجدته'].map(t => (
              <button key={t} type="button" onClick={() => u('item_type', t)} style={{ flex: 1, padding: 14, background: form.item_type === t ? '#dc2626' : '#f8fafc', color: form.item_type === t ? '#fff' : '#64748b', border: `2px solid ${form.item_type === t ? '#dc2626' : '#e5e7eb'}`, borderRadius: 12, fontSize: 13, fontWeight: 900, cursor: 'pointer', fontFamily: 'inherit' }}>
                {t === 'مفقود' ? '🔍 فقدت شيئاً' : '✅ وجدت شيئاً'}
              </button>
            ))}
          </div>

          <label style={{ display: 'block', fontSize: 12, fontWeight: 800, color: '#334155', marginBottom: 6 }}>العنوان *</label>
          <input type="text" value={form.title} onChange={(e) => u('title', e.target.value)} placeholder="مثال: مفاتيح سوداء" style={{ width: '100%', padding: 12, border: '1px solid #e5e7eb', borderRadius: 10, fontSize: 13, marginBottom: 12, boxSizing: 'border-box', fontFamily: 'inherit', outline: 'none' }} />

          <label style={{ display: 'block', fontSize: 12, fontWeight: 800, color: '#334155', marginBottom: 6 }}>الوصف *</label>
          <textarea value={form.description} onChange={(e) => u('description', e.target.value)} rows={3} placeholder="اللون، الحجم، علامات مميزة..." style={{ width: '100%', padding: 12, border: '1px solid #e5e7eb', borderRadius: 10, fontSize: 13, marginBottom: 12, boxSizing: 'border-box', fontFamily: 'inherit', outline: 'none', resize: 'vertical' }} />

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 12 }}>
            <input type="text" value={form.category} onChange={(e) => u('category', e.target.value)} placeholder="التصنيف" style={{ padding: 12, border: '1px solid #e5e7eb', borderRadius: 10, fontSize: 13, boxSizing: 'border-box', fontFamily: 'inherit', outline: 'none' }} />
            <input type="date" value={form.lost_date} onChange={(e) => u('lost_date', e.target.value)} style={{ padding: 12, border: '1px solid #e5e7eb', borderRadius: 10, fontSize: 13, boxSizing: 'border-box', fontFamily: 'inherit', outline: 'none' }} />
          </div>

          <input type="text" value={form.location_text} onChange={(e) => u('location_text', e.target.value)} placeholder="الموقع" style={{ width: '100%', padding: 12, border: '1px solid #e5e7eb', borderRadius: 10, fontSize: 13, marginBottom: 12, boxSizing: 'border-box', fontFamily: 'inherit', outline: 'none' }} />

          <label style={{ display: 'block', fontSize: 12, fontWeight: 800, color: '#334155', marginBottom: 6 }}>رقم التواصل *</label>
          <input type="tel" value={form.reporter_phone} onChange={(e) => u('reporter_phone', e.target.value)} placeholder="09XXXXXXXX" style={{ width: '100%', padding: 12, border: '1px solid #e5e7eb', borderRadius: 10, fontSize: 13, boxSizing: 'border-box', fontFamily: 'inherit', outline: 'none', direction: 'ltr', textAlign: 'right' }} />
        </div>

        <div style={{ background: '#fff', borderRadius: 16, padding: 16, border: '1px solid #e5e7eb' }}>
          <ImageUploader label="📸 صورة (اختياري)" folder="lostfound" value={form.image_url} onUpload={(url) => u('image_url', url)} />
        </div>
      </div>

      <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, padding: 12, background: '#fff', borderTop: '1px solid #e5e7eb' }}>
        <button onClick={save} disabled={saving} style={{ width: '100%', padding: 16, background: saving ? '#94a3b8' : 'linear-gradient(135deg,#dc2626,#991b1b)', color: '#fff', border: 'none', borderRadius: 12, fontSize: 15, fontWeight: 900, cursor: saving ? 'not-allowed' : 'pointer', fontFamily: 'inherit' }}>
          {saving ? '... جارٍ النشر' : '✓ نشر البلاغ'}
        </button>
      </div>
    </div>
  );
}
