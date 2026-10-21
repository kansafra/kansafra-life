'use client';
import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { useCurrentUser } from '@/lib/useCurrentUser';
import { useToast } from '@/components/Toast';

export default function MerchantCouponsPage() {
  const router = useRouter();
  const { success, error: toastError } = useToast();
  const { user, loading: userLoading, dataOwnerName } = useCurrentUser();

  const [entityId, setEntityId] = useState(null);
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    code: '',
    discount_type: 'percentage',
    discount_value: '',
    min_order_amount: '0',
    max_uses: '',
    expires_at: '',
  });
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(null);

  useEffect(() => {
    if (userLoading) return;
    if (!user || !dataOwnerName) { setLoading(false); return; }

    const stored = JSON.parse(localStorage.getItem('sanad_entity') || 'null');
    if (stored?.parent_entity_id) {
      setEntityId(stored.parent_entity_id);
    } else {
      supabase.from('entities').select('id').eq('display_name', dataOwnerName).maybeSingle().then(({ data }) => {
        if (data) setEntityId(data.id);
      });
    }
    loadCoupons();
  }, [user, userLoading, dataOwnerName]);

  async function loadCoupons() {
    if (!supabase || !dataOwnerName) return;
    setLoading(true);
    try {
      const { data } = await supabase
        .from('coupons')
        .select('*')
        .eq('provider_name', dataOwnerName)
        .order('created_at', { ascending: false });
      setCoupons(data || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }

  function generateCode() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 6; i++) code += chars.charAt(Math.floor(Math.random() * chars.length));
    setForm({ ...form, code });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.code.trim()) { toastError('كود الخصم مطلوب'); return; }
    if (!form.discount_value || Number(form.discount_value) <= 0) { toastError('قيمة الخصم مطلوبة'); return; }

    setSaving(true);
    try {
      const payload = {
        entity_id: entityId,
        provider_name: dataOwnerName,
        code: form.code.trim().toUpperCase(),
        discount_type: form.discount_type,
        discount_value: Number(form.discount_value),
        min_order_amount: Number(form.min_order_amount) || 0,
        max_uses: form.max_uses ? Number(form.max_uses) : null,
        expires_at: form.expires_at ? new Date(form.expires_at).toISOString() : null,
        is_active: true,
      };

      const { error } = await supabase.from('coupons').insert(payload);
      if (error) {
        if (error.code === '23505') toastError('هذا الكود مستخدم بالفعل، جرب كوداً آخر');
        else throw error;
        return;
      }

      success('🎉 تم إنشاء الكوبون');
      setShowForm(false);
      setForm({ code: '', discount_type: 'percentage', discount_value: '', min_order_amount: '0', max_uses: '', expires_at: '' });
      loadCoupons();
    } catch (err) {
      console.error(err);
      toastError('فشل الإنشاء');
    } finally { setSaving(false); }
  }

  async function toggleActive(coupon) {
    const { error } = await supabase.from('coupons').update({ is_active: !coupon.is_active }).eq('id', coupon.id);
    if (error) toastError('فشل التحديث');
    else {
      success(coupon.is_active ? '⏸️ تم الإيقاف' : '✅ تم التفعيل');
      setCoupons(prev => prev.map(c => c.id === coupon.id ? { ...c, is_active: !c.is_active } : c));
    }
  }

  async function handleDelete(coupon) {
    if (!confirm(`حذف الكوبون "${coupon.code}"؟`)) return;
    setDeleting(coupon.id);
    const { error } = await supabase.from('coupons').delete().eq('id', coupon.id);
    if (error) toastError('فشل الحذف');
    else { success('🗑️ تم الحذف'); setCoupons(prev => prev.filter(c => c.id !== coupon.id)); }
    setDeleting(null);
  }

  function copyCode(code) {
    navigator.clipboard.writeText(code);
    success('📋 تم نسخ الكود');
  }

  const stats = useMemo(() => {
    const now = new Date();
    const active = coupons.filter(c => c.is_active && (!c.expires_at || new Date(c.expires_at) > now)).length;
    const expired = coupons.filter(c => c.expires_at && new Date(c.expires_at) <= now).length;
    return { total: coupons.length, active, expired };
  }, [coupons]);

  if (userLoading || loading) return <div style={{ padding: 80, textAlign: 'center' }}>⏳</div>;

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', paddingBottom: 100 }}>
      <div style={{ background: '#0f4d3a', padding: '16px 20px', position: 'sticky', top: 0, zIndex: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Link href="/merchant" style={{ color: '#fff', textDecoration: 'none', fontSize: 20 }}>←</Link>
          <h1 style={{ color: '#fff', fontSize: 18, fontWeight: 900, margin: 0, flex: 1 }}>🎟️ كوبونات الخصم</h1>
          <button onClick={() => setShowForm(true)} style={{ background: '#fbbf24', color: '#0f4d3a', border: 'none', padding: '8px 14px', borderRadius: 10, fontSize: 12, fontWeight: 900, cursor: 'pointer', fontFamily: 'inherit' }}>+ جديد</button>
        </div>
      </div>

      <div style={{ padding: 16, maxWidth: 800, margin: '0 auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 16 }}>
          <StatBox label="الكل" value={stats.total} color="#0f4d3a" />
          <StatBox label="نشطة" value={stats.active} color="#10b981" />
          <StatBox label="منتهية" value={stats.expired} color="#ef4444" />
        </div>

        {coupons.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 40, background: '#fff', borderRadius: 16, color: '#64748b' }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>🎟️</div>
            <div style={{ fontSize: 15, fontWeight: 900, marginBottom: 8 }}>لا توجد كوبونات</div>
            <button onClick={() => setShowForm(true)} style={{ display: 'inline-block', background: '#0f4d3a', color: '#fff', padding: '10px 20px', borderRadius: 10, border: 'none', fontSize: 13, fontWeight: 900, cursor: 'pointer', fontFamily: 'inherit' }}>
              + أنشئ أول كوبون
            </button>
          </div>
        ) : coupons.map(coupon => {
          const isExpired = coupon.expires_at && new Date(coupon.expires_at) <= new Date();
          const isFull = coupon.max_uses && coupon.used_count >= coupon.max_uses;
          const isUsable = coupon.is_active && !isExpired && !isFull;

          return (
            <div key={coupon.id} style={{ background: '#fff', borderRadius: 16, padding: 16, marginBottom: 12, border: '1px solid #e2e8f0', opacity: isUsable ? 1 : 0.6 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                <div>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: '#f1f5f9', padding: '6px 12px', borderRadius: 8, marginBottom: 8 }}>
                    <span style={{ fontSize: 18, fontWeight: 900, color: '#0f4d3a', letterSpacing: 2, fontFamily: 'monospace' }}>{coupon.code}</span>
                    <button onClick={() => copyCode(coupon.code)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 14 }} title="نسخ">📋</button>
                  </div>
                  <div style={{ fontSize: 16, fontWeight: 900, color: '#0f172a' }}>
                    {coupon.discount_type === 'percentage' ? `${coupon.discount_value}% خصم` : `${Number(coupon.discount_value).toLocaleString()} ل.س خصم`}
                  </div>
                </div>
                <div style={{ background: isUsable ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)', color: isUsable ? '#10b981' : '#ef4444', padding: '4px 10px', borderRadius: 8, fontSize: 10, fontWeight: 900 }}>
                  {isExpired ? '⏰ منتهي' : isFull ? '🚫 استُنفد' : coupon.is_active ? '✅ نشط' : '⏸️ موقوف'}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 6, marginBottom: 12 }}>
                <MiniInfo label="الحد الأدنى" value={`${Number(coupon.min_order_amount).toLocaleString()} ل.س`} />
                <MiniInfo label="الاستخدامات" value={coupon.max_uses ? `${coupon.used_count}/${coupon.max_uses}` : 'غير محدود'} />
                {coupon.expires_at && <MiniInfo label="ينتهي في" value={new Date(coupon.expires_at).toLocaleDateString('ar-SY')} />}
              </div>

              <div style={{ display: 'flex', gap: 6 }}>
                <button onClick={() => toggleActive(coupon)} style={btnStyle(coupon.is_active ? 'rgba(245,158,11,0.1)' : 'rgba(16,185,129,0.1)', coupon.is_active ? '#f59e0b' : '#10b981')}>
                  {coupon.is_active ? '⏸️ إيقاف' : '✅ تفعيل'}
                </button>
                <button onClick={() => handleDelete(coupon)} disabled={deleting === coupon.id} style={btnStyle('rgba(239,68,68,0.1)', '#ef4444')}>
                  {deleting === coupon.id ? '⏳' : '🗑️ حذف'}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {showForm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 100, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
          <div style={{ background: '#fff', width: '100%', maxWidth: 500, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h2 style={{ fontSize: 18, fontWeight: 900, margin: 0 }}>🎟️ كوبون جديد</h2>
              <button onClick={() => setShowForm(false)} style={{ background: '#f1f5f9', border: 'none', width: 32, height: 32, borderRadius: '50%', fontSize: 16, cursor: 'pointer' }}>✕</button>
            </div>

            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: 12 }}>
                <label style={labelStyle}>كود الخصم *</label>
                <div style={{ display: 'flex', gap: 6 }}>
                  <input value={form.code} onChange={e => setForm({ ...form, code: e.target.value.toUpperCase() })} required style={{ ...inputStyle, flex: 1, letterSpacing: 2, fontWeight: 900 }} placeholder="مثال: SANAD10" />
                  <button type="button" onClick={generateCode} style={{ background: 'rgba(14,165,233,0.1)', color: '#0284c7', border: '1px solid rgba(14,165,233,0.3)', padding: '0 14px', borderRadius: 10, fontSize: 12, fontWeight: 900, cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap' }}>🎲 توليد</button>
                </div>
              </div>

              <div style={{ marginBottom: 12 }}>
                <label style={labelStyle}>نوع الخصم *</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  <button type="button" onClick={() => setForm({ ...form, discount_type: 'percentage' })} style={typeBtn(form.discount_type === 'percentage', '#0f4d3a')}>📊 نسبة مئوية</button>
                  <button type="button" onClick={() => setForm({ ...form, discount_type: 'fixed' })} style={typeBtn(form.discount_type === 'fixed', '#0f4d3a')}>💵 مبلغ ثابت</button>
                </div>
              </div>

              <div style={{ marginBottom: 12 }}>
                <label style={labelStyle}>{form.discount_type === 'percentage' ? 'نسبة الخصم (%) *' : 'قيمة الخصم (ل.س) *'}</label>
                <input type="number" value={form.discount_value} onChange={e => setForm({ ...form, discount_value: e.target.value })} required style={inputStyle} placeholder={form.discount_type === 'percentage' ? '10' : '5000'} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 12 }}>
                <div>
                  <label style={labelStyle}>الحد الأدنى للطلب</label>
                  <input type="number" value={form.min_order_amount} onChange={e => setForm({ ...form, min_order_amount: e.target.value })} style={inputStyle} placeholder="0" />
                </div>
                <div>
                  <label style={labelStyle}>أقصى عدد استخدامات</label>
                  <input type="number" value={form.max_uses} onChange={e => setForm({ ...form, max_uses: e.target.value })} style={inputStyle} placeholder="غير محدود" />
                </div>
              </div>

              <div style={{ marginBottom: 20 }}>
                <label style={labelStyle}>تاريخ الانتهاء (اختياري)</label>
                <input type="date" value={form.expires_at} onChange={e => setForm({ ...form, expires_at: e.target.value })} style={inputStyle} />
              </div>

              <button type="submit" disabled={saving} style={{ width: '100%', padding: 14, background: saving ? '#94a3b8' : '#0f4d3a', color: '#fff', border: 'none', borderRadius: 10, fontWeight: 900, fontSize: 15, cursor: saving ? 'wait' : 'pointer', fontFamily: 'inherit' }}>
                {saving ? '⏳ جارٍ الإنشاء...' : '🎟️ إنشاء الكوبون'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function StatBox({ label, value, color }) {
  return (
    <div style={{ background: '#fff', borderRadius: 12, padding: 12, textAlign: 'center', border: '1px solid #e2e8f0' }}>
      <div style={{ fontSize: 18, fontWeight: 900, color, marginBottom: 2 }}>{value}</div>
      <div style={{ fontSize: 9.5, color: '#64748b', fontWeight: 800 }}>{label}</div>
    </div>
  );
}

function MiniInfo({ label, value }) {
  return (
    <div style={{ background: '#f8fafc', borderRadius: 8, padding: 8 }}>
      <div style={{ fontSize: 9, color: '#94a3b8', fontWeight: 800, marginBottom: 2 }}>{label}</div>
      <div style={{ fontSize: 11.5, color: '#1e293b', fontWeight: 900 }}>{value}</div>
    </div>
  );
}

const btnStyle = (bg, color) => ({ flex: 1, padding: 10, background: bg, color, border: 'none', borderRadius: 8, fontSize: 12, fontWeight: 900, cursor: 'pointer', fontFamily: 'inherit' });
const labelStyle = { display: 'block', fontSize: 12, fontWeight: 800, color: '#475569', marginBottom: 6 };
const inputStyle = { width: '100%', padding: '12px 14px', borderRadius: 10, border: '1px solid #cbd5e1', fontSize: 14, fontFamily: 'inherit', boxSizing: 'border-box', outline: 'none', background: '#f8fafc' };
const typeBtn = (active, color) => ({ padding: 10, background: active ? `${color}15` : '#f8fafc', color: active ? color : '#475569', border: active ? `2px solid ${color}` : '1px solid #e2e8f0', borderRadius: 10, fontSize: 12, fontWeight: 900, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 });
