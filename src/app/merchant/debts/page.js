'use client';
import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { useCurrentUser } from '@/lib/useCurrentUser';
import { useToast } from '@/components/Toast';
import Link from 'next/link';

const FILTERS = [
  { key: 'all', label: 'الكل' },
  { key: 'active', label: 'مستحق' },
  { key: 'partial', label: 'مسدد جزئياً' },
  { key: 'paid', label: 'مسدد' },
];

export default function MerchantDebtsPage() {
  const { success, error: toastError } = useToast();
  const { user, loading: userLoading, dataOwnerName } = useCurrentUser();

  const [debts, setDebts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [expandedId, setExpandedId] = useState(null);
  const [deleting, setDeleting] = useState(null);

  const [showForm, setShowForm] = useState(false);
  const [editDebt, setEditDebt] = useState(null);
  const [form, setForm] = useState({ customer_name: '', phone: '', amount: '', paid: '0', notes: '' });
  const [saving, setSaving] = useState(false);

  const [showPayment, setShowPayment] = useState(false);
  const [payDebt, setPayDebt] = useState(null);
  const [payAmount, setPayAmount] = useState('');

  useEffect(() => {
    if (userLoading) return;
    if (!user || !dataOwnerName) { setLoading(false); return; }
    loadDebts();
  }, [user, userLoading, dataOwnerName]);

  async function loadDebts() {
    if (!supabase || !dataOwnerName) return;
    try {
      const { data } = await supabase.from('debts').select('*').eq('entity_name', dataOwnerName).order('created_at', { ascending: false });
      setDebts(data || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }

  const stats = useMemo(() => {
    let total = 0, paid = 0;
    debts.forEach(d => { total += Number(d.amount || 0); paid += Number(d.paid || 0); });
    return { total, paid, remaining: total - paid, count: debts.length };
  }, [debts]);

  function getStatus(d) {
    const amt = Number(d.amount || 0);
    const pd = Number(d.paid || 0);
    if (pd <= 0) return 'active';
    if (pd >= amt) return 'paid';
    return 'partial';
  }

  const filtered = useMemo(() => {
    let list = debts;
    if (filter !== 'all') list = list.filter(d => getStatus(d) === filter);
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(d => (d.customer_name || '').toLowerCase().includes(q) || (d.phone || '').includes(q));
    }
    return list;
  }, [debts, filter, search]);

  function openAdd() {
    setForm({ customer_name: '', phone: '', amount: '', paid: '0', notes: '' });
    setEditDebt(null);
    setShowForm(true);
  }

  function openEdit(d) {
    setForm({ customer_name: d.customer_name || '', phone: d.phone || '', amount: String(d.amount || ''), paid: String(d.paid || 0), notes: d.notes || '' });
    setEditDebt(d);
    setShowForm(true);
  }

  function openPayment(d) {
    setPayDebt(d);
    setPayAmount('');
    setShowPayment(true);
  }

  async function handleSave(e) {
    e.preventDefault();
    const amt = Number(form.amount);
    const pd = Number(form.paid) || 0;
    if (!form.customer_name.trim() || !amt || amt <= 0) { toastError('الاسم والمبلغ مطلوبان'); return; }
    if (pd > amt) { toastError('المسدد لا يمكن أن يكون أكبر من المبلغ'); return; }
    setSaving(true);
    try {
      const payload = { customer_name: form.customer_name, phone: form.phone, amount: amt, paid: pd, notes: form.notes };
      if (editDebt) {
        const { error } = await supabase.from('debts').update(payload).eq('id', editDebt.id);
        if (error) throw error;
        success('✅ تم تحديث الدين');
      } else {
        const { error } = await supabase.from('debts').insert({ ...payload, entity_name: dataOwnerName });
        if (error) throw error;
        success('✅ تمت إضافة الدين');
      }
      setShowForm(false);
      loadDebts();
    } catch (err) { toastError('حدث خطأ'); }
    finally { setSaving(false); }
  }

  async function handlePayment(e) {
    e.preventDefault();
    const addAmount = Number(payAmount);
    if (!addAmount || addAmount <= 0) { toastError('أدخل مبلغاً صحيحاً'); return; }
    const current = Number(payDebt.paid || 0);
    const newPaid = current + addAmount;
    if (newPaid > Number(payDebt.amount)) { toastError('المبلغ يتجاوز الدين المتبقي'); return; }
    const { error } = await supabase.from('debts').update({ paid: newPaid }).eq('id', payDebt.id);
    if (error) toastError('فشل تسجيل الدفع');
    else { success(`✅ تم تسجيل دفع ${addAmount.toLocaleString()} ل.س`); setShowPayment(false); loadDebts(); }
  }

  async function handleDelete(d) {
    if (!confirm('هل تريد حذف الدين؟')) return;
    setDeleting(d.id);
    const { error } = await supabase.from('debts').delete().eq('id', d.id);
    if (error) toastError('فشل الحذف');
    else { success('🗑️ تم الحذف'); setDebts(prev => prev.filter(x => x.id !== d.id)); }
    setDeleting(null);
  }

  function getWaLink(d) {
    const remain = Number(d.amount) - Number(d.paid);
    if (remain <= 0) return null;
    const phone = (d.phone || '').replace(/[^0-9]/g, '');
    if (!phone) return null;
    const text = encodeURIComponent(`مرحباً ${d.customer_name || ''}،\nنذكرك بلطف بدين مستحق لمتجرنا بقيمة ${remain.toLocaleString()} ل.س.\nشكراً لتعاملك معنا 🙏`);
    return `https://wa.me/${phone}?text=${text}`;
  }

  if (loading) return <div style={{ padding: 80, textAlign: 'center' }}>⏳</div>;

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', paddingBottom: 80 }}>
      <div style={{ background: '#0f4d3a', padding: '16px 20px', position: 'sticky', top: 0, zIndex: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
          <Link href="/merchant" style={{ color: '#fff', textDecoration: 'none', fontSize: 20 }}>→</Link>
          <h1 style={{ color: '#fff', fontSize: 18, fontWeight: 900, margin: 0, flex: 1 }}>💰 الديون</h1>
          <button onClick={openAdd} style={{ background: '#fbbf24', color: '#0f4d3a', border: 'none', padding: '8px 14px', borderRadius: 10, fontSize: 12, fontWeight: 900, cursor: 'pointer', fontFamily: 'inherit' }}>+ جديد</button>
        </div>
        <input type="search" placeholder="🔍 ابحث بالاسم أو الهاتف..." value={search} onChange={e => setSearch(e.target.value)} style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: 'none', fontSize: 13, outline: 'none', boxSizing: 'border-box', background: 'rgba(255,255,255,0.95)' }} />
        <div style={{ display: 'flex', gap: 6, marginTop: 12, overflowX: 'auto' }}>
          {FILTERS.map(f => (
            <button key={f.key} onClick={() => setFilter(f.key)} style={{ background: filter === f.key ? '#fff' : 'rgba(255,255,255,0.1)', color: filter === f.key ? '#0f4d3a' : '#fff', border: 'none', padding: '6px 14px', borderRadius: 20, fontSize: 12, fontWeight: 900, cursor: 'pointer', whiteSpace: 'nowrap', fontFamily: 'inherit' }}>
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <div style={{ padding: 16 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 16 }}>
          <StatBox label="إجمالي" value={stats.total.toLocaleString()} color="#0f4d3a" />
          <StatBox label="المتبقي" value={stats.remaining.toLocaleString()} color="#ef4444" />
          <StatBox label="المسدد" value={stats.paid.toLocaleString()} color="#10b981" />
        </div>

        {filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 40, background: '#fff', borderRadius: 16, color: '#64748b' }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>💰</div>
            <div style={{ fontSize: 15, fontWeight: 900, marginBottom: 8 }}>
              {debts.length === 0 ? 'لا توجد ديون مسجلة' : 'لا توجد نتائج مطابقة'}
            </div>
            {debts.length === 0 && (
              <button onClick={openAdd} style={{ display: 'inline-block', background: '#0f4d3a', color: '#fff', padding: '10px 20px', borderRadius: 10, border: 'none', fontSize: 13, fontWeight: 900, cursor: 'pointer', fontFamily: 'inherit' }}>+ أضف أول دين</button>
            )}
          </div>
        ) : (
          filtered.map(debt => {
            const amt = Number(debt.amount || 0);
            const pd = Number(debt.paid || 0);
            const remain = amt - pd;
            const percent = amt > 0 ? Math.round((pd / amt) * 100) : 0;
            const status = getStatus(debt);
            const isExpanded = expandedId === debt.id;
            const waLink = getWaLink(debt);
            const statusColors = {
              active: { bg: 'rgba(239,68,68,0.1)', color: '#ef4444', label: 'مستحق' },
              partial: { bg: 'rgba(245,158,11,0.1)', color: '#f59e0b', label: 'مسدد جزئياً' },
              paid: { bg: 'rgba(16,185,129,0.1)', color: '#10b981', label: 'مسدد' },
            };
            const st = statusColors[status];
            return (
              <div key={debt.id} style={{ background: '#fff', borderRadius: 16, marginBottom: 12, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
                <div style={{ padding: 14, display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }} onClick={() => setExpandedId(isExpanded ? null : debt.id)}>
                  <div style={{ position: 'relative', width: 48, height: 48, flexShrink: 0 }}>
                    <svg width="48" height="48" style={{ transform: 'rotate(-90deg)' }}>
                      <circle cx="24" cy="24" r="20" fill="none" stroke="#f1f5f9" strokeWidth="4" />
                      <circle cx="24" cy="24" r="20" fill="none" stroke={status === 'paid' ? '#10b981' : '#0f4d3a'} strokeWidth="4" strokeDasharray={`${(percent / 100) * 125.6} 125.6`} strokeLinecap="round" />
                    </svg>
                    <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 900, color: '#0f4d3a' }}>{percent}%</div>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 900, color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{debt.customer_name || 'بدون اسم'}</div>
                    <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>{debt.phone || '—'}</div>
                  </div>
                  <div style={{ textAlign: 'left' }}>
                    <div style={{ fontSize: 15, fontWeight: 900, color: remain > 0 ? '#ef4444' : '#10b981' }}>{remain > 0 ? remain.toLocaleString() : '✓'}</div>
                    <div style={{ background: st.bg, color: st.color, padding: '2px 8px', borderRadius: 6, fontSize: 9.5, fontWeight: 900, marginTop: 4, display: 'inline-block' }}>{st.label}</div>
                  </div>
                </div>
                {isExpanded && (
                  <div style={{ padding: '0 14px 14px', borderTop: '1px solid #f1f5f9', paddingTop: 14 }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 12 }}>
                      <MiniStat label="المبلغ" value={amt.toLocaleString()} color="#0f172a" />
                      <MiniStat label="المدفوع" value={pd.toLocaleString()} color="#10b981" />
                      <MiniStat label="المتبقي" value={remain.toLocaleString()} color="#ef4444" />
                    </div>
                    {debt.notes && <div style={{ padding: 10, background: 'rgba(251,191,36,0.1)', borderRadius: 8, fontSize: 11, color: '#92400e', marginBottom: 12, border: '1px solid rgba(251,191,36,0.3)' }}><strong>📝 ملاحظات:</strong> {debt.notes}</div>}
                    <div style={{ fontSize: 10, color: '#94a3b8', marginBottom: 12 }}>تاريخ: {debt.created_at ? new Date(debt.created_at).toLocaleDateString('ar-SY') : '—'}</div>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      {remain > 0 && (
                        <button onClick={() => openPayment(debt)} style={{ flex: '1 1 100%', padding: 12, background: 'linear-gradient(135deg, #10b981, #059669)', color: '#fff', border: 'none', borderRadius: 10, fontSize: 13, fontWeight: 900, cursor: 'pointer', fontFamily: 'inherit' }}>💵 تسجيل دفع</button>
                      )}
                      {waLink && <a href={waLink} target="_blank" rel="noreferrer" style={{ flex: 1, textAlign: 'center', padding: 10, background: 'rgba(37,211,102,0.1)', color: '#25D366', borderRadius: 8, textDecoration: 'none', fontSize: 12, fontWeight: 900, border: '1px solid rgba(37,211,102,0.3)' }}>💬 تذكير</a>}
                      <button onClick={() => openEdit(debt)} style={{ flex: 1, padding: 10, background: 'rgba(245,158,11,0.1)', color: '#f59e0b', borderRadius: 8, border: '1px solid rgba(245,158,11,0.3)', fontSize: 12, fontWeight: 900, cursor: 'pointer', fontFamily: 'inherit' }}>✏️ تعديل</button>
                      <button onClick={() => handleDelete(debt)} disabled={deleting === debt.id} style={{ flex: 1, padding: 10, background: 'rgba(239,68,68,0.1)', color: '#ef4444', borderRadius: 8, border: '1px solid rgba(239,68,68,0.3)', fontSize: 12, fontWeight: 900, cursor: deleting === debt.id ? 'wait' : 'pointer', fontFamily: 'inherit' }}>{deleting === debt.id ? '⏳' : '🗑️ حذف'}</button>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      <button onClick={openAdd} style={{ position: 'fixed', bottom: 20, left: 20, right: 20, background: 'linear-gradient(135deg, #10b981, #059669)', color: '#fff', padding: 16, borderRadius: 14, border: 'none', fontSize: 15, fontWeight: 900, boxShadow: '0 10px 30px rgba(16,185,129,0.4)', cursor: 'pointer', fontFamily: 'inherit', zIndex: 30 }}>+ إضافة دين جديد</button>

      {showForm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 100, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
          <div style={{ background: '#fff', width: '100%', maxWidth: 500, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h2 style={{ fontSize: 18, fontWeight: 900, margin: 0 }}>{editDebt ? '✏️ تعديل الدين' : '💰 دين جديد'}</h2>
              <button onClick={() => setShowForm(false)} style={{ background: '#f1f5f9', border: 'none', width: 32, height: 32, borderRadius: '50%', fontSize: 16, cursor: 'pointer' }}>✕</button>
            </div>
            <form onSubmit={handleSave}>
              <div style={{ marginBottom: 12 }}>
                <label style={labelStyle}>اسم العميل *</label>
                <input value={form.customer_name} onChange={e => setForm({ ...form, customer_name: e.target.value })} required style={inputStyle} placeholder="اسم العميل" />
              </div>
              <div style={{ marginBottom: 12 }}>
                <label style={labelStyle}>رقم الهاتف</label>
                <input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} type="tel" style={inputStyle} placeholder="09xxxxxxxx" />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 12 }}>
                <div>
                  <label style={labelStyle}>المبلغ الإجمالي *</label>
                  <input value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} type="number" required style={inputStyle} placeholder="0" />
                </div>
                <div>
                  <label style={labelStyle}>المدفوع</label>
                  <input value={form.paid} onChange={e => setForm({ ...form, paid: e.target.value })} type="number" style={inputStyle} placeholder="0" />
                </div>
              </div>
              <div style={{ marginBottom: 16 }}>
                <label style={labelStyle}>ملاحظات</label>
                <textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} style={{ ...inputStyle, height: 60, resize: 'none' }} placeholder="تفاصيل إضافية..." />
              </div>
              <button type="submit" disabled={saving} style={{ width: '100%', padding: 14, background: saving ? '#94a3b8' : '#0f4d3a', color: '#fff', border: 'none', borderRadius: 10, fontWeight: 900, fontSize: 15, cursor: saving ? 'wait' : 'pointer', fontFamily: 'inherit' }}>
                {saving ? '⏳' : (editDebt ? 'حفظ التغييرات' : 'إضافة الدين')}
              </button>
            </form>
          </div>
        </div>
      )}

      {showPayment && payDebt && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 100, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
          <div style={{ background: '#fff', width: '100%', maxWidth: 500, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h2 style={{ fontSize: 18, fontWeight: 900, margin: 0 }}>💵 تسجيل دفع</h2>
              <button onClick={() => setShowPayment(false)} style={{ background: '#f1f5f9', border: 'none', width: 32, height: 32, borderRadius: '50%', fontSize: 16, cursor: 'pointer' }}>✕</button>
            </div>
            <div style={{ background: '#f8fafc', borderRadius: 10, padding: 12, marginBottom: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}><span style={{ color: '#64748b' }}>العميل</span><strong>{payDebt.customer_name}</strong></div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}><span style={{ color: '#64748b' }}>الدين الكلي</span><strong>{Number(payDebt.amount).toLocaleString()} ل.س</strong></div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}><span style={{ color: '#64748b' }}>المدفوع</span><strong style={{ color: '#10b981' }}>{Number(payDebt.paid).toLocaleString()} ل.س</strong></div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, paddingTop: 8, marginTop: 8, borderTop: '1px solid #e2e8f0' }}><span style={{ color: '#ef4444', fontWeight: 900 }}>المتبقي</span><strong style={{ color: '#ef4444' }}>{(Number(payDebt.amount) - Number(payDebt.paid)).toLocaleString()} ل.س</strong></div>
            </div>
            <form onSubmit={handlePayment}>
              <label style={labelStyle}>المبلغ المسدد</label>
              <input value={payAmount} onChange={e => setPayAmount(e.target.value)} type="number" required style={inputStyle} placeholder="0" autoFocus />
              <button type="submit" style={{ width: '100%', padding: 14, background: 'linear-gradient(135deg, #10b981, #059669)', color: '#fff', border: 'none', borderRadius: 10, fontWeight: 900, fontSize: 15, cursor: 'pointer', fontFamily: 'inherit', marginTop: 16 }}>💵 تأكيد الدفع</button>
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
      <div style={{ fontSize: 15, fontWeight: 900, color, marginBottom: 2 }}>{value}</div>
      <div style={{ fontSize: 9.5, color: '#64748b', fontWeight: 800 }}>{label}</div>
    </div>
  );
}

function MiniStat({ label, value, color }) {
  return (
    <div style={{ background: '#f8fafc', borderRadius: 8, padding: 8, textAlign: 'center' }}>
      <div style={{ fontSize: 12, fontWeight: 900, color }}>{value}</div>
      <div style={{ fontSize: 9, color: '#64748b', fontWeight: 800, marginTop: 2 }}>{label}</div>
    </div>
  );
}

const labelStyle = { display: 'block', fontSize: 12, fontWeight: 800, color: '#475569', marginBottom: 6 };
const inputStyle = { width: '100%', padding: '12px 14px', borderRadius: 10, border: '1px solid #cbd5e1', fontSize: 14, fontFamily: 'inherit', boxSizing: 'border-box', outline: 'none', background: '#f8fafc' };
