'use client';
import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { useCurrentUser } from '@/lib/useCurrentUser';
import { useToast } from '@/components/Toast';

export default function InternetInvoicesPage() {
  const router = useRouter();
  const { success, error: toastError } = useToast();
  const { user, loading: userLoading, dataOwnerName } = useCurrentUser();

  const [entityId, setEntityId] = useState(null);
  const [invoices, setInvoices] = useState([]);
  const [subs, setSubs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ subscriber_id: '', amount: '', due_date: '', notes: '' });
  const [saving, setSaving] = useState(false);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    if (userLoading) return;
    if (!user || !dataOwnerName) { setLoading(false); return; }
    const stored = JSON.parse(localStorage.getItem('sanad_entity') || 'null');
    if (stored?.parent_entity_id) setEntityId(stored.parent_entity_id);
    else if (dataOwnerName) supabase.from('entities').select('id').eq('display_name', dataOwnerName).maybeSingle().then(({ data }) => { if (data) setEntityId(data.id); });
    loadAll();
  }, [user, userLoading, dataOwnerName]);

  async function loadAll() {
    if (!supabase || !dataOwnerName) return;
    setLoading(true);
    try {
      const [iRes, sRes] = await Promise.all([
        supabase.from('internet_invoices').select('*').eq('provider_name', dataOwnerName).order('created_at', { ascending: false }),
        supabase.from('internet_subscribers').select('id, name, phone').eq('provider_name', dataOwnerName),
      ]);
      setInvoices(iRes.data || []);
      setSubs(sRes.data || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }

  function openAdd() {
    setForm({ subscriber_id: '', amount: '', due_date: '', notes: '' });
    setShowForm(true);
  }

  async function saveInvoice(e) {
    e.preventDefault();
    if (!form.subscriber_id || !form.amount) { toastError('المشترك والمبلغ مطلوبان'); return; }
    setSaving(true);
    try {
      const payload = {
        entity_id: entityId, provider_name: dataOwnerName,
        subscriber_id: form.subscriber_id, amount: Number(form.amount),
        due_date: form.due_date || null, status: 'unpaid', notes: form.notes.trim() || null,
      };
      const { error } = await supabase.from('internet_invoices').insert(payload);
      if (error) throw error;
      success('🎉 تم إنشاء الفاتورة');
      setShowForm(false);
      loadAll();
    } catch (err) { console.error(err); toastError('فشل الإنشاء'); }
    finally { setSaving(false); }
  }

  async function markPaid(inv) {
    const { error } = await supabase.from('internet_invoices').update({ status: 'paid', paid_at: new Date().toISOString() }).eq('id', inv.id);
    if (!error) { success('✅ تم التحصيل'); setInvoices(prev => prev.map(x => x.id === inv.id ? { ...x, status: 'paid', paid_at: new Date().toISOString() } : x)); }
  }

  async function deleteInvoice(inv) {
    if (!confirm('حذف الفاتورة؟')) return;
    const { error } = await supabase.from('internet_invoices').delete().eq('id', inv.id);
    if (!error) { success('🗑️ تم الحذف'); setInvoices(prev => prev.filter(x => x.id !== inv.id)); }
  }

  const filtered = useMemo(() => {
    let list = invoices;
    if (filter !== 'all') list = list.filter(i => i.status === filter);
    return list;
  }, [invoices, filter]);

  const stats = useMemo(() => {
    const total = invoices.reduce((s, i) => s + Number(i.amount || 0), 0);
    const paid = invoices.filter(i => i.status === 'paid').reduce((s, i) => s + Number(i.amount || 0), 0);
    const unpaid = total - paid;
    return { total, paid, unpaid };
  }, [invoices]);

  function getSubName(id) { return subs.find(s => s.id === id)?.name || '—'; }

  if (userLoading || loading) return <div style={{ padding: 80, textAlign: 'center' }}>⏳</div>;

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', paddingBottom: 100 }}>
      <div style={{ background: '#0f4d3a', padding: '16px 20px', position: 'sticky', top: 0, zIndex: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
          <Link href="/merchant" style={{ color: '#fff', textDecoration: 'none', fontSize: 20 }}>←</Link>
          <div style={{ flex: 1 }}>
            <h1 style={{ color: '#fff', fontSize: 18, fontWeight: 900, margin: 0 }}>💰 الفواتير</h1>
            <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: 11, marginTop: 2 }}>{dataOwnerName}</div>
          </div>
          <button onClick={openAdd} style={{ background: '#fbbf24', color: '#0f4d3a', border: 'none', padding: '8px 14px', borderRadius: 10, fontSize: 12, fontWeight: 900, cursor: 'pointer', fontFamily: 'inherit' }}>+ فاتورة</button>
        </div>
        <div style={{ display: 'flex', gap: 6, overflowX: 'auto' }}>
          {['all', 'paid', 'unpaid'].map(f => (
            <button key={f} onClick={() => setFilter(f)} style={{ background: filter === f ? '#fff' : 'rgba(255,255,255,0.1)', color: filter === f ? '#0f4d3a' : '#fff', border: 'none', padding: '6px 14px', borderRadius: 20, fontSize: 11, fontWeight: 900, cursor: 'pointer', fontFamily: 'inherit' }}>
              {f === 'all' ? 'الكل' : f === 'paid' ? 'مدفوعة' : 'غير مدفوعة'}
            </button>
          ))}
        </div>
      </div>

      <div style={{ display: 'flex', gap: 6, padding: '10px 16px', background: '#fff', borderBottom: '1px solid #e2e8f0', overflowX: 'auto' }}>
        <Link href="/merchant/internet/plans" style={navStyle(false)}>📡 الخطط</Link>
        <Link href="/merchant/internet/subscribers" style={navStyle(false)}>👥 المشتركون</Link>
        <Link href="/merchant/internet/invoices" style={navStyle(true)}>💰 الفواتير</Link>
        <Link href="/merchant/internet/tickets" style={navStyle(false)}>🎫 التذاكر</Link>
      </div>

      <div style={{ padding: 16, maxWidth: 700, margin: '0 auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 16 }}>
          <StatBox label="الإجمالي" value={stats.total.toLocaleString()} color="#0f4d3a" />
          <StatBox label="المحصّل" value={stats.paid.toLocaleString()} color="#10b981" />
          <StatBox label="المتبقي" value={stats.unpaid.toLocaleString()} color="#ef4444" />
        </div>

        {filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 40, background: '#fff', borderRadius: 16, color: '#64748b' }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>💰</div>
            <div style={{ fontSize: 15, fontWeight: 900, marginBottom: 8 }}>{invoices.length === 0 ? 'لا توجد فواتير' : 'لا نتائج'}</div>
            {invoices.length === 0 && <button onClick={openAdd} style={{ background: '#0f4d3a', color: '#fff', padding: '10px 20px', borderRadius: 10, border: 'none', fontSize: 13, fontWeight: 900, cursor: 'pointer', fontFamily: 'inherit' }}>+ إنشاء فاتورة</button>}
          </div>
        ) : filtered.map(inv => (
          <div key={inv.id} style={{ background: '#fff', borderRadius: 14, padding: 14, marginBottom: 10, border: '1px solid #e2e8f0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 900, color: '#0f172a' }}>👤 {getSubName(inv.subscriber_id)}</div>
                <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>📅 {new Date(inv.created_at).toLocaleDateString('ar-SY')}</div>
                {inv.due_date && <div style={{ fontSize: 11, color: '#f59e0b', marginTop: 2 }}>⏰ مستحقة: {new Date(inv.due_date).toLocaleDateString('ar-SY')}</div>}
              </div>
              <div style={{ background: inv.status === 'paid' ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)', color: inv.status === 'paid' ? '#10b981' : '#ef4444', padding: '4px 10px', borderRadius: 8, fontSize: 10, fontWeight: 900 }}>
                {inv.status === 'paid' ? '✅ مدفوعة' : '⏳ غير مدفوعة'}
              </div>
            </div>
            <div style={{ fontSize: 20, fontWeight: 900, color: '#0f4d3a', marginBottom: 8 }}>{Number(inv.amount).toLocaleString()} ل.س</div>
            <div style={{ display: 'flex', gap: 6 }}>
              {inv.status !== 'paid' && <button onClick={() => markPaid(inv)} style={btnStyle('rgba(16,185,129,0.1)', '#10b981')}>✅ تحصيل</button>}
              <button onClick={() => deleteInvoice(inv)} style={btnStyle('rgba(239,68,68,0.1)', '#ef4444')}>🗑️</button>
            </div>
          </div>
        ))}
      </div>

      {showForm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 100, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
          <div style={{ background: '#fff', width: '100%', maxWidth: 500, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24 }}>
            <h2 style={{ fontSize: 18, fontWeight: 900, margin: '0 0 20px' }}>💰 فاتورة جديدة</h2>
            <form onSubmit={saveInvoice}>
              <div style={{ marginBottom: 12 }}><label style={labelStyle}>المشترك *</label><select value={form.subscriber_id} onChange={e => setForm({ ...form, subscriber_id: e.target.value })} required style={inputStyle}><option value="">— اختر مشتركاً —</option>{subs.map(s => <option key={s.id} value={s.id}>{s.name} ({s.phone})</option>)}</select></div>
              <div style={{ marginBottom: 12 }}><label style={labelStyle}>المبلغ (ل.س) *</label><input type="number" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} required style={inputStyle} /></div>
              <div style={{ marginBottom: 12 }}><label style={labelStyle}>تاريخ الاستحقاق</label><input type="date" value={form.due_date} onChange={e => setForm({ ...form, due_date: e.target.value })} style={inputStyle} /></div>
              <div style={{ marginBottom: 20 }}><label style={labelStyle}>ملاحظات</label><textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} style={{ ...inputStyle, height: 60, resize: 'none' }} /></div>
              <button type="submit" disabled={saving} style={{ width: '100%', padding: 14, background: '#0f4d3a', color: '#fff', border: 'none', borderRadius: 10, fontWeight: 900, fontSize: 15, cursor: 'pointer', fontFamily: 'inherit' }}>{saving ? '⏳ جارٍ الحفظ...' : '💾 إنشاء'}</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function StatBox({ label, value, color }) { return <div style={{ background: '#fff', borderRadius: 12, padding: 12, textAlign: 'center', border: '1px solid #e2e8f0' }}><div style={{ fontSize: 16, fontWeight: 900, color, marginBottom: 2 }}>{value}</div><div style={{ fontSize: 9.5, color: '#64748b', fontWeight: 800 }}>{label}</div></div>; }
function navStyle(active) { return { background: active ? '#0f4d3a' : '#fff', color: active ? '#fff' : '#64748b', border: active ? '1px solid #0f4d3a' : '1px solid #e2e8f0', padding: '8px 14px', borderRadius: 20, fontSize: 12, fontWeight: 900, textDecoration: 'none', whiteSpace: 'nowrap' }; }
const btnStyle = (bg, color) => ({ flex: 1, padding: 10, background: bg, color, border: 'none', borderRadius: 8, fontSize: 12, fontWeight: 900, cursor: 'pointer', fontFamily: 'inherit' });
const labelStyle = { display: 'block', fontSize: 12, fontWeight: 800, color: '#475569', marginBottom: 6 };
const inputStyle = { width: '100%', padding: '12px 14px', borderRadius: 10, border: '1px solid #cbd5e1', fontSize: 14, fontFamily: 'inherit', boxSizing: 'border-box', outline: 'none', background: '#f8fafc' };
