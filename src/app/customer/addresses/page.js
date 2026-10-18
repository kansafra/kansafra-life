'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/components/Toast';
import EmptyState from '@/components/EmptyState';

export default function CustomerAddresses() {
  const router = useRouter();
  const { success, error: tE } = useToast();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ label: 'المنزل', address: '', city: '', is_default: false });
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [customerPhone, setCustomerPhone] = useState('');

  useEffect(() => {
    let c = null;
    try { c = JSON.parse(localStorage.getItem('sanad_customer') || 'null'); } catch {}
    if (!c) { router.replace('/login'); return; }
    setCustomerPhone(c.phone);
    load(c.phone);
  }, [router]);

  async function load(phone) {
    if (!supabase) { setLoading(false); return; }
    const { data } = await supabase.from('customer_addresses').select('*').eq('customer_phone', phone).order('created_at', { ascending: false });
    setItems(data || []);
    setLoading(false);
  }

  function openAdd() { setEditing(null); setForm({ label: 'المنزل', address: '', city: '', is_default: false }); setModal(true); }
  function openEdit(a) { setEditing(a); setForm({ ...a }); setModal(true); }

  async function save() {
    if (!form.address?.trim()) { tE('العنوان مطلوب'); return; }
    setSaving(true);
    try {
      const payload = { customer_phone: customerPhone, label: form.label || 'المنزل', address: form.address.trim(), city: form.city?.trim() || null, is_default: form.is_default === true };
      let err;
      if (editing) ({ error: err } = await supabase.from('customer_addresses').update(payload).eq('id', editing.id));
      else ({ error: err } = await supabase.from('customer_addresses').insert(payload));
      if (err) throw err;
      if (form.is_default) {
        await supabase.from('customer_addresses').update({ is_default: false }).eq('customer_phone', customerPhone).neq('id', editing?.id || '');
        await supabase.from('customer_addresses').update({ is_default: true }).eq('customer_phone', customerPhone).eq('address', form.address.trim());
      }
      success('✅ تم الحفظ'); setModal(false); load(customerPhone);
    } catch (e) { tE('تعذّر: ' + e.message); }
    setSaving(false);
  }

  async function del(a) {
    if (!confirm('حذف العنوان؟')) return;
    await supabase.from('customer_addresses').delete().eq('id', a.id);
    success('✅ تم'); load(customerPhone);
  }

  if (loading) return <div style={{ padding: 60, textAlign: 'center' }}>⏳</div>;

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', paddingBottom: 40 }}>
      <div style={{ background: '#0f4d3a', padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <Link href="/customer" style={{ color: '#fff', textDecoration: 'none', fontSize: 20 }}>→</Link>
        <div style={{ flex: 1, color: '#fff', fontSize: 16, fontWeight: 900 }}>📍 العناوين ({items.length})</div>
        <button onClick={openAdd} style={{ background: '#fbbf24', color: '#0f4d3a', border: 'none', padding: '8px 14px', borderRadius: 10, fontSize: 12, fontWeight: 900, cursor: 'pointer', fontFamily: 'inherit' }}>+ عنوان</button>
      </div>
      <div style={{ padding: 16 }}>
        {items.length === 0 ? <EmptyState icon="📍" title="لا توجد عناوين" description="أضف عنواناً للتوصيل" actionLabel="+ إضافة" onAction={openAdd} /> : items.map(a => (
          <div key={a.id} style={{ background: '#fff', borderRadius: 14, padding: 14, marginBottom: 10, border: `1px solid ${a.is_default ? '#10b981' : '#e5e7eb'}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 900 }}>{a.label}</div>
                <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>{a.address}</div>
                {a.city && <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>{a.city}</div>}
              </div>
              {a.is_default && <span style={{ background: 'rgba(16,185,129,.15)', color: '#10b981', padding: '3px 8px', borderRadius: 6, fontSize: 9.5, fontWeight: 900 }}>افتراضي</span>}
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              <button onClick={() => openEdit(a)} style={{ flex: 1, padding: 8, background: '#f1f5f9', border: 'none', borderRadius: 8, fontSize: 11, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit' }}>✏️</button>
              <button onClick={() => del(a)} style={{ padding: 8, background: 'rgba(220,38,38,.1)', color: '#dc2626', border: 'none', borderRadius: 8, fontSize: 11, cursor: 'pointer', fontFamily: 'inherit' }}>🗑️</button>
            </div>
          </div>
        ))}
      </div>
      {modal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.6)', zIndex: 100, display: 'flex', alignItems: 'flex-end' }} onClick={() => setModal(false)}>
          <div style={{ background: '#fff', borderRadius: '24px 24px 0 0', width: '100%', maxWidth: 500, margin: '0 auto', padding: '24px 20px 30px' }} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ fontSize: 18, fontWeight: 900, marginBottom: 16 }}>{editing ? 'تعديل عنوان' : 'عنوان جديد'}</h3>
            <input type="text" placeholder="التسمية (المنزل، العمل...)" value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })} style={{ width: '100%', padding: 12, border: '1px solid #e5e7eb', borderRadius: 10, fontSize: 13, marginBottom: 10, boxSizing: 'border-box', fontFamily: 'inherit' }} />
            <input type="text" placeholder="العنوان *" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} style={{ width: '100%', padding: 12, border: '1px solid #e5e7eb', borderRadius: 10, fontSize: 13, marginBottom: 10, boxSizing: 'border-box', fontFamily: 'inherit' }} />
            <input type="text" placeholder="المدينة" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} style={{ width: '100%', padding: 12, border: '1px solid #e5e7eb', borderRadius: 10, fontSize: 13, marginBottom: 10, boxSizing: 'border-box', fontFamily: 'inherit' }} />
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, padding: 10, background: '#f0fdf4', borderRadius: 8, marginBottom: 16, cursor: 'pointer' }}>
              <input type="checkbox" checked={form.is_default} onChange={(e) => setForm({ ...form, is_default: e.target.checked })} />
              <span style={{ fontSize: 12, fontWeight: 800, color: '#065f46' }}>اجعله افتراضي</span>
            </label>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setModal(false)} style={{ flex: 1, padding: 12, background: '#f1f5f9', border: 'none', borderRadius: 10, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit' }}>إلغاء</button>
              <button onClick={save} disabled={saving} style={{ flex: 1, padding: 12, background: 'linear-gradient(135deg,#10b981,#059669)', color: '#fff', border: 'none', borderRadius: 10, fontWeight: 900, cursor: saving ? 'not-allowed' : 'pointer', fontFamily: 'inherit' }}>{saving ? '...' : '✓ حفظ'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
