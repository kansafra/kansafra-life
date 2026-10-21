'use client';
import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { useCurrentUser } from '@/lib/useCurrentUser';
import { useToast } from '@/components/Toast';
import { ROLES_BY_SECTOR, ROLE_INFO } from '@/lib/permissions';
import Link from 'next/link';

async function hashPassword(password) {
  const encoder = new TextEncoder();
  const data = encoder.encode(password + 'sanad_salt_v1');
  const buf = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
}

const ROLES = {
  manager:    { label: 'مدير',     icon: '👔', color: '#8b5cf6', perms: ['orders.*','products.*','customers.*','employees.*','debts.*','invoices.*','reports.*'] },
  sales:      { label: 'مبيعات',   icon: '💼', color: '#3b82f6', perms: ['orders.read','orders.write','products.read','customers.read','customers.write'] },
  delivery:   { label: 'توصيل',    icon: '🚚', color: '#f59e0b', perms: ['orders.read','orders.write'] },
  accountant: { label: 'محاسب',    icon: '📊', color: '#10b981', perms: ['invoices.read','invoices.write','debts.read','debts.write','reports.read'] },
  employee:   { label: 'موظف',     icon: '👤', color: '#64748b', perms: ['orders.read','products.read'] },
};

const PLANS = {
  free:       { label: 'مجاني',   price: 0,      employees: 2,  devices: 1 },
  basic:      { label: 'أساسي',   price: 10000,  employees: 5,  devices: 2 },
  pro:        { label: 'احترافي', price: 25000,  employees: 15, devices: 5 },
  enterprise: { label: 'مؤسسي',   price: 60000,  employees: 100, devices: 20 },
};

const TABS = [
  { key: 'team', label: '👥 الفريق' },
  { key: 'sub', label: '💎 الاشتراك' },
  { key: 'devices', label: '📱 الأجهزة' },
];

