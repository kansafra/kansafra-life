'use client';
import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/components/Toast';

const TABS = [
  { key: 'customers', label: '🛒 الزبائن', icon: '🛒' },
  { key: 'entities', label: '🏪 التجار', icon: '🏪' },
  { key: 'employees', label: '👥 الموظفون', icon: '👥' },
];

export default function AdminUsersPage() {
  const router = useRouter();
  const { success, error: toastError } = useToast();

  const [tab, setTab] = useState('customers');
  const [customers, setCustomers] = useState([]);
  const [entities, setEntities] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [ordersCount, setOrdersCount] = useState({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [working, setWorking] = useState(null);
  const [detail, setDetail] = useState(null);

  useEffect(() => {
    const admin = JSON.parse(localStorage.getItem('sanad_admin') || 'null');
    if (!admin) { router.replace('/admin/login'); return; }
    loadAll();
  }, [router]);

  async function loadAll() {
    if (!supabase) return;
    setLoading(true);
    try {
      const [cRes, eRes, empRes] = await Promise.all([
        supabase.from('customers').select('*').order('created_at', { ascending: false }),
        supabase.from('entities').select('*').order('created_at', { ascending: false }),
        supabase.from('employees').select('*').order('created_at', { ascending: false }),
      ]);
      setCustomers(cRes.data || []);
      setEntities(eRes.data || []);
      setEmployees(empRes.data || []);

      // إحصائيات الطلبات لكل زبون
      try {
        const { data: ords } = await supabase.from('orders').select('customer_id');
        const counts = {};
        (ords || []).forEach(o => {
          if (o.customer_id) counts[o.customer_id] = (counts[o.customer_id] || 0) + 1;
        });
        setOrdersCount(counts);
      } catch {}
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }

  async function suspendCustomer(cust) {
    if (!confirm(`حذف الزبون "${cust.name || cust.phone}" نهائياً؟ سيتم حذف بياناته فقط، طلباته تبقى.`)) return;
    setWorking(cust.id);
    const { error } = await supabase.from('customers').delete().eq('id', cust.id);
    if (!error) {
      success('🗑️ تم الحذف');
      setCustomers(prev => prev.filter(c => c.id !== cust.id));
    } else toastError('فشل الحذف');
    setWorking(null);
  }

  async function toggleEmployeeActive(emp) {
    const { error } = await supabase.from('employees').update({ is_active: !emp.is_active }).eq('id', emp.id);
    if (!error) {
      success(emp.is_active ? '⏸️ تم التعطيل' : '✅ تم التفعيل');
      setEmployees(prev => prev.map(e => e.id === emp.id ? { ...e, is_active: !e.is_active } : e));
    }
  }

  async function deleteEmployee(emp) {
    if (!confirm(`حذف الموظف "${emp.full_name}"؟`)) return;
    setWorking(emp.id);
    const { error } = await supabase.from('employees').delete().eq('id', emp.id);
    if (!error) { success('🗑️ تم الحذف'); setEmployees(prev => prev.filter(e => e.id !== emp.id)); }
    setWorking(null);
  }

  const stats = useMemo(() => ({
    customers: customers.length,
    registered: customers.filter(c => c.is_guest !== true).length,
    guests: customers.filter(c => c.is_guest === true).length,
    entities: entities.length,
    activeEntities: entities.filter(e => e.is_active !== false && e.approval_status === 'approved').length,
    employees: employees.length,
  }), [customers, entities, employees]);

  const filteredCustomers = useMemo(() => {
    if (!search.trim()) return customers;
    const q = search.trim().toLowerCase();
    return customers.filter(c =>
      (c.name || '').toLowerCase().includes(q) ||
      (c.phone || '').includes(q) ||
      (c.address || '').toLowerCase().includes(q)
    );
  }, [customers, search]);

  const filteredEntities = useMemo(() => {
    if (!search.trim()) return entities;
    const q = search.trim().toLowerCase();
    return entities.filter(e =>
      (e.display_name || '').toLowerCase().includes(q) ||
      (e.username || '').toLowerCase().includes(q) ||
      (e.phone || '').includes(q) ||
      (e.city || '').toLowerCase().includes(q)
    );
  }, [entities, search]);

  const filteredEmployees = useMemo(() => {
    if (!search.trim()) return employees;
    const q = search.trim().toLowerCase();
    return employees.filter(e =>
      (e.full_name || '').toLowerCase().includes(q) ||
      (e.username || '').toLowerCase().includes(q) ||
      (e.phone || '').includes(q) ||
      (e.entity_name || '').toLowerCase().includes(q)
    );
  }, [employees, search]);

  if (loading) return <div style={{ padding: 80, textAlign: 'center' }}>⏳</div>;

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', paddingBottom: 40 }}>
      <div style={{ background: '#0f172a', padding: '16px 20px', position: 'sticky', top: 0, zIndex: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
          <Link href="/admin" style={{ color: '#fff', textDecoration: 'none', fontSize: 20 }}>←</Link>
          <h1 style={{ color: '#fff', fontSize: 18, fontWeight: 900, margin: 0, flex: 1 }}>👥 إدارة المستخدمين</h1>
        </div>
        <input
          type="search"
          placeholder="🔍 ابحث بالاسم أو الهاتف..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: 'none', fontSize: 13, outline: 'none', boxSizing: 'border-box', background: 'rgba(255,255,255,0.95)', marginBottom: 12 }}
        />
        <div style={{ display: 'flex', gap: 6, overflowX: 'auto' }}>
          {TABS.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)} style={{ background: tab === t.key ? '#fff' : 'rgba(255,255,255,0.1)', color: tab === t.key ? '#0f172a' : '#fff', border: 'none', padding: '8px 14px', borderRadius: 20, fontSize: 12, fontWeight: 900, cursor: 'pointer', whiteSpace: 'nowrap', fontFamily: 'inherit' }}>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div style={{ padding: 16, maxWidth: 800, margin: '0 auto' }}>
        
        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 16 }}>
          <StatBox label="الزبائن" value={stats.customers} color="#3b82f6" />
          <StatBox label="التجار" value={stats.entities} color="#0f4d3a" />
          <StatBox label="الموظفون" value={stats.employees} color="#8b5cf6" />
        </div>

        {/* Customers Tab */}
        {tab === 'customers' && (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8, marginBottom: 16 }}>
              <StatBox label="مسجلون" value={stats.registered} color="#10b981" />
              <StatBox label="زوار" value={stats.guests} color="#f59e0b" />
            </div>
            {filteredCustomers.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 40, background: '#fff', borderRadius: 16, color: '#64748b' }}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>🛒</div>
                <div style={{ fontSize: 15, fontWeight: 900 }}>{customers.length === 0 ? 'لا يوجد زبائن مسجلون' : 'لا نتائج'}</div>
              </div>
            ) : filteredCustomers.map(c => (
              <div key={c.id} style={{ background: '#fff', borderRadius: 14, padding: 14, marginBottom: 10, border: '1px solid #e2e8f0' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
                  <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'linear-gradient(135deg, #3b82f6, #2563eb)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 900, flexShrink: 0 }}>
                    {(c.name || '؟').charAt(0)}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <div style={{ fontSize: 14, fontWeight: 900, color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.name || 'بدون اسم'}</div>
                      {c.is_guest === true && <span style={{ fontSize: 9, background: 'rgba(245,158,11,0.15)', color: '#f59e0b', padding: '2px 6px', borderRadius: 4, fontWeight: 900 }}>زائر</span>}
                    </div>
                    <div style={{ fontSize: 11, color: '#64748b', marginTop: 2, fontFamily: 'monospace' }}>📱 {c.phone || '—'}</div>
                    <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 2 }}>
                      🛒 {ordersCount[c.id] || 0} طلب · {c.created_at ? new Date(c.created_at).toLocaleDateString('ar-SY') : ''}
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button onClick={() => setDetail({ type: 'customer', data: c })} style={btnStyle('rgba(14,165,233,0.1)', '#0284c7')}>👁️ تفاصيل</button>
                  <button onClick={() => suspendCustomer(c)} disabled={working === c.id} style={btnStyle('rgba(239,68,68,0.1)', '#ef4444')}>{working === c.id ? '⏳' : '🗑️'}</button>
                </div>
              </div>
            ))}
          </>
        )}

        {/* Entities Tab */}
        {tab === 'entities' && (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8, marginBottom: 16 }}>
              <StatBox label="نشطون" value={stats.activeEntities} color="#10b981" />
              <StatBox label="موقوفون" value={stats.entities - stats.activeEntities} color="#f59e0b" />
            </div>
            {filteredEntities.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 40, background: '#fff', borderRadius: 16, color: '#64748b' }}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>🏪</div>
                <div style={{ fontSize: 15, fontWeight: 900 }}>لا نتائج</div>
              </div>
            ) : filteredEntities.map(e => (
              <div key={e.id} style={{ background: '#fff', borderRadius: 14, padding: 14, marginBottom: 10, border: '1px solid #e2e8f0' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
                  <div style={{ width: 44, height: 44, borderRadius: 12, background: '#f1f5f9', overflow: 'hidden', flexShrink: 0 }}>
                    {e.logo_url ? <img src={e.logo_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>🏪</div>}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 900, color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{e.display_name || 'بدون اسم'}</div>
                    <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>@{e.username || '—'} · 📱 {e.phone || '—'}</div>
                    <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 2 }}>
                      {e.approval_status === 'approved' ? '✅ مقبول' : e.approval_status === 'pending' ? '⏳ معلق' : '❌ مرفوض'}
                      {e.subscription_plan ? ` · 💎 ${e.subscription_plan}` : ''}
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <Link href={`/admin/entities/${e.id}`} style={{ ...btnStyle('rgba(16,185,129,0.1)', '#10b981'), textAlign: 'center', textDecoration: 'none' }}>⚙️ إدارة</Link>
                  <button onClick={() => setDetail({ type: 'entity', data: e })} style={btnStyle('rgba(14,165,233,0.1)', '#0284c7')}>👁️</button>
                </div>
              </div>
            ))}
          </>
        )}

        {/* Employees Tab */}
        {tab === 'employees' && (
          <>
            {filteredEmployees.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 40, background: '#fff', borderRadius: 16, color: '#64748b' }}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>👥</div>
                <div style={{ fontSize: 15, fontWeight: 900 }}>{employees.length === 0 ? 'لا يوجد موظفون' : 'لا نتائج'}</div>
              </div>
            ) : filteredEmployees.map(emp => (
              <div key={emp.id} style={{ background: '#fff', borderRadius: 14, padding: 14, marginBottom: 10, border: '1px solid #e2e8f0', opacity: emp.is_active === false ? 0.6 : 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
                  <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 900, flexShrink: 0 }}>
                    {(emp.full_name || '؟').charAt(0)}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 900, color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{emp.full_name || 'بدون اسم'}</div>
                    <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>@{emp.username || '—'} · 📱 {emp.phone || '—'}</div>
                    <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 2 }}>
                      🏪 {emp.entity_name || '—'}
                      {emp.role ? ` · ${emp.role === 'manager' ? '👔 مدير' : emp.role === 'sales' ? '💼 مبيعات' : '👤 موظف'}` : ''}
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button onClick={() => toggleEmployeeActive(emp)} style={btnStyle(emp.is_active === false ? 'rgba(16,185,129,0.1)' : 'rgba(245,158,11,0.1)', emp.is_active === false ? '#10b981' : '#f59e0b')}>
                    {emp.is_active === false ? '✅ تفعيل' : '⏸️ تعطيل'}
                  </button>
                  <button onClick={() => deleteEmployee(emp)} disabled={working === emp.id} style={btnStyle('rgba(239,68,68,0.1)', '#ef4444')}>{working === emp.id ? '⏳' : '🗑️'}</button>
                </div>
              </div>
            ))}
          </>
        )}
      </div>

      {detail && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 100, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
          <div style={{ background: '#fff', width: '100%', maxWidth: 500, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, maxHeight: '85vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h2 style={{ fontSize: 18, fontWeight: 900, margin: 0 }}>
                {detail.type === 'customer' ? '👤 تفاصيل الزبون' : '🏪 تفاصيل المتجر'}
              </h2>
              <button onClick={() => setDetail(null)} style={{ background: '#f1f5f9', border: 'none', width: 32, height: 32, borderRadius: '50%', fontSize: 16, cursor: 'pointer' }}>✕</button>
            </div>

            {detail.type === 'customer' && (
              <>
                <DetailRow label="الاسم" value={detail.data.name || '—'} />
                <DetailRow label="الهاتف" value={detail.data.phone || '—'} />
                <DetailRow label="العنوان" value={detail.data.address || '—'} />
                <DetailRow label="عدد الطلبات" value={`${ordersCount[detail.data.id] || 0} طلب`} />
                <DetailRow label="النوع" value={detail.data.is_guest === true ? 'زائر تلقائي' : 'مسجل'} />
                <DetailRow label="تاريخ التسجيل" value={detail.data.created_at ? new Date(detail.data.created_at).toLocaleString('ar-SY') : '—'} />
              </>
            )}

            {detail.type === 'entity' && (
              <>
                <DetailRow label="اسم المتجر" value={detail.data.display_name || '—'} />
                <DetailRow label="اسم المستخدم" value={detail.data.username || '—'} />
                <DetailRow label="الهاتف" value={detail.data.phone || '—'} />
                <DetailRow label="النوع" value={detail.data.entity_type || '—'} />
                <DetailRow label="المدينة" value={detail.data.city || '—'} />
                <DetailRow label="العنوان" value={detail.data.address || '—'} />
                <DetailRow label="الحالة" value={detail.data.approval_status === 'approved' ? '✅ مقبول' : detail.data.approval_status === 'pending' ? '⏳ معلق' : '❌ مرفوض'} />
                <DetailRow label="الباقة" value={detail.data.subscription_plan || '—'} />
                <DetailRow label="ينتهي في" value={detail.data.subscription_expires_at ? new Date(detail.data.subscription_expires_at).toLocaleDateString('ar-SY') : '—'} />
                <DetailRow label="تاريخ التسجيل" value={detail.data.created_at ? new Date(detail.data.created_at).toLocaleString('ar-SY') : '—'} />
                <Link href={`/admin/entities/${detail.data.id}`} style={{ display: 'block', marginTop: 16, padding: 12, background: 'linear-gradient(135deg, #10b981, #059669)', color: '#fff', borderRadius: 10, textDecoration: 'none', textAlign: 'center', fontSize: 13, fontWeight: 900 }}>
                  ⚙️ فتح صفحة الإدارة الكاملة
                </Link>
              </>
            )}
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

function DetailRow({ label, value }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #f1f5f9', fontSize: 13 }}>
      <span style={{ color: '#64748b', fontWeight: 800 }}>{label}</span>
      <span style={{ color: '#0f172a', fontWeight: 900, textAlign: 'left', maxWidth: '60%', wordBreak: 'break-word' }}>{value}</span>
    </div>
  );
}

const btnStyle = (bg, color) => ({ flex: 1, padding: 10, background: bg, color, border: 'none', borderRadius: 8, fontSize: 12, fontWeight: 900, cursor: 'pointer', fontFamily: 'inherit' });
