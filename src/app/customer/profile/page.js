'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/components/Toast';

export default function CustomerProfile() {
  const router = useRouter();
  const { success, error: tE } = useToast();
  const [form, setForm] = useState({ name: '', phone: '', address: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let c = null;
    try { c = JSON.parse(localStorage.getItem('sanad_customer') || 'null'); } catch {}
    if (!c) { router.replace('/login'); return; }
    setForm({ name: c.name || c.full_name || '', phone: c.phone || '', address: c.address || '' });
    setLoading(false);
  }, [router]);

  async function save() {
    if (!form.name?.trim()) { tE('الاسم مطلوب'); return; }
    setSaving(true);
    try {
      const { error } = await supabase.from('customers').update({
        name: form.name.trim(),
        address: form.address?.trim() || null,
      }).eq('phone', form.phone);
      if (error) throw error;
      const stored = JSON.parse(localStorage.getItem('sanad_customer') || '{}');
      localStorage.setItem('sanad_customer', JSON.stringify({ ...stored, name: form.name.trim(), address: form.address }));
      success('✅ تم الحفظ');
    } catch (e) { tE('تعذّر: ' + e.message); }
    setSaving(false);
  }

  if (loading) return <div style={{ padding: 60, textAlign: 'center' }}>⏳</div>;

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', paddingBottom: 40 }}>
      <div style={{ background: '#0f4d3a', padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <Link href="/customer" style={{ color: '#fff', textDecoration: 'none', fontSize: 20 }}>→</Link>
        <div style={{ flex: 1, color: '#fff', fontSize: 16, fontWeight: 900 }}>👤 ملفي الشخصي</div>
      </div>
      <div style={{ padding: 16 }}>
        <div style={{ background: '#fff', borderRadius: 16, padding: 16, border: '1px solid #e5e7eb' }}>
          <div style={{ marginBottom: 12 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 800, color: '#334155', marginBottom: 6 }}>الاسم</label>
            <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} style={{ width: '100%', padding: 12, border: '1px solid #e5e7eb', borderRadius: 10, fontSize: 14, boxSizing: 'border-box', fontFamily: 'inherit' }} />
          </div>
          <div style={{ marginBottom: 12 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 800, color: '#334155', marginBottom: 6 }}>الهاتف</label>
            <input type="tel" value={form.phone} disabled style={{ width: '100%', padding: 12, border: '1px solid #e5e7eb', borderRadius: 10, fontSize: 14, background: '#f1f5f9', color: '#64748b', boxSizing: 'border-box', fontFamily: 'inherit' }} />
          </div>
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 800, color: '#334155', marginBottom: 6 }}>العنوان</label>
            <textarea value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} rows={3} style={{ width: '100%', padding: 12, border: '1px solid #e5e7eb', borderRadius: 10, fontSize: 14, boxSizing: 'border-box', fontFamily: 'inherit', resize: 'vertical' }} />
          </div>
          <button onClick={save} disabled={saving} style={{ width: '100%', padding: 14, background: saving ? '#94a3b8' : 'linear-gradient(135deg,#10b981,#059669)', color: '#fff', border: 'none', borderRadius: 10, fontWeight: 900, cursor: saving ? 'not-allowed' : 'pointer', fontFamily: 'inherit' }}>{saving ? '...' : '✓ حفظ'}</button>
        </div>
      </div>
    </div>
  );
}
