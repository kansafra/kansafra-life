'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { useCurrentUser } from '@/lib/useCurrentUser';
import { useToast } from '@/components/Toast';

export default function PaymentMethodsPage() {
  const router = useRouter();
  const { success, error: toastError } = useToast();
  const { user, loading: userLoading, dataOwnerName } = useCurrentUser();

  const [entity, setEntity] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    accepts_cash: true,
    accepts_transfer: false,
    accepts_wallet: false,
    bank_account_info: '',
    wallet_number: '',
  });

  useEffect(() => {
    if (userLoading) return;
    if (!user || !dataOwnerName) { setLoading(false); return; }
    loadEntity();
  }, [user, userLoading, dataOwnerName]);

  async function loadEntity() {
    if (!supabase || !dataOwnerName) return;
    try {
      const { data } = await supabase.from('entities').select('*').eq('display_name', dataOwnerName).maybeSingle();
      if (data) {
        setEntity(data);
        setForm({
          accepts_cash: data.accepts_cash !== false,
          accepts_transfer: data.accepts_transfer === true,
          accepts_wallet: data.accepts_wallet === true,
          bank_account_info: data.bank_account_info || '',
          wallet_number: data.wallet_number || '',
        });
      }
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }

  async function handleSave() {
    if (!entity?.id) { toastError('لم يتم العثور على المتجر'); return; }
    if (!form.accepts_cash && !form.accepts_transfer && !form.accepts_wallet) {
      toastError('يجب تفعيل طريقة دفع واحدة على الأقل');
      return;
    }
    if (form.accepts_transfer && !form.bank_account_info.trim()) {
      toastError('أدخل بيانات الحساب البنكي');
      return;
    }
    if (form.accepts_wallet && !form.wallet_number.trim()) {
      toastError('أدخل رقم المحفظة');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        accepts_cash: form.accepts_cash,
        accepts_transfer: form.accepts_transfer,
        accepts_wallet: form.accepts_wallet,
        bank_account_info: form.bank_account_info.trim() || null,
        wallet_number: form.wallet_number.trim() || null,
      };
      const { error } = await supabase.from('entities').update(payload).eq('id', entity.id);
      if (error) throw error;
      setEntity({ ...entity, ...payload });
      success('✅ تم حفظ طرق الدفع');
    } catch (err) {
      console.error(err);
      toastError('فشل الحفظ');
    } finally { setSaving(false); }
  }

  if (userLoading || loading) return <div style={{ padding: 80, textAlign: 'center' }}>⏳</div>;

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', paddingBottom: 100 }}>
      <div style={{ background: '#0f4d3a', padding: '16px 20px', position: 'sticky', top: 0, zIndex: 20, display: 'flex', alignItems: 'center', gap: 12 }}>
        <Link href="/merchant/settings" style={{ color: '#fff', textDecoration: 'none', fontSize: 20 }}>←</Link>
        <h1 style={{ color: '#fff', fontSize: 18, fontWeight: 900, margin: 0 }}>💳 طرق الدفع</h1>
      </div>

      <div style={{ padding: 16, maxWidth: 600, margin: '0 auto' }}>
        
        <div style={{ background: 'rgba(14,165,233,0.08)', border: '1px solid rgba(14,165,233,0.2)', borderRadius: 12, padding: 14, marginBottom: 16 }}>
          <div style={{ fontSize: 12, color: '#0284c7', fontWeight: 900, marginBottom: 4 }}>💡 كيف تعمل؟</div>
          <div style={{ fontSize: 11, color: '#475569', lineHeight: 1.6 }}>
            الطرق التي تفعّلها هنا ستظهر للزبون في صفحة الدفع. سيرى الزبون فقط الطرق المتاحة لمتجرك.
          </div>
        </div>

        {/* Cash */}
        <PaymentCard
          active={form.accepts_cash}
          onToggle={() => setForm({ ...form, accepts_cash: !form.accepts_cash })}
          icon="💵"
          title="الدفع عند الاستلام (نقداً)"
          description="يدفع الزبون نقداً عند استلام الطلب"
          color="#10b981"
        />

        {/* Bank Transfer */}
        <PaymentCard
          active={form.accepts_transfer}
          onToggle={() => setForm({ ...form, accepts_transfer: !form.accepts_transfer })}
          icon="🏦"
          title="تحويل بنكي"
          description="يحوّل الزبون المبلغ إلى حسابك البنكي"
          color="#0ea5e9"
        >
          {form.accepts_transfer && (
            <div style={{ marginTop: 12 }}>
              <label style={labelStyle}>بيانات الحساب البنكي *</label>
              <textarea
                value={form.bank_account_info}
                onChange={e => setForm({ ...form, bank_account_info: e.target.value })}
                style={{ ...inputStyle, height: 80, resize: 'none' }}
                placeholder="اسم البنك، اسم صاحب الحساب، رقم الحساب / IBAN..."
              />
            </div>
          )}
        </PaymentCard>

        {/* Wallet */}
        <PaymentCard
          active={form.accepts_wallet}
          onToggle={() => setForm({ ...form, accepts_wallet: !form.accepts_wallet })}
          icon="📱"
          title="محفظة إلكترونية"
          description="سيرياتيل كاش، MTN كاش، الهرم، إلخ"
          color="#f59e0b"
        >
          {form.accepts_wallet && (
            <div style={{ marginTop: 12 }}>
              <label style={labelStyle}>رقم المحفظة *</label>
              <input
                value={form.wallet_number}
                onChange={e => setForm({ ...form, wallet_number: e.target.value })}
                style={inputStyle}
                placeholder="09xxxxxxxx"
                type="tel"
              />
              <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 4 }}>
                سيرى الزبون هذا الرقم ليحوّل إليه
              </div>
            </div>
          )}
        </PaymentCard>

        <button
          onClick={handleSave}
          disabled={saving}
          style={{
            width: '100%', padding: 16, marginTop: 16,
            background: saving ? '#94a3b8' : 'linear-gradient(135deg, #10b981, #059669)',
            color: '#fff', border: 'none', borderRadius: 14,
            fontWeight: 900, fontSize: 15,
            cursor: saving ? 'wait' : 'pointer', fontFamily: 'inherit',
            boxShadow: '0 6px 20px rgba(16,185,129,0.3)'
          }}
        >
          {saving ? '⏳ جارٍ الحفظ...' : '💾 حفظ طرق الدفع'}
        </button>
      </div>
    </div>
  );
}