export default function MerchantTeamPage() {
  const { success, error: toastError } = useToast();
  const { user, loading: userLoading, dataOwnerName } = useCurrentUser();

  const [entity, setEntity] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('team');

  // Forms
  const [showForm, setShowForm] = useState(false);
  const [editEmp, setEditEmp] = useState(null);
  const [form, setForm] = useState({ full_name: '', phone: '', username: '', password: '', role: 'sales', is_active: true });
  const [saving, setSaving] = useState(false);
  const [showPass, setShowPass] = useState(false);

  useEffect(() => {
    if (userLoading) return;
    if (!user || !dataOwnerName) { setLoading(false); return; }
    loadAll();
  }, [user, userLoading, dataOwnerName]);

  async function loadAll() {
    if (!supabase || !dataOwnerName) return;
    setLoading(true);
    try {
      const { data: ent } = await supabase.from('entities').select('*').eq('display_name', dataOwnerName).maybeSingle();
      setEntity(ent);

      const { data: emps } = await supabase.from('employees').select('*').eq('entity_name', dataOwnerName).order('created_at', { ascending: false });
      setEmployees(emps || []);

      if (ent?.id) {
        const { data: sess } = await supabase.from('entity_sessions').select('*').eq('entity_id', ent.id).eq('is_active', true).order('last_active', { ascending: false });
        setSessions(sess || []);
      }
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }

  function openAdd() {
    if (entity && employees.length >= (entity.max_employees || 5)) {
      toastError(`وصلت للحد الأقصى (${entity.max_employees} موظف). قم بترقية الباقة.`);
      return;
    }
    setForm({ full_name: '', phone: '', username: '', password: '', role: 'sales', is_active: true });
    setEditEmp(null);
    setShowForm(true);
  }

  function openEdit(emp) {
    setForm({
      full_name: emp.full_name || '', phone: emp.phone || '',
      username: emp.username || '', password: '',
      role: emp.role || 'sales', is_active: emp.is_active !== false,
    });
    setEditEmp(emp);
    setShowForm(true);
  }

  async function saveEmployee(e) {
    e.preventDefault();
    if (!form.full_name.trim() || !form.phone.trim()) { toastError('الاسم والهاتف مطلوبان'); return; }
    if (!editEmp && !form.username.trim()) { toastError('اسم المستخدم مطلوب للموظف الجديد'); return; }
    if (!editEmp && form.password.length < 6) { toastError('كلمة المرور 6 أحرف على الأقل'); return; }

    setSaving(true);
    try {
      if (form.username.trim()) {
        const { data: dup } = await supabase.from('employees').select('id').eq('username', form.username.trim().toLowerCase()).maybeSingle();
        if (dup && dup.id !== editEmp?.id) { toastError('اسم المستخدم مستخدم بالفعل'); setSaving(false); return; }
      }

      const payload = {
        full_name: form.full_name, phone: form.phone,
        username: form.username.trim().toLowerCase() || null,
        role: form.role, is_active: form.is_active,
        entity_name: dataOwnerName,
      };

      if (form.password) {
        payload.password_hash = await hashPassword(form.password);
      }

      if (editEmp) {
        const { error } = await supabase.from('employees').update(payload).eq('id', editEmp.id);
        if (error) throw error;
        success('✅ تم التحديث');
      } else {
        const { error } = await supabase.from('employees').insert(payload);
        if (error) throw error;
        success('✅ تمت الإضافة');
      }
      setShowForm(false);
      loadAll();
    } catch (err) { console.error(err); toastError('فشل الحفظ'); }
    finally { setSaving(false); }
  }

  async function deleteEmployee(emp) {
    if (!confirm(`حذف "${emp.full_name}"؟`)) return;
    const { error } = await supabase.from('employees').delete().eq('id', emp.id);
    if (error) toastError('فشل الحذف');
    else { success('🗑️ تم الحذف'); setEmployees(prev => prev.filter(x => x.id !== emp.id)); }
  }

  async function toggleActive(emp) {
    const { error } = await supabase.from('employees').update({ is_active: !emp.is_active }).eq('id', emp.id);
    if (!error) {
      success(emp.is_active ? '⏸️ تم التعطيل' : '✅ تم التفعيل');
      setEmployees(prev => prev.map(x => x.id === emp.id ? { ...x, is_active: !x.is_active } : x));
    }
  }

  async function renewSubscription(days) {
    if (!entity) return;
    if (!confirm(`تجديد ${days} يوم؟ (محاكاة دفع ${(PLANS[entity.subscription_plan]?.price || 0)} ل.س)`)) return;
    setSaving(true);
    try {
      const base = entity.subscription_expires_at && new Date(entity.subscription_expires_at) > new Date()
        ? new Date(entity.subscription_expires_at) : new Date();
      const newExpiry = new Date(base.getTime() + days * 86400000);
      const { error } = await supabase.from('entities').update({ subscription_expires_at: newExpiry.toISOString() }).eq('id', entity.id);
      if (error) throw error;
      success(`✅ تم التجديد ${days} يوم`);
      setEntity({ ...entity, subscription_expires_at: newExpiry.toISOString() });
    } catch (err) { toastError('فشل'); }
    finally { setSaving(false); }
  }

  async function logoutDevice(session) {
    if (!confirm('تسجيل خروج هذا الجهاز؟')) return;
    const { error } = await supabase.from('entity_sessions').update({ is_active: false }).eq('id', session.id);
    if (!error) {
      success('✅ تم تسجيل الخروج');
      setSessions(prev => prev.filter(x => x.id !== session.id));
    }
  }

  const daysLeft = entity?.subscription_expires_at
    ? Math.ceil((new Date(entity.subscription_expires_at) - new Date()) / 86400000) : null;
  const currentPlan = PLANS[entity?.subscription_plan] || PLANS.free;

  if (loading) return <div style={{ padding: 80, textAlign: 'center' }}>⏳</div>;

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', paddingBottom: 80 }}>
      <div style={{ background: 'linear-gradient(135deg, #0f4d3a, #075640)', padding: '16px 20px', color: '#fff' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
          <Link href="/merchant" style={{ color: '#fff', textDecoration: 'none', fontSize: 20 }}>←</Link>
          <div style={{ flex: 1 }}>
            <h1 style={{ fontSize: 18, fontWeight: 900, margin: 0 }}>👥 الفريق والإدارة</h1>
            <div style={{ fontSize: 11, opacity: 0.8, marginTop: 2 }}>{dataOwnerName}</div>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.15)', padding: '6px 12px', borderRadius: 8, fontSize: 10, fontWeight: 900 }}>
            {currentPlan.label} · {daysLeft > 0 ? `${daysLeft} يوم` : 'منتهي'}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 6, overflowX: 'auto' }}>
          {TABS.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)} style={{ background: tab === t.key ? '#fff' : 'rgba(255,255,255,0.1)', color: tab === t.key ? '#0f4d3a' : '#fff', border: 'none', padding: '8px 16px', borderRadius: 20, fontSize: 12, fontWeight: 900, cursor: 'pointer', whiteSpace: 'nowrap', fontFamily: 'inherit' }}>{t.label}</button>
          ))}
        </div>
      </div>

      <div style={{ padding: 16, maxWidth: 700, margin: '0 auto' }}>

        {tab === 'team' && (
          <>
            <div style={{ background: '#fff', borderRadius: 14, padding: 14, marginBottom: 16, border: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: 12, color: '#64748b', fontWeight: 800 }}>الموظفون</div>
                <div style={{ fontSize: 20, fontWeight: 900, color: '#0f172a' }}>{employees.length} / {entity?.max_employees || 5}</div>
              </div>
              <button onClick={openAdd} style={{ background: 'linear-gradient(135deg, #10b981, #059669)', color: '#fff', border: 'none', padding: '10px 16px', borderRadius: 10, fontSize: 12, fontWeight: 900, cursor: 'pointer', fontFamily: 'inherit' }}>+ إضافة</button>
            </div>

            {employees.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 40, background: '#fff', borderRadius: 16, color: '#64748b' }}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>👥</div>
                <div style={{ fontSize: 14, fontWeight: 900, marginBottom: 12 }}>لا يوجد موظفون بعد</div>
                <button onClick={openAdd} style={{ background: '#0f4d3a', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: 10, fontSize: 13, fontWeight: 900, cursor: 'pointer', fontFamily: 'inherit' }}>+ أضف أول موظف</button>
              </div>
            ) : employees.map(emp => {
              const role = ROLE_INFO[emp.role] || ROLE_INFO.employee;
              const hasCredentials = !!emp.username;
              return (
                <div key={emp.id} style={{ background: '#fff', borderRadius: 14, padding: 14, marginBottom: 10, border: '1px solid #e2e8f0', opacity: emp.is_active === false ? 0.6 : 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
                    <div style={{ width: 44, height: 44, borderRadius: '50%', background: `${role.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>{role.icon}</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 14, fontWeight: 900, color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{emp.full_name}</div>
                      <div style={{ fontSize: 11, color: '#64748b', marginTop: 2, fontFamily: 'monospace' }}>{emp.phone}</div>
                      {hasCredentials ? (
                        <div style={{ fontSize: 10, color: '#10b981', fontWeight: 800, marginTop: 2 }}>🔐 @{emp.username}</div>
                      ) : (
                        <div style={{ fontSize: 10, color: '#f59e0b', fontWeight: 800, marginTop: 2 }}>⚠️ بدون بيانات دخول</div>
                      )}
                    </div>
                    <div style={{ background: `${role.color}15`, color: role.color, padding: '4px 10px', borderRadius: 8, fontSize: 10, fontWeight: 900 }}>{role.label}</div>
                  </div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button onClick={() => openEdit(emp)} style={{ flex: 1, padding: 8, background: 'rgba(14,165,233,0.1)', color: '#0284c7', border: '1px solid rgba(14,165,233,0.3)', borderRadius: 8, fontSize: 11, fontWeight: 900, cursor: 'pointer', fontFamily: 'inherit' }}>✏️ تعديل</button>
                    <button onClick={() => toggleActive(emp)} style={{ flex: 1, padding: 8, background: emp.is_active ? 'rgba(245,158,11,0.1)' : 'rgba(16,185,129,0.1)', color: emp.is_active ? '#f59e0b' : '#10b981', border: `1px solid ${emp.is_active ? 'rgba(245,158,11,0.3)' : 'rgba(16,185,129,0.3)'}`, borderRadius: 8, fontSize: 11, fontWeight: 900, cursor: 'pointer', fontFamily: 'inherit' }}>{emp.is_active ? '⏸️ تعطيل' : '✅ تفعيل'}</button>
                    <button onClick={() => deleteEmployee(emp)} style={{ flex: 1, padding: 8, background: 'rgba(239,68,68,0.1)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 8, fontSize: 11, fontWeight: 900, cursor: 'pointer', fontFamily: 'inherit' }}>🗑️</button>
                  </div>
                </div>
              );
            })}
          </>
        )}

        {tab === 'sub' && (
          <>
            <div style={{ background: 'linear-gradient(135deg, #0f4d3a, #075640)', borderRadius: 16, padding: 20, color: '#fff', marginBottom: 16 }}>
              <div style={{ fontSize: 11, opacity: 0.8, fontWeight: 700, marginBottom: 4 }}>الباقة الحالية</div>
              <div style={{ fontSize: 24, fontWeight: 900, marginBottom: 8 }}>{currentPlan.label}</div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, opacity: 0.9 }}>
                <span>⏰ {daysLeft > 0 ? `ينتهي بعد ${daysLeft} يوم` : 'منتهي'}</span>
                <span>💵 {currentPlan.price.toLocaleString()} ل.س/شهر</span>
              </div>
            </div>

            <div style={{ background: '#fff', borderRadius: 14, padding: 16, marginBottom: 16, border: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: 13, fontWeight: 900, marginBottom: 12 }}>📊 حدود باقتك</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
                <div style={{ background: '#f8fafc', borderRadius: 10, padding: 12, textAlign: 'center' }}>
                  <div style={{ fontSize: 20, fontWeight: 900, color: '#0f4d3a' }}>{employees.length} / {entity?.max_employees || 5}</div>
                  <div style={{ fontSize: 10, color: '#64748b', marginTop: 4, fontWeight: 800 }}>👥 موظفون</div>
                </div>
                <div style={{ background: '#f8fafc', borderRadius: 10, padding: 12, textAlign: 'center' }}>
                  <div style={{ fontSize: 20, fontWeight: 900, color: '#0f4d3a' }}>{sessions.length} / {entity?.max_devices || 2}</div>
                  <div style={{ fontSize: 10, color: '#64748b', marginTop: 4, fontWeight: 800 }}>📱 أجهزة</div>
                </div>
              </div>
            </div>

            <div style={{ background: '#fff', borderRadius: 14, padding: 16, border: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: 13, fontWeight: 900, marginBottom: 12 }}>🔄 تجديد الباقة</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
                {[30, 90, 180, 365].map(d => (
                  <button key={d} onClick={() => renewSubscription(d)} disabled={saving} style={{ padding: 12, background: '#f8fafc', color: '#0f4d3a', border: '1px solid #cbd5e1', borderRadius: 10, fontSize: 13, fontWeight: 900, cursor: saving ? 'wait' : 'pointer', fontFamily: 'inherit' }}>
                    + {d === 365 ? 'سنة' : `${d} يوم`}
                  </button>
                ))}
              </div>
              <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 12, textAlign: 'center' }}>لترقية الباقة، تواصل مع الإدارة</div>
            </div>
          </>
        )}

        {tab === 'devices' && (
          <>
            <div style={{ background: '#fff', borderRadius: 14, padding: 14, marginBottom: 16, border: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: 12, color: '#64748b', fontWeight: 800 }}>الأجهزة النشطة</div>
                <div style={{ fontSize: 20, fontWeight: 900, color: '#0f172a' }}>{sessions.length} / {entity?.max_devices || 2}</div>
              </div>
              <div style={{ fontSize: 28 }}>📱</div>
            </div>

            {sessions.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 40, background: '#fff', borderRadius: 16, color: '#64748b' }}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>📱</div>
                <div style={{ fontSize: 14, fontWeight: 900 }}>لا توجد أجهزة مسجلة</div>
                <div style={{ fontSize: 11, marginTop: 6 }}>سيظهر هنا كل جهاز يستخدم لوحة التحكم</div>
              </div>
            ) : sessions.map(sess => (
              <div key={sess.id} style={{ background: '#fff', borderRadius: 14, padding: 14, marginBottom: 10, border: '1px solid #e2e8f0' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(14,165,233,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>📱</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 900, color: '#0f172a' }}>{sess.device_name || 'جهاز غير معروف'}</div>
                    <div style={{ fontSize: 10, color: '#64748b', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{sess.user_agent?.slice(0, 60) || ''}</div>
                    <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 2 }}>آخر نشاط: {new Date(sess.last_active).toLocaleString('ar-SY')}</div>
                  </div>
                  <button onClick={() => logoutDevice(sess)} style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.3)', padding: '6px 10px', borderRadius: 8, fontSize: 10, fontWeight: 900, cursor: 'pointer', fontFamily: 'inherit' }}>🚪 خروج</button>
                </div>
              </div>
            ))}
          </>
        )}
      </div>

      {showForm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 100, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
          <div style={{ background: '#fff', width: '100%', maxWidth: 500, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h2 style={{ fontSize: 18, fontWeight: 900, margin: 0 }}>{editEmp ? '✏️ تعديل موظف' : '👤 موظف جديد'}</h2>
              <button onClick={() => setShowForm(false)} style={{ background: '#f1f5f9', border: 'none', width: 32, height: 32, borderRadius: '50%', fontSize: 16, cursor: 'pointer' }}>✕</button>
            </div>
            <form onSubmit={saveEmployee}>
              <div style={{ marginBottom: 12 }}>
                <label style={labelStyle}>الاسم *</label>
                <input value={form.full_name} onChange={e => setForm({ ...form, full_name: e.target.value })} required style={inputStyle} />
              </div>
              <div style={{ marginBottom: 12 }}>
                <label style={labelStyle}>رقم الهاتف *</label>
                <input type="tel" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} required style={inputStyle} />
              </div>
              <div style={{ marginBottom: 12 }}>
                <label style={labelStyle}>اسم المستخدم (للدخول)</label>
                <input value={form.username} onChange={e => setForm({ ...form, username: e.target.value })} style={inputStyle} placeholder="مثال: ahmed_ali" />
              </div>
              <div style={{ marginBottom: 12 }}>
                <label style={labelStyle}>{editEmp ? 'كلمة مرور جديدة (اتركها فارغة لعدم التغيير)' : 'كلمة المرور *'}</label>
                <div style={{ position: 'relative' }}>
                  <input type={showPass ? 'text' : 'password'} value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} style={{ ...inputStyle, paddingLeft: 44 }} placeholder="6 أحرف على الأقل" />
                  <button type="button" onClick={() => setShowPass(!showPass)} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', fontSize: 18, cursor: 'pointer', padding: 4 }}>{showPass ? '🙈' : '👁️'}</button>
                </div>
              </div>
              <div style={{ marginBottom: 12 }}>
                <label style={labelStyle}>الدور</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 6 }}>
                  {Object.entries(getAvailableRoles(entity?.entity_type)).map(([key, r]) => (
                    <button key={key} type="button" onClick={() => setForm({ ...form, role: key })} style={{
                      padding: 10, background: form.role === key ? `${r.color}15` : '#f8fafc',
                      border: form.role === key ? `2px solid ${r.color}` : '1px solid #e2e8f0',
                      borderRadius: 8, fontSize: 11, fontWeight: 900,
                      color: form.role === key ? r.color : '#475569',
                      cursor: 'pointer', fontFamily: 'inherit',
                      display: 'flex', alignItems: 'center', gap: 4, justifyContent: 'center'
                    }}>{r.icon} {r.label}</button>
                  ))}
                </div>
              </div>
              <div style={{ marginBottom: 20 }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 10, padding: 12, background: '#f8fafc', borderRadius: 10, border: '1px solid #e2e8f0', cursor: 'pointer' }}>
                  <input type="checkbox" checked={form.is_active} onChange={e => setForm({ ...form, is_active: e.target.checked })} style={{ width: 18, height: 18 }} />
                  <span style={{ fontSize: 13, fontWeight: 800 }}>الحساب مفعّل (يمكنه تسجيل الدخول)</span>
                </label>
              </div>
              <button type="submit" disabled={saving} style={{ width: '100%', padding: 14, background: saving ? '#94a3b8' : '#0f4d3a', color: '#fff', border: 'none', borderRadius: 10, fontWeight: 900, fontSize: 15, cursor: saving ? 'wait' : 'pointer', fontFamily: 'inherit' }}>
                {saving ? '⏳' : (editEmp ? '💾 حفظ التغييرات' : '➕ إضافة الموظف')}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

const labelStyle = { display: 'block', fontSize: 12, fontWeight: 800, color: '#475569', marginBottom: 6 };
const inputStyle = { width: '100%', padding: '12px 14px', borderRadius: 10, border: '1px solid #cbd5e1', fontSize: 14, fontFamily: 'inherit', boxSizing: 'border-box', outline: 'none', background: '#f8fafc' };
