'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { useCurrentUser } from '@/lib/useCurrentUser';
import { useToast } from '@/components/Toast';
import { SkeletonList } from '@/components/Skeleton';
import EmptyState from '@/components/EmptyState';

const DEFAULT_CURRENCIES = [
  { code: 'USD', name_ar: 'دولار أمريكي', icon: '🇺🇸' },
  { code: 'EUR', name_ar: 'يورو', icon: '🇪🇺' },
  { code: 'TRY', name_ar: 'ليرة تركية', icon: '🇹🇷' },
  { code: 'SAR', name_ar: 'ريال سعودي', icon: '🇸🇦' },
  { code: 'AED', name_ar: 'درهم إماراتي', icon: '🇦🇪' },
  { code: 'JOD', name_ar: 'دينار أردني', icon: '🇯🇴' },
  { code: 'LBP', name_ar: 'ليرة لبنانية', icon: '🇱🇧' },
  { code: 'EGP', name_ar: 'جنيه مصري', icon: '🇪🇬' },
];

export default function ExchangeRatesPage() {
  const router = useRouter();
  const { user, loading: uL, dataOwnerName } = useCurrentUser();
  const { success, error: tE } = useToast();
  const [rates, setRates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (uL) return;
    if (!user) { router.replace('/login'); return; }
    load();
  }, [user, uL]);

  async function load() {
    if (!supabase || !dataOwnerName) { setLoading(false); return; }
    const { data } = await supabase.from('exchange_rates').select('*').eq('entity_name', dataOwnerName).order('code');
    setRates(data || []);
    setLoading(false);
  }

  function openAdd() {
    const availableCurrencies = DEFAULT_CURRENCIES.filter(
      c => !rates.some(r => r.code === c.code)
    );
    if (availableCurrencies.length === 0) { tE('جميع العملات مضافة بالفعل'); return; }
    setForm({ code: availableCurrencies[0].code, name_ar: availableCurrencies[0].name_ar, buy_price: '', sell_price: '', is_active: true });
    setModal('add');
  }

  function openEdit(r) {
    setForm({ ...r });
    setModal('edit');
  }

  function selectCurrency(code) {
    const c = DEFAULT_CURRENCIES.find(x => x.code === code);
    if (c) setForm({ ...form, code: c.code, name_ar: c.name_ar });
  }

  async function save() {
    if (!form.code) { tE('العملة مطلوبة'); return; }
    if (!form.buy_price || Number(form.buy_price) <= 0) { tE('سعر الشراء مطلوب'); return; }
    if (!form.sell_price || Number(form.sell_price) <= 0) { tE('سعر البيع مطلوب'); return; }
    if (Number(form.sell_price) <= Number(form.buy_price)) { tE('سعر البيع يجب أن يكون أكبر من سعر الشراء'); return; }

    setSaving(true);
    try {
      const payload = {
        entity_name: dataOwnerName,
        code: form.code,
        name_ar: form.name_ar,
        buy_price: Number(form.buy_price),
        sell_price: Number(form.sell_price),
        is_active: form.is_active !== false,
        updated_at: new Date().toISOString(),
      };
      let err;
      if (modal === 'edit') ({ error: err } = await supabase.from('exchange_rates').update(payload).eq('id', form.id));
      else ({ error: err } = await supabase.from('exchange_rates').insert(payload));
      if (err) throw err;
      success(modal === 'edit' ? '✅ تم التعديل' : '✅ تمت الإضافة');
      setModal(null); load();
    } catch (e) { tE('تعذّر: ' + e.message); }
    setSaving(false);
  }

  async function del(r) {
    if (!confirm(`حذف ${r.code}؟`)) return;
    await supabase.from('exchange_rates').delete().eq('id', r.id);
    success('✅ تم الحذف'); load();
  }

  async function toggle(r) {
    await supabase.from('exchange_rates').update({ is_active: !r.is_active }).eq('id', r.id);
    load();
  }

  if (uL || loading) return <div style={{ padding: 16, background: '#f8fafc', minHeight: '100vh' }}><SkeletonList count={3} /></div>;

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', paddingBottom: 80 }}>
      <div style={{ position: 'sticky', top: 0, zIndex: 10, background: 'linear-gradient(135deg,#ca8a04,#854d0e)', padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <Link href="/merchant" style={{ color: '#fff', textDecoration: 'none', fontSize: 20, width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,.15)', borderRadius: '50%' }}>→</Link>
        <div style={{ flex: 1 }}>
          <div style={{ color: '#fff', fontSize: 16, fontWeight: 900 }}>💱 أسعار الصرف</div>
          <div style={{ color: 'rgba(255,255,255,.8)', fontSize: 11, marginTop: 2 }}>{rates.length} عملة</div>
        </div>
        <button onClick={openAdd} style={{ background: '#fff', color: '#854d0e', border: 'none', padding: '8px 14px', borderRadius: 10, fontSize: 12, fontWeight: 900, cursor: 'pointer', fontFamily: 'inherit' }}>+ عملة</button>
      </div>

      <div style={{ padding: 16 }}>
        <div style={{ background: 'rgba(202,138,4,.08)', border: '1px solid rgba(202,138,4,.2)', borderRadius: 12, padding: 12, marginBottom: 16, fontSize: 12, color: '#854d0e', fontWeight: 700, lineHeight: 1.6 }}>
          💡 سعر الشراء: كم تدفع لشراء العملة من العميل. سعر البيع: كم تأخذ عند بيع العملة للعميل.
        </div>
      </div>

      <div style={{ padding: '0 16px' }}>
        {rates.length === 0 ? (
          <EmptyState icon="💱" title="لا توجد أسعار" description="أضف عملاتك ليتمكن العملاء من رؤيتها" actionLabel="+ إضافة عملة" onAction={openAdd} />
        ) : rates.map(r => {
          const currency = DEFAULT_CURRENCIES.find(c => c.code === r.code);
          return (
            <div key={r.id} style={{ background: '#fff', borderRadius: 14, padding: 14, marginBottom: 10, border: '1px solid #e5e7eb', opacity: r.is_active ? 1 : 0.6 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ fontSize: 28 }}>{currency?.icon || '💵'}</div>
                  <div>
                    <div style={{ fontSize: 15, fontWeight: 900, color: '#0f172a', direction: 'ltr', textAlign: 'right' }}>{r.code}</div>
                    <div style={{ fontSize: 11, color: '#64748b' }}>{r.name_ar}</div>
                  </div>
                </div>
                <span style={{ background: r.is_active ? 'rgba(16,185,129,.15)' : '#f1f5f9', color: r.is_active ? '#10b981' : '#64748b', padding: '3px 10px', borderRadius: 6, fontSize: 9.5, fontWeight: 900, height: 'fit-content' }}>{r.is_active ? '● نشط' : '○ معطل'}</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 10 }}>
                <div style={{ background: 'rgba(16,185,129,.08)', padding: 10, borderRadius: 8 }}>
                  <div style={{ fontSize: 10, color: '#64748b', fontWeight: 700, marginBottom: 2 }}>شراء</div>
                  <div style={{ fontSize: 16, fontWeight: 900, color: '#10b981', direction: 'ltr', textAlign: 'right' }}>{Number(r.buy_price).toLocaleString()}</div>
                </div>
                <div style={{ background: 'rgba(239,68,68,.08)', padding: 10, borderRadius: 8 }}>
                  <div style={{ fontSize: 10, color: '#64748b', fontWeight: 700, marginBottom: 2 }}>بيع</div>
                  <div style={{ fontSize: 16, fontWeight: 900, color: '#ef4444', direction: 'ltr', textAlign: 'right' }}>{Number(r.sell_price).toLocaleString()}</div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                <button onClick={() => openEdit(r)} style={{ flex: 1, padding: 8, background: '#f1f5f9', color: '#475569', border: 'none', borderRadius: 8, fontSize: 11, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit' }}>✏️ تعديل</button>
                <button onClick={() => toggle(r)} style={{ flex: 1, padding: 8, background: r.is_active ? 'rgba(251,191,36,.1)' : 'rgba(16,185,129,.1)', color: r.is_active ? '#92400e' : '#10b981', border: 'none', borderRadius: 8, fontSize: 11, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit' }}>{r.is_active ? '⏸ إيقاف' : '▶ تفعيل'}</button>
                <button onClick={() => del(r)} style={{ padding: 8, background: 'rgba(220,38,38,.1)', color: '#dc2626', border: 'none', borderRadius: 8, fontSize: 11, cursor: 'pointer', fontFamily: 'inherit' }}>🗑️</button>
              </div>
            </div>
          );
        })}
      </div>

      {modal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.6)', zIndex: 100, display: 'flex', alignItems: 'flex-end' }} onClick={() => setModal(null)}>
          <div style={{ background: '#fff', borderRadius: '24px 24px 0 0', width: '100%', maxWidth: 500, margin: '0 auto', padding: '24px 20px 30px', maxHeight: '90vh', overflowY: 'auto' }} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ fontSize: 18, fontWeight: 900, marginBottom: 16 }}>{modal === 'edit' ? 'تعديل سعر' : 'إضافة عملة'}</h3>

            {modal === 'add' && (
              <div style={{ marginBottom: 12 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 800, color: '#334155', marginBottom: 6 }}>العملة</label>
                <select value={form.code || ''} onChange={(e) => selectCurrency(e.target.value)} style={{ width: '100%', padding: 12, border: '1px solid #e5e7eb', borderRadius: 10, fontSize: 14, fontFamily: 'inherit', boxSizing: 'border-box' }}>
                  {DEFAULT_CURRENCIES.filter(c => !rates.some(r => r.code === c.code)).map(c => (
                    <option key={c.code} value={c.code}>{c.icon} {c.name_ar} ({c.code})</option>
                  ))}
                </select>
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 800, color: '#10b981', marginBottom: 6 }}>سعر الشراء (SYP) *</label>
                <input type="number" value={form.buy_price || ''} onChange={(e) => setForm({ ...form, buy_price: e.target.value })} placeholder="0" style={{ width: '100%', padding: 12, border: '1px solid #e5e7eb', borderRadius: 10, fontSize: 14, fontFamily: 'inherit', boxSizing: 'border-box', outline: 'none' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 800, color: '#ef4444', marginBottom: 6 }}>سعر البيع (SYP) *</label>
                <input type="number" value={form.sell_price || ''} onChange={(e) => setForm({ ...form, sell_price: e.target.value })} placeholder="0" style={{ width: '100%', padding: 12, border: '1px solid #e5e7eb', borderRadius: 10, fontSize: 14, fontFamily: 'inherit', boxSizing: 'border-box', outline: 'none' }} />
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setModal(null)} style={{ flex: 1, padding: 12, background: '#f1f5f9', border: 'none', borderRadius: 10, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit' }}>إلغاء</button>
              <button onClick={save} disabled={saving} style={{ flex: 1, padding: 12, background: 'linear-gradient(135deg,#ca8a04,#854d0e)', color: '#fff', border: 'none', borderRadius: 10, fontWeight: 900, cursor: saving ? 'not-allowed' : 'pointer', fontFamily: 'inherit' }}>{saving ? '...' : '✓ حفظ'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
