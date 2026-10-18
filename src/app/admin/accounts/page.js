'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/components/Toast';
import { SkeletonList } from '@/components/Skeleton';
import EmptyState from '@/components/EmptyState';

const ROLES = {
  super_admin: { label: 'مدير عام', color: '#dc2626', icon: '👑' },
  admin: { label: 'أدمن', color: '#0f4d3a', icon: '⚙️' },
  moderator: { label: 'مشرف', color: '#3b82f6', icon: '🛡️' },
  support: { label: 'دعم', color: '#8b5cf6', icon: '💬' },
};

const PERMISSIONS = [
  { key: 'entities', label: 'المزودون' },
  { key: 'orders', label: 'الطلبات' },
  { key: 'products', label: 'المنتجات' },
  { key: 'users', label: 'المستخدمون' },
  { key: 'finance', label: 'المالية' },
  { key: 'moderation', label: 'المراجعة' },
  { key: 'settings', label: 'الإعدادات' },
  { key: 'backup', label: 'النسخ الاحتياطي' },
];

export default function AdminAccounts() {
  const router = useRouter();
  const { success, error: tE } = useToast();
  const [items, setItems] = useState([]);
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
    const { data } = await supabase.from('admin_accounts').select('*').order('created_at', { ascending: false });
    setItems(data || []);
    setLoading(false);
  }

  function openAdd() {
    setEditing(null);
    setForm({ username: '', display_name: '', phone: '', password: '', password_confirm: '', role: 'admin', permissions: [], is_active: true });
    setModal(true);
  }

  function openEdit(a) {
    setEditing(a);
    setForm({ ...a, password: '', password_confirm: '', permissions: Array.isArray(a.permissions) ? a.permissions : [] });
    setModal(true);
  }

  async function save() {
    if (!form.username?.trim()) { tE('اسم المستخدم مطلوب'); return; }
    if (!form.display_name?.trim()) { tE('الاسم مطلوب'); return; }

    const needsPassword = !editing || (form.password && form.password.length > 0);
    if (needsPassword) {
      if (!form.password || form.password.length < 6) { tE('كلمة المرور 6 أحرف على الأقل'); return; }
      if (form.password !== form.password_confirm) { tE('كلمتا المرور غير متطابقتين'); return; }
    }

    setSaving(true);
    try {
      const payload = {
        username: form.username.trim(),
        display_name: form.display_name.trim(),
        phone: form.phone?.trim() || null,
        role: form.role || 'admin',
        permissions: Array.isArray(form.permissions) ? form.permissions : [],
        is_active: form.is_active !== false,
      };

      if (needsPassword) {
        const { hashPassword } = await import('@/lib/auth');
        payload.password_hash = await hashPassword(form.password);
      }

      let err;
      if (editing) ({ error: err } = await supabase.from('admin_accounts').update(payload).eq('id', editing.id));
      else ({ error: err } = await supabase.from('admin_accounts').insert(payload));
      if (err) throw err;
      success(editing ? '✅ تم التعديل' : '✅ تمت الإضافة');
      setModal(false); load();
    } catch (e) { tE('تعذّر: ' + e.message); }
    setSaving(false);
  }

  async function del(a) {
    if (a.role === 'super_admin') { tE('لا يمكن حذف مدير عام'); return; }
    if (!confirm(`حذف "${a.display_name}"؟`)) return;
    await supabase.from('admin_accounts').delete().eq('id', a.id);
    success('✅ تم'); load();
  }

  async function toggle(a) {
    if (a.role === 'super_admin') { tE('لا يمكن تعطيل مدير عام'); return; }
    await supabase.from('admin_accounts').update({ is_active: !a.is_active }).eq('id', a.id);
    load();
  }

  function togglePerm(key) {
    const perms = form.permissions || [];
    setForm({ ...form, permissions: perms.includes(key) ? perms.filter(p => p !== key) : [...perms, key] });
  }

  if (loading) return <div style={{ padding: 16, background: '#f8fafc', minHeight: '100vh' }}><SkeletonList count={4} /></div>;

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', paddingBottom: 40 }}>
      <div style={{ position: 'sticky', top: 0, zIndex: 10, background: '#0f4d3a', padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <Link href="/admin" style={{ color: '#fff', textDecoration: 'none', fontSize: 20, width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,.1)', borderRadius: '50%' }}>→</Link>
        <div style={{ flex: 1, color: '#fff', fontSize: 16, fontWeight: 900 }}>👤 الحسابات ({items.length})</div>
        <button onClick={openAdd} style={{ background: '#fbbf24', color: '#0f4d3a', border: 'none', padding: '8px 14px', borderRadius: 10, fontSize: 12, fontWeight: 900, cursor: 'pointer', fontFamily: 'inherit' }}>+ حساب</button>
      </div>
      <div style={{ padding: 16 }}>
        {items.length === 0 ? <EmptyState icon="👤" title="لا توجد حسابات" actionLabel="+ إضافة" onAction={openAdd} /> : items.map(a => {
          const r = ROLES[a.role] || ROLES.admin;
          return (
            <div key={a.id} style={{ background: '#fff', borderRadius: 14, padding: 14, marginBottom: 10, border: '1px solid #e5e7eb', opacity: a.is_active ? 1 : 0.6 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
                <div style={{ width: 48, height: 48, borderRadius: 12, background: `${r.color}20`, color: r.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0 }}>{r.icon}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 900 }}>{a.display_name}</div>
                  <div style={{ fontSize: 11, color: '#64748b', direction: 'ltr', textAlign: 'right' }}>@{a.username}</div>
                  <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 2 }}>{r.label}{a.phone && ` · ${a.phone}`}</div>
                </div>
                <span style={{ background: a.is_active ? 'rgba(16,185,129,.15)' : '#f1f5f9', color: a.is_active ? '#10b981' : '#64748b', padding: '3px 8px', borderRadius: 6, fontSize: 9.5, fontWeight: 900 }}>{a.is_active ? '● نشط' : '○ معطل'}</span>
              </div>
              {Array.isArray(a.permissions) && a.permissions.length > 0 && (
                <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 8 }}>
                  {a.permissions.map(p => (
                    <span key={p} style={{ background: 'rgba(15,77,58,.08)', color: '#0f4d3a', padding: '2px 8px', borderRadius: 6, fontSize: 9.5, fontWeight: 800 }}>{PERMISSIONS.find(x => x.key === p)?.label || p}</span>
                  ))}
                </div>
              )}
              {a.last_login && <div style={{ fontSize: 10, color: '#94a3b8', marginBottom: 8 }}>آخر دخول: {new Date(a.last_login).toLocaleString('ar-EG')}</div>}
              <div style={{ display: 'flex', gap: 4 }}>
                <button onClick={() => openEdit(a)} style={{ flex: 1, padding: 8, background: '#f1f5f9', border: 'none', borderRadius: 8, fontSize: 11, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit' }}>✏️ تعديل</button>
                <button onClick={() => toggle(a)} disabled={a.role === 'super_admin'} style={{ flex: 1, padding: 8, background: '#f1f5f9', border: 'none', borderRadius: 8, fontSize: 11, fontWeight: 800, cursor: a.role === 'super_admin' ? 'not-allowed' : 'pointer', fontFamily: 'inherit', opacity: a.role === 'super_admin' ? 0.4 : 1 }}>{a.is_active ? '⏸' : '▶'}</button>
                <button onClick={() => del(a)} disabled={a.role === 'super_admin'} style={{ padding: 8, background: 'rgba(220,38,38,.1)', color: '#dc2626', border: 'none', borderRadius: 8, fontSize: 11, cursor: a.role === 'super_admin' ? 'not-allowed' : 'pointer', fontFamily: 'inherit', opacity: a.role === 'super_admin' ? 0.4 : 1 }}>🗑️</button>
              </div>
            </div>
          );
        })}
      </div>
      {modal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.6)', zIndex: 100, display: 'flex', alignItems: 'flex-end' }} onClick={() => setModal(false)}>
          <div style={{ background: '#fff', borderRadius: '24px 24px 0 0', width: '100%', maxWidth: 500, margin: '0 auto', padding: '24px 20px 30px', maxHeight: '90vh', overflow: 'auto' }} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ fontSize: 18, fontWeight: 900, marginBottom: 16 }}>{editing ? 'تعديل حساب' : 'حساب جديد'}</h3>
            <input type="text" placeholder="اسم المستخدم * (بالإنجليزية)" value={form.username || ''} onChange={(e) => setForm({ ...form, username: e.target.value })} style={{ width: '100%', padding: 12, border: '1px solid #e5e7eb', borderRadius: 10, fontSize: 13, marginBottom: 10, boxSizing: 'border-box', fontFamily: 'monospace', direction: 'ltr', textAlign: 'right' }} />
            <input type="text" placeholder="الاسم الكامل *" value={form.display_name || ''} onChange={(e) => setForm({ ...form, display_name: e.target.value })} style={{ width: '100%', padding: 12, border: '1px solid #e5e7eb', borderRadius: 10, fontSize: 13, marginBottom: 10, boxSizing: 'border-box', fontFamily: 'inherit' }} />
            <input type="tel" placeholder="الهاتف" value={form.phone || ''} onChange={(e) => setForm({ ...form, phone: e.target.value })} style={{ width: '100%', padding: 12, border: '1px solid #e5e7eb', borderRadius: 10, fontSize: 13, marginBottom: 10, boxSizing: 'border-box', fontFamily: 'inherit' }} />
            <select value={form.role || 'admin'} onChange={(e) => setForm({ ...form, role: e.target.value })} style={{ width: '100%', padding: 12, border: '1px solid #e5e7eb', borderRadius: 10, fontSize: 13, marginBottom: 10, boxSizing: 'border-box', fontFamily: 'inherit' }}>
              {Object.entries(ROLES).map(([k, v]) => <option key={k} value={k}>{v.icon} {v.label}</option>)}
            </select>
            <input type="password" placeholder={editing ? 'كلمة مرور جديدة (اتركها فارغة)' : 'كلمة المرور *'} value={form.password || ''} onChange={(e) => setForm({ ...form, password: e.target.value })} style={{ width: '100%', padding: 12, border: '1px solid #e5e7eb', borderRadius: 10, fontSize: 13, marginBottom: 10, boxSizing: 'border-box', fontFamily: 'inherit' }} />
            <input type="password" placeholder="تأكيد كلمة المرور" value={form.password_confirm || ''} onChange={(e) => setForm({ ...form, password_confirm: e.target.value })} style={{ width: '100%', padding: 12, border: '1px solid #e5e7eb', borderRadius: 10, fontSize: 13, marginBottom: 10, boxSizing: 'border-box', fontFamily: 'inherit' }} />
            <label style={{ display: 'block', fontSize: 12, fontWeight: 800, color: '#334155', marginBottom: 6 }}>الصلاحيات</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginBottom: 16 }}>
              {PERMISSIONS.map(p => (
                <label key={p.key} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: 8, background: (form.permissions || []).includes(p.key) ? 'rgba(15,77,58,.08)' : '#f8fafc', borderRadius: 8, fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>
                  <input type="checkbox" checked={(form.permissions || []).includes(p.key)} onChange={() => togglePerm(p.key)} /> {p.label}
                </label>
              ))}
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
