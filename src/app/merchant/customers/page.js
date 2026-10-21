'use client';
import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { useCurrentUser } from '@/lib/useCurrentUser';
import { useToast } from '@/components/Toast';
import Link from 'next/link';

export default function MerchantCustomersPage() {
  const { success, error: toastError } = useToast();
  const { user, loading: userLoading, dataOwnerName } = useCurrentUser();

  const [customers, setCustomers] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Modals
  const [showAdd, setShowAdd] = useState(false);
  const [editCustomer, setEditCustomer] = useState(null);
  const [expandedId, setExpandedId] = useState(null);
  const [deleting, setDeleting] = useState(null);

  // Forms
  const [form, setForm] = useState({ name: '', phone: '', address: '', notes: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (userLoading) return;
    if (!user || !dataOwnerName) { setLoading(false); return; }
    loadAll();
  }, [user, userLoading, dataOwnerName]);

  async function loadAll() {
    if (!supabase || !dataOwnerName) return;
    try {
      const [cRes, oRes] = await Promise.all([
        supabase.from('customers').select('*').eq('entity_name', dataOwnerName).order('created_at', { ascending: false }),
        supabase.from('orders').select('*').eq('provider_name', dataOwnerName),
      ]);
      setCustomers(cRes.data || []);
      setOrders(oRes.data || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }

  // حساب إحصائيات كل عميل من الطلبات
  const customerStats = useMemo(() => {
    const map = {};
    orders.forEach(o => {
      const key = o.customer_phone;
      if (!key) return;
      if (!map[key]) map[key] = { count: 0, total: 0 };
      map[key].count++;
      if (o.status !== 'cancelled') map[key].total += Number(o.total || 0);
    });
    return map;
  }, [orders]);

  const stats = useMemo(() => {
    const total = customers.length;
    const thisMonth = customers.filter(c => {
      if (!c.created_at) return false;
      const d = new Date(c.created_at);
      const now = new Date();
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    }).length;
    const active = customers.filter(c => customerStats[c.phone]?.count > 0).length;
    return { total, thisMonth, active };
  }, [customers, customerStats]);

  const filtered = useMemo(() => {
    if (!search.trim()) return customers;
    const q = search.trim().toLowerCase();
    return customers.filter(c =>
      (c.name || '').toLowerCase().includes(q) ||
      (c.phone || '').includes(q)
    );
  }, [customers, search]);

  function openAdd() {
    setForm({ name: '', phone: '', address: '', notes: '' });
    setEditCustomer(null);
    setShowAdd(true);
  }

  function openEdit(c) {
    setForm({ name: c.name || '', phone: c.phone || '', address: c.address || '', notes: c.notes || '' });
    setEditCustomer(c);
    setShowAdd(true);
  }

  async function handleSave(e) {
    e.preventDefault();
    if (!form.name.trim() || !form.phone.trim()) {
      toastError('الاسم والهاتف مطلوبان');
      return;
    }
    setSaving(true);
    try {
      if (editCustomer) {
        const { error } = await supabase.from('customers').update({
          name: form.name, phone: form.phone, address: form.address, notes: form.notes
        }).eq('id', editCustomer.id);
        if (error) throw error;
        success('✅ تم تحديث بيانات العميل');
      } else {
        const { error } = await supabase.from('customers').insert({
          name: form.name, phone: form.phone, address: form.address, notes: form.notes, entity_name: dataOwnerName
        });
        if (error) throw error;
        success('✅ تمت إضافة العميل');
      }
      setShowAdd(false);
      loadAll();
    } catch (err) {
      toastError('حدث خطأ، تأكد من البيانات');
    } finally { setSaving(false); }
  }

  async function handleDelete(c) {
    if (!confirm(`هل تريد حذف العميل "${c.name}" نهائياً؟`)) return;
    setDeleting(c.id);
    const { error } = await supabase.from('customers').delete().eq('id', c.id);
    if (error) {
      toastError('فشل الحذف');
    } else {
      success('🗑️ تم الحذف');
      setCustomers(prev => prev.filter(x => x.id !== c.id));
    }
    setDeleting(null);
  }

  if (loading) return <div style={{ padding: 80, textAlign: 'center' }}>⏳</div>;

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', paddingBottom: 80 }}>
      
      {/* Header */}
      <div style={{ background: '#0f4d3a', padding: '16px 20px', position: 'sticky', top: 0, zIndex: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
          <Link href="/merchant" style={{ color: '#fff', textDecoration: 'none', fontSize: 20 }}>→</Link>
          <h1 style={{ color: '#fff', fontSize: 18, fontWeight: 900, margin: 0, flex: 1 }}>👥 العملاء</h1>
          <button onClick={openAdd} style={{ background: '#fbbf24', color: '#0f4d3a', border: 'none', padding: '8px 14px', borderRadius: 10, fontSize: 12, fontWeight: 900, cursor: 'pointer', fontFamily: 'inherit' }}>+ جديد</button>
        </div>
        <input
          type="search"
          placeholder="🔍 ابحث بالاسم أو الهاتف..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: 'none', fontSize: 13, outline: 'none', boxSizing: 'border-box', background: 'rgba(255,255,255,0.95)' }}
        />
      </div>

      <div style={{ padding: 16 }}>
        
        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 16 }}>
          <StatBox label="الكل" value={stats.total} color="#0f4d3a" />
          <StatBox label="هذا الشهر" value={stats.thisMonth} color="#3b82f6" />
          <StatBox label="لديهم طلبات" value={stats.active} color="#10b981" />
        </div>

        {/* Customers List */}
        {filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 40, background: '#fff', borderRadius: 16, color: '#64748b' }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>👥</div>
            <div style={{ fontSize: 15, fontWeight: 900, marginBottom: 8 }}>
              {customers.length === 0 ? 'لا يوجد عملاء بعد' : 'لا توجد نتائج مطابقة'}
            </div>
            {customers.length === 0 && (
              <button onClick={openAdd} style={{ display: 'inline-block', background: '#0f4d3a', color: '#fff', padding: '10px 20px', borderRadius: 10, border: 'none', fontSize: 13, fontWeight: 900, cursor: 'pointer', fontFamily: 'inherit' }}>+ أضف أول عميل</button>
            )}
          </div>
        ) : (
          filtered.map(customer => {
            const cStats = customerStats[customer.phone] || { count: 0, total: 0 };
            const isExpanded = expandedId === customer.id;
            return (
              <div key={customer.id} style={{ background: '#fff', borderRadius: 16, marginBottom: 12, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
                
                {/* Header Row */}
                <div style={{ padding: 14, display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }} onClick={() => setExpandedId(isExpanded ? null : customer.id)}>
                  <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'linear-gradient(135deg, #0f4d3a, #075640)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 900, flexShrink: 0 }}>
                    {(customer.name || '؟').charAt(0)}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 900, color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{customer.name || 'بدون اسم'}</div>
                    <div style={{ fontSize: 12, color: '#64748b', marginTop: 2, fontFamily: 'monospace' }}>{customer.phone || '—'}</div>
                  </div>
                  <div style={{ textAlign: 'left' }}>
                    <div style={{ fontSize: 13, fontWeight: 900, color: '#0f4d3a' }}>{cStats.total.toLocaleString()}</div>
                    <div style={{ fontSize: 10, color: '#64748b', fontWeight: 800 }}>{cStats.count} طلب</div>
                  </div>
                </div>

                {/* Expanded Details */}
                {isExpanded && (
                  <div style={{ padding: '0 14px 14px', borderTop: '1px solid #f1f5f9', paddingTop: 14 }}>
                    {customer.address && (
                      <div style={{ fontSize: 12, color: '#475569', marginBottom: 8 }}>
                        <strong>📍 العنوان:</strong> {customer.address}
                      </div>
                    )}
                    {customer.notes && (
                      <div style={{ fontSize: 12, color: '#475569', marginBottom: 8 }}>
                        <strong>📝 ملاحظات:</strong> {customer.notes}
                      </div>
                    )}
                    <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 12 }}>
                      مسجل منذ: {new Date(customer.created_at).toLocaleDateString('ar-SY')}
                    </div>

                    <div style={{ display: 'flex', gap: 6 }}>
                      <a href={`https://wa.me/${(customer.phone || '').replace(/[^0-9]/g, '')}`} target="_blank" rel="noreferrer" style={{ flex: 1, textAlign: 'center', padding: 10, background: 'rgba(37,211,102,0.1)', color: '#25D366', borderRadius: 8, textDecoration: 'none', fontSize: 12, fontWeight: 900, border: '1px solid rgba(37,211,102,0.3)' }}>💬 واتساب</a>
                      <a href={`tel:${customer.phone}`} style={{ flex: 1, textAlign: 'center', padding: 10, background: 'rgba(59,130,246,0.1)', color: '#2563eb', borderRadius: 8, textDecoration: 'none', fontSize: 12, fontWeight: 900, border: '1px solid rgba(59,130,246,0.3)' }}>📞 اتصال</a>
                      <button onClick={() => openEdit(customer)} style={{ flex: 1, padding: 10, background: 'rgba(245,158,11,0.1)', color: '#f59e0b', borderRadius: 8, border: '1px solid rgba(245,158,11,0.3)', fontSize: 12, fontWeight: 900, cursor: 'pointer', fontFamily: 'inherit' }}>✏️ تعديل</button>
                      <button onClick={() => handleDelete(customer)} disabled={deleting === customer.id} style={{ flex: 1, padding: 10, background: 'rgba(239,68,68,0.1)', color: '#ef4444', borderRadius: 8, border: '1px solid rgba(239,68,68,0.3)', fontSize: 12, fontWeight: 900, cursor: deleting === customer.id ? 'wait' : 'pointer', fontFamily: 'inherit' }}>
                        {deleting === customer.id ? '⏳' : '🗑️ حذف'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Floating Add */}
      <button onClick={openAdd} style={{
        position: 'fixed', bottom: 20, left: 20, right: 20,
        background: 'linear-gradient(135deg, #10b981, #059669)',
        color: '#fff', padding: 16, borderRadius: 14,
        border: 'none', fontSize: 15, fontWeight: 900,
        boxShadow: '0 10px 30px rgba(16,185,129,0.4)',
        cursor: 'pointer', fontFamily: 'inherit', zIndex: 30
      }}>
        + إضافة عميل جديد
      </button>

      {/* Add/Edit Modal */}
      {showAdd && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 100, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
          <div style={{ background: '#fff', width: '100%', maxWidth: 500, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h2 style={{ fontSize: 18, fontWeight: 900, margin: 0 }}>{editCustomer ? '✏️ تعديل عميل' : '👤 عميل جديد'}</h2>
              <button onClick={() => setShowAdd(false)} style={{ background: '#f1f5f9', border: 'none', width: 32, height: 32, borderRadius: '50%', fontSize: 16, cursor: 'pointer' }}>✕</button>
            </div>
            <form onSubmit={handleSave}>
              <div style={{ marginBottom: 12 }}>
                <label style={labelStyle}>الاسم *</label>
                <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required style={inputStyle} placeholder="اسم العميل" />
              </div>
              <div style={{ marginBottom: 12 }}>
                <label style={labelStyle}>الهاتف *</label>
                <input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} required type="tel" style={inputStyle} placeholder="09xxxxxxxx" />
              </div>
              <div style={{ marginBottom: 12 }}>
                <label style={labelStyle}>العنوان</label>
                <textarea value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} style={{ ...inputStyle, height: 60, resize: 'none' }} placeholder="الحي، الشارع..." />
              </div>
              <div style={{ marginBottom: 16 }}>
                <label style={labelStyle}>ملاحظات</label>
                <textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} style={{ ...inputStyle, height: 60, resize: 'none' }} placeholder="ملاحظات داخلية..." />
              </div>
              <button type="submit" disabled={saving} style={{ width: '100%', padding: 14, background: saving ? '#94a3b8' : '#0f4d3a', color: '#fff', border: 'none', borderRadius: 10, fontWeight: 900, fontSize: 15, cursor: saving ? 'wait' : 'pointer', fontFamily: 'inherit' }}>
                {saving ? '⏳ جارٍ الحفظ...' : (editCustomer ? 'حفظ التغييرات' : 'إضافة العميل')}
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
      <div style={{ fontSize: 20, fontWeight: 900, color, marginBottom: 2 }}>{value}</div>
      <div style={{ fontSize: 10, color: '#64748b', fontWeight: 800 }}>{label}</div>
    </div>
  );
}

const labelStyle = { display: 'block', fontSize: 12, fontWeight: 800, color: '#475569', marginBottom: 6 };
const inputStyle = { width: '100%', padding: '12px 14px', borderRadius: 10, border: '1px solid #cbd5e1', fontSize: 14, fontFamily: 'inherit', boxSizing: 'border-box', outline: 'none', background: '#f8fafc' };
