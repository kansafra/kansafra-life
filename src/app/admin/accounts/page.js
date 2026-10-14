'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

const TYPES = [
  { k: 'merchant', l: '🏪 متجر' },
  { k: 'restaurant', l: '🍽️ مطعم' },
  { k: 'doctor', l: '👨‍⚕️ طبيب' },
  { k: 'pharmacy', l: '💊 صيدلية' },
  { k: 'school', l: '🏫 مدرسة' },
  { k: 'mosque', l: '🕌 جامع' },
  { k: 'council', l: '🏛️ مجلس' },
  { k: 'municipality', l: '🏢 بلدية' },
  { k: 'charity', l: '🤝 جمعية' },
  { k: 'sports', l: '⚽ نادي' },
  { k: 'memory', l: '📸 ذاكرة' },
  { k: 'office', l: '📁 مكتب' },
  { k: 'transport', l: '🚗 مواصلات' },
  { k: 'exchange', l: '💱 صرافة' },
];

function randomPassword(len = 12) {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$';
  let out = '';
  for (let i = 0; i < len; i++) out += chars[Math.floor(Math.random() * chars.length)];
  return out;
}

export default function AdminAccounts() {
  const router = useRouter();
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [mode, setMode] = useState(null);
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [changingPw, setChangingPw] = useState(null);
  const [form, setForm] = useState({});
  const [newPassword, setNewPassword] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let stored = null;
    try { stored = JSON.parse(localStorage.getItem('sanad_admin') || 'null'); } catch {}
    if (!stored) { router.replace('/admin/login'); return; }
    load();
  }, [router]);

  async function load() {
    if (!supabase) return;
    const { data } = await supabase.from('entities').select('*').order('created_at', { ascending: false });
    setAccounts(Array.isArray(data) ? data : []);
    setLoading(false);
  }

  function openAdd() {
    setMode('add');
    setForm({
      username: '', password_hash: randomPassword(), display_name: '', entity_type: 'merchant',
      phone: '', email: '', bio: '', logo_url: '', is_active: true,
    });
  }

  function openEdit(a) {
    setMode('edit');
    setEditing(a);
    setForm({
      username: a.username,
      display_name: a.display_name,
      entity_type: a.entity_type,
      phone: a.phone || '',
      email: a.email || '',
      bio: a.bio || '',
      logo_url: a.logo_url || '',
      is_active: a.is_active,
    });
  }

  async function save() {
    if (!form.username?.trim() || !form.display_name?.trim()) {
      alert('اسم المستخدم والاسم مطلوبان');
      return;
    }
    setSaving(true);
    const payload = {
      username: form.username.trim().toLowerCase().replace(/\s+/g, ''),
      display_name: form.display_name.trim(),
      entity_type: form.entity_type,
      phone: form.phone?.trim() || null,
      email: form.email?.trim() || null,
      bio: form.bio?.trim() || null,
      logo_url: form.logo_url?.trim() || null,
      is_active: form.is_active === true || form.is_active === 'true',
    };
    if (mode === 'add') {
      payload.password_hash = form.password_hash || randomPassword();
    }

    let err;
    let msg = '';
    if (mode === 'add') {
      ({ error: err } = await supabase.from('entities').insert(payload));
      if (!err) msg = `✅ تم إنشاء الحساب\n\nاسم المستخدم: ${payload.username}\nكلمة المرور: ${payload.password_hash}`;
    } else {
      ({ error: err } = await supabase.from('entities').update(payload).eq('id', editing.id));
    }
    setSaving(false);
    if (err) { alert('تعذّر الحفظ: ' + err.message); return; }
    if (msg) alert(msg);
    setMode(null); setEditing(null);
    load();
  }

  async function changePassword() {
    if (!newPassword || newPassword.length < 6) {
      alert('كلمة المرور يجب أن تكون 6 أحرف على الأقل');
      return;
    }
    setSaving(true);
    const { error } = await supabase.from('entities').update({ password_hash: newPassword }).eq('id', changingPw.id);
    setSaving(false);
    if (error) { alert('تعذّر التغيير'); return; }

    await supabase.from('account_changes').insert({
      entity_username: changingPw.username,
      change_type: 'password_reset',
      new_value: '(مخفي)',
    });
    alert(`✅ تم تغيير كلمة المرور\n\nكلمة المرور الجديدة: ${newPassword}\n\nاحفظها وأرسلها للمستخدم`);
    setChangingPw(null);
    setNewPassword('');
  }

  async function del(a) {
    if (!confirm(`حذف الحساب "${a.display_name}" نهائياً؟\n\nلا يمكن التراجع!`)) return;
    await supabase.from('entities').delete().eq('id', a.id);
    setDeleting(null);
    load();
  }

  async function toggleActive(a) {
    await supabase.from('entities').update({ is_active: !a.is_active }).eq('id', a.id);
    load();
  }

  const filtered = accounts.filter((a) => {
    if (!search.trim()) return true;
    const q = search.trim().toLowerCase();
    return (a.display_name || '').toLowerCase().includes(q)
      || (a.username || '').toLowerCase().includes(q)
      || (a.phone || '').includes(q);
  });

  const typeLabel = (t) => TYPES.find((x) => x.k === t)?.l || t;

  return (
    <div className="admin-page">
      <div className="admin-sub-header">
        <Link href="/admin" className="admin-sub-back">→</Link>
        <span className="admin-sub-title">👥 إدارة الحسابات</span>
        <button className="mng-add-btn" onClick={openAdd} type="button">+ حساب</button>
      </div>

      <div className="admin-search">
        <input type="text" placeholder="ابحث..." value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      {loading ? (
        <div className="sect-empty"><span className="em">⏳</span></div>
      ) : filtered.length === 0 ? (
        <div className="sect-empty"><span className="em">👥</span><p>لا توجد حسابات</p></div>
      ) : (
        <div style={{ padding: '14px 20px 30px' }}>
          {filtered.map((a) => (
            <div key={a.id} className="admin-item" style={{ marginBottom: 8 }}>
              <div className="admin-item-icon">{typeLabel(a.entity_type).split(' ')[0]}</div>
              <div className="admin-item-body">
                <div className="admin-item-title" style={{ color: '#fff' }}>{a.display_name}</div>
                <div className="admin-item-meta">
                  <span>@{a.username}</span>
                  {a.phone && <span>{a.phone}</span>}
                  <span className={`admin-badge ${a.is_active ? 'active' : 'danger'}`}>
                    {a.is_active ? 'نشط' : 'موقوف'}
                  </span>
                </div>
              </div>
              <div className="admin-item-actions">
                <button className="admin-act-btn" onClick={() => openEdit(a)} type="button" title="تعديل">✏️</button>
                <button className="admin-act-btn ok" onClick={() => toggleActive(a)} type="button" title={a.is_active ? 'إيقاف' : 'تفعيل'}>
                  {a.is_active ? '⏸' : '▶'}
                </button>
                <button className="admin-act-btn" onClick={() => setChangingPw(a)} type="button" title="كلمة المرور" style={{ background: 'rgba(232,185,35,.15)', color: '#e8b923' }}>🔑</button>
                <button className="admin-act-btn del" onClick={() => setDeleting(a)} type="button" title="حذف">✕</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Modal */}
      {mode && (
        <div className="mng-modal-bg" onClick={() => { setMode(null); setEditing(null); }}>
          <div className="mng-modal" onClick={(e) => e.stopPropagation()} style={{ background: '#101010' }}>
            <div className="mng-modal-handle" />
            <h3 className="mng-modal-title" style={{ color: '#fff' }}>
              {mode === 'add' ? '➕ حساب جديد' : '✏️ تعديل الحساب'}
            </h3>

            <div className="new-service-field">
              <label className="new-service-label" style={{ color: 'rgba(255,255,255,.6)' }}>اسم المستخدم *</label>
              <input className="new-service-input" value={form.username || ''} onChange={(e) => setForm({ ...form, username: e.target.value })} autoCapitalize="none" />
            </div>

            {mode === 'add' && (
              <div className="new-service-field">
                <label className="new-service-label" style={{ color: 'rgba(255,255,255,.6)' }}>
                  كلمة المرور (تلقائية — احفظها!)
                </label>
                <div style={{ display: 'flex', gap: 6 }}>
                  <input className="new-service-input" value={form.password_hash || ''} onChange={(e) => setForm({ ...form, password_hash: e.target.value })} style={{ fontFamily: 'monospace' }} />
                  <button type="button" onClick={() => setForm({ ...form, password_hash: randomPassword() })} style={{ padding: '0 12px', borderRadius: 12, background: 'rgba(232,185,35,.15)', color: '#e8b923', border: 'none', fontWeight: 800, cursor: 'pointer' }}>🔄</button>
                </div>
              </div>
            )}

            <div className="new-service-field">
              <label className="new-service-label" style={{ color: 'rgba(255,255,255,.6)' }}>اسم النشاط *</label>
              <input className="new-service-input" value={form.display_name || ''} onChange={(e) => setForm({ ...form, display_name: e.target.value })} />
            </div>

            <div className="new-service-field">
              <label className="new-service-label" style={{ color: 'rgba(255,255,255,.6)' }}>نوع النشاط</label>
              <select className="new-service-select" value={form.entity_type || 'merchant'} onChange={(e) => setForm({ ...form, entity_type: e.target.value })}>
                {TYPES.map((t) => <option key={t.k} value={t.k}>{t.l}</option>)}
              </select>
            </div>

            <div className="new-prod-row">
              <div className="new-service-field">
                <label className="new-service-label" style={{ color: 'rgba(255,255,255,.6)' }}>الهاتف</label>
                <input className="new-service-input" type="tel" value={form.phone || ''} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
              </div>
              <div className="new-service-field">
                <label className="new-service-label" style={{ color: 'rgba(255,255,255,.6)' }}>البريد</label>
                <input className="new-service-input" type="email" value={form.email || ''} onChange={(e) => setForm({ ...form, email: e.target.value })} />
              </div>
            </div>

            <div className="new-service-field">
              <label className="new-service-label" style={{ color: 'rgba(255,255,255,.6)' }}>رابط الشعار</label>
              <input className="new-service-input" type="url" value={form.logo_url || ''} onChange={(e) => setForm({ ...form, logo_url: e.target.value })} />
            </div>

            <div className="new-service-field">
              <label className="new-service-label" style={{ color: 'rgba(255,255,255,.6)' }}>نبذة</label>
              <textarea className="new-service-textarea" rows={3} value={form.bio || ''} onChange={(e) => setForm({ ...form, bio: e.target.value })} />
            </div>

            <div className="new-service-field">
              <label className="new-service-label" style={{ color: 'rgba(255,255,255,.6)' }}>الحالة</label>
              <select className="new-service-select" value={String(form.is_active)} onChange={(e) => setForm({ ...form, is_active: e.target.value })}>
                <option value="true">نشط</option>
                <option value="false">موقوف</option>
              </select>
            </div>

            <div className="admin-form-actions">
              <button className="mng-btn ghost" onClick={() => { setMode(null); setEditing(null); }} type="button">إلغاء</button>
              <button className="mng-btn primary" onClick={save} disabled={saving} type="button">
                {saving ? '...' : mode === 'add' ? '✓ إنشاء' : '✓ حفظ'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Change Password Modal */}
      {changingPw && (
        <div className="mng-modal-bg" onClick={() => { setChangingPw(null); setNewPassword(''); }}>
          <div className="mng-modal" onClick={(e) => e.stopPropagation()} style={{ background: '#101010' }}>
            <div className="mng-modal-handle" />
            <h3 className="mng-modal-title" style={{ color: '#fff' }}>🔑 تغيير كلمة المرور</h3>
            <div style={{ background: 'rgba(255,255,255,.04)', padding: 12, borderRadius: 12, marginBottom: 14 }}>
              <div style={{ fontSize: 13, fontWeight: 800, color: '#fff', marginBottom: 4 }}>{changingPw.display_name}</div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,.5)' }}>@{changingPw.username}</div>
            </div>
            <div className="new-service-field">
              <label className="new-service-label" style={{ color: 'rgba(255,255,255,.6)' }}>كلمة المرور الجديدة</label>
              <div style={{ display: 'flex', gap: 6 }}>
                <input className="new-service-input" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} style={{ fontFamily: 'monospace' }} />
                <button type="button" onClick={() => setNewPassword(randomPassword())} style={{ padding: '0 12px', borderRadius: 12, background: 'rgba(232,185,35,.15)', color: '#e8b923', border: 'none', fontWeight: 800, cursor: 'pointer' }}>🔄</button>
              </div>
            </div>
            <div className="admin-form-actions">
              <button className="mng-btn ghost" onClick={() => { setChangingPw(null); setNewPassword(''); }} type="button">إلغاء</button>
              <button className="mng-btn primary" onClick={changePassword} disabled={saving} type="button">
                {saving ? '...' : '✓ تغيير'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm */}
      {deleting && (
        <div className="mng-modal-bg" onClick={() => setDeleting(null)}>
          <div className="mng-modal" onClick={(e) => e.stopPropagation()} style={{ background: '#101010', textAlign: 'center' }}>
            <div className="mng-modal-handle" />
            <div style={{ fontSize: 44, marginBottom: 12 }}>⚠️</div>
            <h3 className="mng-modal-title" style={{ color: '#fff' }}>حذف الحساب؟</h3>
            <p style={{ color: 'rgba(255,255,255,.5)', fontSize: 13, marginBottom: 20, lineHeight: 1.6 }}>
              سيتم حذف <strong style={{ color: '#fff' }}>{deleting.display_name}</strong> نهائياً.
              <br />كل البيانات (منتجات، طلبات) ستبقى لكن الحساب سيختفي.
            </p>
            <div className="admin-form-actions">
              <button className="mng-btn ghost" onClick={() => setDeleting(null)} type="button">إلغاء</button>
              <button className="mng-btn del" onClick={() => del(deleting)} type="button">✓ حذف نهائي</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
