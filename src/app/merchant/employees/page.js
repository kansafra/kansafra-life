'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { getSession, hashPassword } from '@/lib/auth';
import { SkeletonList } from '@/components/Skeleton';

const ROLES = [
  { k: 'manager', l: '👔 مدير فرع' },
  { k: 'sales', l: '💰 مبيعات' },
  { k: 'inventory', l: '📦 مخزون' },
  { k: 'accountant', l: '🧮 محاسب' },
  { k: 'delivery', l: '🚚 توصيل' },
  { k: 'support', l: '💬 دعم' },
];

const PERMISSIONS = [
  { k: 'products', l: 'إدارة المنتجات' },
  { k: 'orders', l: 'إدارة الطلبات' },
  { k: 'inventory', l: 'إدارة المخزون' },
  { k: 'reports', l: 'عرض التقارير' },
  { k: 'finance', l: 'الشؤون المالية' },
  { k: 'customers', l: 'إدارة العملاء' },
  { k: 'settings', l: 'إعدادات النشاط' },
];

export default function EmployeesPage() {
  const router = useRouter();
  const [entity, setEntity] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState(null);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let stored = null;
    try { stored = getSession(); } catch (e) {}
    if (!stored) { router.replace('/login'); return; }
    setEntity(stored);
    load(stored);
  }, [router]);

  async function load(ent) {
    if (!supabase) return;
    const { data } = await supabase.from('employees').select('*').eq('entity_name', ent.display_name).order('created_at', { ascending: false });
    setEmployees(Array.isArray(data) ? data : []);
    setLoading(false);
  }

  function openAdd() {
    setMode('add');
    setForm({ full_name: '', phone: '', email: '', password: '', password_confirm: '', role: 'sales', permissions: [], salary: 0, notes: '' });
  }

  function openEdit(e) {
    setMode('edit');
    setEditing(e);
    setForm({
      full_name: e.full_name,
      phone: e.phone || '',
      email: e.email || '',
      password: '',
      password_confirm: '',
      role: e.role || 'sales',
      permissions: Array.isArray(e.permissions) ? e.permissions : [],
      salary: e.salary || 0,
      notes: e.notes || '',
      is_active: e.is_active,
    });
  }

  async function save() {
    if (!form.full_name?.trim()) { alert('الاسم مطلوب'); return; }
    if (!form.phone?.trim()) { alert('رقم الهاتف مطلوب (لتسجيل الدخول)'); return; }
    
    const needsPassword = (mode === 'add') || (form.password && form.password.length > 0);
    
    if (needsPassword) {
      if (!form.password || form.password.length < 6) {
        alert('كلمة المرور مطلوبة (6 أحرف على الأقل)');
        return;
      }
      if (form.password !== form.password_confirm) {
        alert('كلمتا المرور غير متطابقتين');
        return;
      }
    }
    
    setSaving(true);
    
    // التحقق من عدم تكرار رقم الهاتف
    const { data: existing } = await supabase
      .from('employees')
      .select('id')
      .eq('phone', form.phone.trim())
      .maybeSingle();
    
    if (existing && (mode === 'add' || existing.id !== editing?.id)) {
      setSaving(false);
      alert('رقم الهاتف مستخدم بالفعل لموظف آخر');
      return;
    }
    
    const payload = {
      entity_name: entity.display_name,
      full_name: form.full_name.trim(),
      phone: form.phone?.trim() || null,
      email: form.email?.trim() || null,
      role: form.role,
      permissions: form.permissions,
      salary: Number(form.salary) || 0,
      notes: form.notes?.trim() || null,
      is_active: form.is_active === false ? false : true,
    };
    
    if (needsPassword) {
      payload.password_hash = await hashPassword(form.password);
    }
    
    let err;
    if (mode === 'add') {
      ({ error: err } = await supabase.from('employees').insert(payload));
    } else {
      ({ error: err } = await supabase.from('employees').update(payload).eq('id', editing.id));
    }
    setSaving(false);
    if (err) { alert('تعذّر الحفظ: ' + err.message); return; }
    setMode(null); setEditing(null);
    load(entity);
  }

  async function del(e) {
    if (!confirm(`حذف ${e.full_name}؟`)) return;
    await supabase.from('employees').delete().eq('id', e.id);
    load(entity);
  }

  async function toggleActive(e) {
    await supabase.from('employees').update({ is_active: !e.is_active }).eq('id', e.id);
    load(entity);
  }

  function togglePerm(k) {
    const list = form.permissions || [];
    setForm({ ...form, permissions: list.includes(k) ? list.filter((p) => p !== k) : [...list, k] });
  }

  if (!entity) return <div className="sect-empty" style={{ padding: 80 }}><span className="em">⏳</span></div>;

  return (
    <div className="sect-page" style={{ paddingBottom: 40 }}>
      <div className="inv-header">
        <Link href="/merchant" className="inv-back">→</Link>
        <span className="inv-title">👥 الموظفون</span>
        <button className="mng-add-btn" onClick={openAdd} type="button">+ موظف</button>
      </div>

      {loading ? (
        <div style={{ padding: 20 }}>
          <SkeletonList count={3} />
        </div>
      ) : employees.length === 0 ? (
        <div className="sect-empty">
          <span className="em">👥</span>
          <p>لا يوجد موظفون</p>
          <button className="mng-add-btn" onClick={openAdd} type="button" style={{ marginTop: 16 }}>+ إضافة موظف</button>
        </div>
      ) : (
        <div style={{ padding: 20 }}>
          {employees.map((e) => {
            const roleLabel = ROLES.find((r) => r.k === e.role)?.l || e.role;
            return (
              <div key={e.id} className="admin-item" style={{ marginBottom: 8, background: '#fff', border: '1px solid var(--c-200)' }}>
                <div style={{ width: 42, height: 42, borderRadius: '50%', background: 'linear-gradient(135deg, var(--f-800), var(--f-600))', color: '#fff', display: 'grid', placeItems: 'center', fontSize: 16, fontWeight: 900, flexShrink: 0 }}>
                  {e.full_name.charAt(0)}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 900, color: 'var(--n-900)', marginBottom: 4 }}>{e.full_name}</div>
                  <div style={{ fontSize: 11.5, color: 'var(--n-500)', fontWeight: 600 }}>
                    {roleLabel}
                    {e.phone && ` · ${e.phone}`}
                  </div>
                  {Array.isArray(e.permissions) && e.permissions.length > 0 && (
                    <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginTop: 6 }}>
                      {e.permissions.slice(0, 3).map((p) => (
                        <span key={p} style={{ fontSize: 9.5, fontWeight: 800, background: 'var(--f-50)', color: 'var(--f-700)', padding: '2px 8px', borderRadius: 999 }}>
                          {PERMISSIONS.find((x) => x.k === p)?.l || p}
                        </span>
                      ))}
                      {e.permissions.length > 3 && (
                        <span style={{ fontSize: 9.5, color: 'var(--n-400)', fontWeight: 700 }}>+{e.permissions.length - 3}</span>
                      )}
                    </div>
                  )}
                </div>
                <div style={{ display: 'flex', gap: 4 }}>
                  <button onClick={() => openEdit(e)} type="button" style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--c-100)', border: 'none', fontSize: 14, cursor: 'pointer' }}>✏️</button>
                  <button onClick={() => toggleActive(e)} type="button" style={{ width: 32, height: 32, borderRadius: '50%', background: e.is_active ? 'rgba(22,163,74,.12)' : 'rgba(115,139,128,.12)', border: 'none', fontSize: 14, cursor: 'pointer' }}>
                    {e.is_active ? '⏸' : '▶'}
                  </button>
                  <button onClick={() => del(e)} type="button" style={{ width: 32, height: 32, borderRadius: '50%', background: 'rgba(220,38,38,.1)', color: '#dc2626', border: 'none', fontSize: 14, cursor: 'pointer' }}>✕</button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {mode && (
        <div className="mng-modal-bg" onClick={() => { setMode(null); setEditing(null); }}>
          <div className="mng-modal" onClick={(ev) => ev.stopPropagation()}>
            <div className="mng-modal-handle" />
            <h3 className="mng-modal-title">{mode === 'add' ? '➕ موظف جديد' : '✏️ تعديل الموظف'}</h3>

            <div className="new-service-field">
              <label className="new-service-label">الاسم *</label>
              <input className="new-service-input" value={form.full_name || ''} onChange={(ev) => setForm({ ...form, full_name: ev.target.value })} />
            </div>

            <div className="new-prod-row">
              <div className="new-service-field">
                <label className="new-service-label">الهاتف *</label>
                <input className="new-service-input" type="tel" value={form.phone || ''} onChange={(ev) => setForm({ ...form, phone: ev.target.value })} />
              </div>
              <div className="new-service-field">
                <label className="new-service-label">البريد</label>
                <input className="new-service-input" type="email" value={form.email || ''} onChange={(ev) => setForm({ ...form, email: ev.target.value })} />
              </div>
            </div>

            <div className="new-prod-row">
              <div className="new-service-field">
                <label className="new-service-label">كلمة المرور {mode === 'add' ? '*' : '(اتركها فارغة لعدم التغيير)'}</label>
                <input className="new-service-input" type="password" value={form.password || ''} onChange={(ev) => setForm({ ...form, password: ev.target.value })} placeholder="••••••••" autoComplete="new-password" />
              </div>
              <div className="new-service-field">
                <label className="new-service-label">تأكيد كلمة المرور</label>
                <input className="new-service-input" type="password" value={form.password_confirm || ''} onChange={(ev) => setForm({ ...form, password_confirm: ev.target.value })} placeholder="••••••••" autoComplete="new-password" />
              </div>
            </div>

            <div className="new-prod-row">
              <div className="new-service-field">
                <label className="new-service-label">الدور</label>
                <select className="new-service-select" value={form.role || 'sales'} onChange={(ev) => setForm({ ...form, role: ev.target.value })}>
                  {ROLES.map((r) => <option key={r.k} value={r.k}>{r.l}</option>)}
                </select>
              </div>
              <div className="new-service-field">
                <label className="new-service-label">الراتب</label>
                <input className="new-service-input" type="number" value={form.salary || 0} onChange={(ev) => setForm({ ...form, salary: ev.target.value })} />
              </div>
            </div>

            <div className="new-service-field">
              <label className="new-service-label">الصلاحيات</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                {PERMISSIONS.map((p) => (
                  <label key={p.k} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: 8, background: 'var(--c-50)', borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
                    <input type="checkbox" checked={(form.permissions || []).includes(p.k)} onChange={() => togglePerm(p.k)} />
                    {p.l}
                  </label>
                ))}
              </div>
            </div>

            <div className="new-service-field">
              <label className="new-service-label">ملاحظات</label>
              <textarea className="new-service-textarea" rows={2} value={form.notes || ''} onChange={(ev) => setForm({ ...form, notes: ev.target.value })} />
            </div>

            <div className="admin-form-actions">
              <button className="mng-btn ghost" onClick={() => { setMode(null); setEditing(null); }} type="button">إلغاء</button>
              <button className="mng-btn primary" onClick={save} disabled={saving} type="button">
                {saving ? '...' : mode === 'add' ? '✓ إضافة' : '✓ حفظ'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
