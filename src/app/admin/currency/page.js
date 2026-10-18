'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/components/Toast';
import { SkeletonList } from '@/components/Skeleton';
import EmptyState from '@/components/EmptyState';

export default function AdminCurrency() {
  const router = useRouter();
  const { success, error: tE } = useToast();
  const [rates, setRates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let stored = null;
    try { stored = JSON.parse(localStorage.getItem('sanad_admin') || 'null'); } catch {}
    if (!stored) { router.replace('/admin/login'); return; }
    load();
  }, [router]);

  async function load() {
    if (!supabase) { setLoading(false); return; }
    const { data } = await supabase.from('currency_rates').select('*').order('code');
    setRates(data || []);
    setLoading(false);
  }

  function openAdd() {
    setEditing(null);
    setForm({ code: '', name_ar: '', buy_price: 0, sell_price: 0, is_active: true });
    setModal(true);
  }

  function openEdit(r) {
    setEditing(r);
    setForm({ ...r });
    setModal(true);
  }

  async function save() {
    if (!form.code?.trim()) { tE('الرمز مطلوب'); return; }
    if (!form.name_ar?.trim()) { tE('الاسم مطلوب'); return; }
    setSaving(true);
    try {
      const payload = {
        code: form.code.trim().toUpperCase(),
        name_ar: form.name_ar.trim(),
        buy_price: Number(form.buy_price) || 0,
        sell_price: Number(form.sell_price) || 0,
        is_active: form.is_active !== false,
        updated_at: new Date().toISOString(),
      };
      let err;
      if (editing) ({ error: err } = await supabase.from('currency_rates').update(payload).eq('id', editing.id));
      else ({ error: err } = await supabase.from('currency_rates').insert(payload));
      if (err) throw err;
      success(editing ? '✅ تم التعديل' : '✅ تمت الإضافة');
      setModal(false); load();
    } catch (e) { tE('تعذّر: ' + e.message); }
    setSaving(false);
  }

  async function del(r) {
    if (!confirm(`حذف ${r.code}؟`)) return;
    await supabase.from('currency_rates').delete().eq('id', r.id);
    success('✅ تم'); load();
  }

  async function toggle(r) {
    await supabase.from('currency_rates').update({ is_active: !r.is_active }).eq('id', r.id);
    load();
  }

  if (loading) return <div style={{ padding: 16, background: '#f8fafc', minHeight: '100vh' }}><SkeletonList count={3} /></div>;

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', paddingBottom: 40 }}>
      <div style={{ position: 'sticky', top: 0, zIndex: 10, background: '#0f4d3a', padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <Link href="/admin" style={{ color: '#fff', textDecoration: 'none', fontSize: 20, width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,.1)', borderRadius: '50%' }}>→</Link>
        <div style={{ flex: 1, color: '#fff', fontSize: 16, fontWeight: 900 }}>💱 أسعار العملات ({rates.length})</div>
        <button onClick={openAdd} style={{ background: '#fbbf24', color: '#0f4d3a', border: 'none', padding: '8px 14px', borderRadius: 10, fontSize: 12, fontWeight: 900, cursor: 'pointer', fontFamily: 'inherit' }}>+ عملة</button>
      </div>
      <div style={{ padding: 16 }}>
        {rates.length === 0 ? <EmptyState icon="💱" title="لا توجد عملات" description="أضف أسعار الصرف" actionLabel="+ إضافة" onAction={openAdd} /> : rates.map(r => (
          <div key={r.id} style={{ background: '#fff', borderRadius: 14, padding: 14, marginBottom: 10, border: '1px solid #e5e7eb', opacity: r.is_active ? 1 : 0.6 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 16, fontWeight: 900, color: '#0f4d3a', direction: 'ltr', textAlign: 'right' }}>{r.code}</div>
                <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>{r.name_ar}</div>
              </div>
              <div style={{ background: r.is_active ? 'rgba(16,185,129,.15)' : '#f1f5f9', color: r.is_active ? '#10b981' : '#64748b', padding: '3px 8px', borderRadius: 6, fontSize: 9.5, fontWeight: 900, height: 'fit-content' }}>{r.is_active ? '● نشط' : '○ معطل'}</div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 10 }}>
              <div style={{ background: 'rgba(16,185,129,.08)', padding: 10, borderRadius: 8 }}>
                <div style={{ fontSize: 10, color: '#64748b', fontWeight: 700 }}>شراء</div>
                <div style={{ fontSize: 14, fontWeight: 900, color: '#10b981' }}>{Number(r.buy_price || 0).toLocaleString()}</div>
              </div>
              <div style={{ background: 'rgba(239,68,68,.08)', padding: 10, borderRadius: 8 }}>
                <div style={{ fontSize: 10, color: '#64748b', fontWeight: 700 }}>بيع</div>
                <div style={{ fontSize: 14, fontWeight: 900, color: '#ef4444' }}>{Number(r.sell_price || 0).toLocaleString()}</div>
              </div>
            </div>
            <div style={{ fontSize: 10, color: '#94a3b8', marginBottom: 8 }}>آخر تحديث: {r.updated_at ? new Date(r.updated_at).toLocaleString('ar-EG') : '—'}</div>
            <div style={{ display: 'flex', gap: 4 }}>
              <button onClick={() => openEdit(r)} style={{ flex: 1, padding: 8, background: '#f1f5f9', border: 'none', borderRadius: 8, fontSize: 11, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit' }}>✏️ تعديل</button>
              <button onClick={() => toggle(r)} style={{ flex: 1, padding: 8, background: '#f1f5f9', border: 'none', borderRadius: 8, fontSize: 11, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit' }}>{r.is_active ? '⏸' : '▶'}</button>
              <button onClick={() => del(r)} style={{ padding: 8, background: 'rgba(220,38,38,.1)', color: '#dc2626', border: 'none', borderRadius: 8, fontSize: 11, cursor: 'pointer', fontFamily: 'inherit' }}>🗑️</button>
            </div>
          </div>
        ))}
      </div>
      {modal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.6)', zIndex: 100, display: 'flex', alignItems: 'flex-end' }} onClick={() => setModal(false)}>
          <div style={{ background: '#fff', borderRadius: '24px 24px 0 0', width: '100%', maxWidth: 500, margin: '0 auto', padding: '24px 20px 30px' }} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ fontSize: 18, fontWeight: 900, marginBottom: 16 }}>{editing ? 'تعديل عملة' : 'عملة جديدة'}</h3>
            <input type="text" placeholder="الرمز * (USD, EUR, TRY...)" value={form.code || ''} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} style={{ width: '100%', padding: 12, border: '1px solid #e5e7eb', borderRadius: 10, fontSize: 14, marginBottom: 10, boxSizing: 'border-box', fontFamily: 'monospace', direction: 'ltr', textAlign: 'center', fontWeight: 900, letterSpacing: 2 }} />
            <input type="text" placeholder="الاسم بالعربية *" value={form.name_ar || ''} onChange={(e) => setForm({ ...form, name_ar: e.target.value })} style={{ width: '100%', padding: 12, border: '1px solid #e5e7eb', borderRadius: 10, fontSize: 13, marginBottom: 10, boxSizing: 'border-box', fontFamily: 'inherit' }} />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 16 }}>
              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 800, color: '#10b981', marginBottom: 4 }}>سعر الشراء</label>
                <input type="number" value={form.buy_price || ''} onChange={(e) => setForm({ ...form, buy_price: e.target.value })} style={{ width: '100%', padding: 12, border: '1px solid #e5e7eb', borderRadius: 10, fontSize: 13, boxSizing: 'border-box', fontFamily: 'inherit' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 800, color: '#ef4444', marginBottom: 4 }}>سعر البيع</label>
                <input type="number" value={form.sell_price || ''} onChange={(e) => setForm({ ...form, sell_price: e.target.value })} style={{ width: '100%', padding: 12, border: '1px solid #e5e7eb', borderRadius: 10, fontSize: 13, boxSizing: 'border-box', fontFamily: 'inherit' }} />
              </div>
            </div>
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