function PaymentCard({ active, onToggle, icon, title, description, color, children }) {
  return (
    <div style={{
      background: '#fff',
      borderRadius: 16,
      padding: 16,
      marginBottom: 12,
      border: active ? `2px solid ${color}` : '1px solid #e2e8f0',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{
          width: 48, height: 48, borderRadius: 12,
          background: `${color}15`, color,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 24, flexShrink: 0
        }}>{icon}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 900, color: '#0f172a' }}>{title}</div>
          <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>{description}</div>
        </div>
        <button
          onClick={onToggle}
          type="button"
          style={{
            position: 'relative',
            width: 48, height: 26,
            background: active ? color : '#cbd5e1',
            border: 'none', borderRadius: 26,
            cursor: 'pointer', padding: 0,
            transition: 'background 0.2s'
          }}
        >
          <div style={{
            position: 'absolute',
            top: 3, [active ? 'left' : 'right']: 3,
            width: 20, height: 20,
            background: '#fff', borderRadius: '50%',
            boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
            transition: 'all 0.2s'
          }} />
        </button>
      </div>
      {children}
    </div>
  );
}

const labelStyle = { display: 'block', fontSize: 12, fontWeight: 800, color: '#475569', marginBottom: 6 };
const inputStyle = { width: '100%', padding: '12px 14px', borderRadius: 10, border: '1px solid #cbd5e1', fontSize: 14, fontFamily: 'inherit', boxSizing: 'border-box', outline: 'none', background: '#f8fafc' };
