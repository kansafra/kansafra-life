'use client';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/components/Toast';

async function hashPassword(password) {
  const encoder = new TextEncoder();
  const data = encoder.encode(password + 'sanad_salt_v1');
  const buf = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
}

const ENTITY_TYPES = [
  { key: 'merchant', label: 'متجر / محل' }, { key: 'restaurant', label: 'مطعم / مقهى' },
  { key: 'doctor', label: 'طبيب / عيادة' }, { key: 'pharmacy', label: 'صيدلية' },
  { key: 'school', label: 'مدرسة / معهد' }, { key: 'mosque', label: 'جامع' },
  { key: 'charity', label: 'جمعية' }, { key: 'sports', label: 'نادي رياضي' },
  { key: 'hotel', label: 'فندق' }, { key: 'office', label: 'مكتب' },
  { key: 'exchange', label: 'صرافة' }, { key: 'transport', label: 'مواصلات' },
  { key: 'memory', label: 'ذاكرة' }, { key: 'municipality', label: 'بلدية' },
  { key: 'craftsman', label: 'حرفي' }, { key: 'workshop', label: 'ورشة' },
  { key: 'isp', label: 'إنترنت' },
];

const PLANS = [
  { key: 'free', label: 'مجاني' },
  { key: 'basic', label: 'أساسي' },
  { key: 'pro', label: 'احترافي' },
  { key: 'enterprise', label: 'مؤسسي' },
];

export default function AdminEntityDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { success, error: toastError } = useToast();

  const [entity, setEntity] = useState(null);
  const [relatedEntities, setRelatedEntities] = useState([]);
  const [actionLog, setActionLog] = useState([]);
  const [employeesCount, setEmployeesCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('info');
  const [form, setForm] = useState({});
  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    const admin = JSON.parse(localStorage.getItem('sanad_admin') || 'null');
    if (!admin) { router.replace('/admin/login'); return; }
    loadEntity();
  }, [id, router]);

  async function loadEntity() {
    if (!supabase || !id) return;
    try {
      const { data, error } = await supabase.from('entities').select('*').eq('id', id).maybeSingle();
      if (error) throw error;
      if (!data) { router.push('/admin/entities'); return; }
      setEntity(data);
      setForm(data);

      if (data.owner_phone) {
        const { data: rel } = await supabase.from('entities')
          .select('id, display_name, entity_type, approval_status')
          .eq('owner_phone', data.owner_phone).neq('id', data.id);
        setRelatedEntities(rel || []);
      }

      const { data: log } = await supabase.from('admin_actions')
        .select('*').eq('target_id', data.id).order('created_at', { ascending: false }).limit(30);
      setActionLog(log || []);

      const { count } = await supabase.from('employees').select('*', { count: 'exact', head: true }).eq('entity_name', data.display_name);
      setEmployeesCount(count || 0);
    } catch (e) { console.error(e); toastError('فشل التحميل'); }
    finally { setLoading(false); }
  }

  async function logAction(actionType, details = {}) {
    try {
      const admin = JSON.parse(localStorage.getItem('sanad_admin') || 'null');
      await supabase.from('admin_actions').insert({
        admin_username: admin?.username || 'unknown',
        action_type: actionType,
        target_table: 'entities',
        target_id: entity.id,
        details: { name: entity.display_name, ...details },
      });
    } catch {}
  }

  async function saveBasicInfo(e) {
    e.preventDefault();
    setSaving(true);
    try {
      const updates = {
        display_name: form.display_name, description: form.description,
        phone: form.phone, whatsapp: form.whatsapp, address: form.address,
        city: form.city, entity_type: form.entity_type, working_hours: form.working_hours,
        lat: form.lat ? Number(form.lat) : null, lng: form.lng ? Number(form.lng) : null,
      };
      const { error } = await supabase.from('entities').update(updates).eq('id', entity.id);
      if (error) throw error;
      success('✅ تم الحفظ');
      await logAction('update_info');
      setEntity({ ...entity, ...updates });
    } catch (err) { toastError('فشل الحفظ'); }
    finally { setSaving(false); }
  }

  async function changeUsername(e) {
    e.preventDefault();
    if (!form.username?.trim()) { toastError('مطلوب'); return; }
    setSaving(true);
    try {
      const { error } = await supabase.from('entities')
        .update({ username: form.username.trim().toLowerCase() }).eq('id', entity.id);
      if (error) {
        if (error.code === '23505') toastError('اسم المستخدم مستخدم بالفعل');
        else throw error;
        return;
      }
      success('✅ تم التحديث');
      await logAction('change_username', { new: form.username });
      setEntity({ ...entity, username: form.username });
    } catch (err) { console.error(err); toastError('فشل'); }
    finally { setSaving(false); }
  }

  async function resetPassword() {
    if (!newPassword || newPassword.length < 6) { toastError('6 أحرف على الأقل'); return; }
    if (!confirm('إعادة تعيين كلمة المرور؟')) return;
    setSaving(true);
    try {
      const hashed = await hashPassword(newPassword);
      const { error } = await supabase.from('entities').update({ password_hash: hashed }).eq('id', entity.id);
      if (error) throw error;
      success('✅ تم إعادة التعيين');
      await logAction('reset_password');
      setNewPassword('');
    } catch (err) { toastError('فشل'); }
    finally { setSaving(false); }
  }

  async function renewSubscription(days) {
    if (!confirm(`تجديد ${days} يوم؟`)) return;
    setSaving(true);
    try {
      const base = entity.subscription_expires_at && new Date(entity.subscription_expires_at) > new Date()
        ? new Date(entity.subscription_expires_at) : new Date();
      const newExpiry = new Date(base.getTime() + days * 86400000);
      const { error } = await supabase.from('entities').update({ subscription_expires_at: newExpiry.toISOString() }).eq('id', entity.id);
      if (error) throw error;
      success(`✅ تجديد ${days} يوم`);
      await logAction('renew_subscription', { days });
      setEntity({ ...entity, subscription_expires_at: newExpiry.toISOString() });
    } catch (err) { toastError('فشل'); }
    finally { setSaving(false); }
  }

  async function changePlan(plan) {
    setSaving(true);
    try {
      const { error } = await supabase.from('entities').update({ subscription_plan: plan }).eq('id', entity.id);
      if (error) throw error;
      success('✅ تم تغيير الباقة');
      await logAction('change_plan', { plan });
      setEntity({ ...entity, subscription_plan: plan });
    } catch (err) { toastError('فشل'); }
    finally { setSaving(false); }
  }

  async function updateLimits(e) {
    e.preventDefault();
    setSaving(true);
    try {
      const updates = { max_employees: Number(form.max_employees) || 5, max_devices: Number(form.max_devices) || 2 };
      const { error } = await supabase.from('entities').update(updates).eq('id', entity.id);
      if (error) throw error;
      success('✅ تم التحديث');
      await logAction('update_limits', updates);
      setEntity({ ...entity, ...updates });
    } catch (err) { toastError('فشل'); }
    finally { setSaving(false); }
  }

  async function setStatus(status) {
    let reason = null;
    if (status === 'suspended') {
      reason = prompt('سبب الإيقاف؟');
      if (!reason) return;
    }
    setSaving(true);
    try {
      const updates = { approval_status: status, is_active: status === 'approved' };
      if (status === 'suspended') updates.suspended_reason = reason;
      const { error } = await supabase.from('entities').update(updates).eq('id', entity.id);
      if (error) throw error;
      success('✅ تم التحديث');
      await logAction('change_status', { status, reason });
      setEntity({ ...entity, ...updates });
    } catch (err) { toastError('فشل'); }
    finally { setSaving(false); }
  }

  async function deleteEntity() {
    if (!confirm(`⚠️ حذف "${entity.display_name}" نهائياً؟`)) return;
    if (prompt('اكتب "حذف" للتأكيد:') !== 'حذف') { toastError('ملغي'); return; }
    setSaving(true);
    try {
      await logAction('delete_entity');
      const { error } = await supabase.from('entities').delete().eq('id', entity.id);
      if (error) throw error;
      success('🗑️ تم الحذف');
      router.push('/admin/entities');
    } catch (err) { toastError('فشل الحذف'); }
    finally { setSaving(false); }
  }

  if (loading) return <div style={{ padding: 80, textAlign: 'center' }}>⏳</div>;
  if (!entity) return null;

  const daysLeft = entity.subscription_expires_at 
    ? Math.ceil((new Date(entity.subscription_expires_at) - new Date()) / 86400000) : null;

  const statusColors = {
    pending: { bg: 'rgba(245,158,11,0.1)', color: '#f59e0b', label: '⏳ قيد المراجعة' },
    approved: { bg: 'rgba(16,185,129,0.1)', color: '#10b981', label: '✅ مقبول' },
    rejected: { bg: 'rgba(239,68,68,0.1)', color: '#ef4444', label: '❌ مرفوض' },
    suspended: { bg: 'rgba(148,163,184,0.15)', color: '#64748b', label: '⏸️ موقوف' },
  };
  const sc = statusColors[entity.approval_status] || statusColors.pending;

  const TABS = [
    { key: 'info', label: '📝 البيانات' },
    { key: 'login', label: '🔐 الدخول' },
    { key: 'subscription', label: '💎 الاشتراك' },
    { key: 'limits', label: '📊 الحدود' },
    { key: 'related', label: '🏪 المرتبطة' },
    { key: 'log', label: '📜 السجل' },
    { key: 'danger', label: '⚠️ خطرة' },
  ];

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', paddingBottom: 40 }}>
      <div style={{ background: '#0f172a', padding: '16px 20px', position: 'sticky', top: 0, zIndex: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
          <Link href="/admin/entities" style={{ color: '#fff', textDecoration: 'none', fontSize: 20 }}>←</Link>
          <div style={{ flex: 1 }}>
            <div style={{ color: '#fff', fontSize: 16, fontWeight: 900 }}>{entity.display_name}</div>
            <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: 11, marginTop: 2 }}>@{entity.username}</div>
          </div>
          <div style={{ background: sc.bg, color: sc.color, padding: '4px 10px', borderRadius: 8, fontSize: 10, fontWeight: 900 }}>{sc.label}</div>
        </div>
        <div style={{ display: 'flex', gap: 6, overflowX: 'auto' }}>
          {TABS.map(t => (
            <button key={t.key} onClick={() => setActiveTab(t.key)} style={{ background: activeTab === t.key ? '#fff' : 'rgba(255,255,255,0.1)', color: activeTab === t.key ? '#0f172a' : '#fff', border: 'none', padding: '6px 12px', borderRadius: 20, fontSize: 11, fontWeight: 900, cursor: 'pointer', whiteSpace: 'nowrap', fontFamily: 'inherit' }}>{t.label}</button>
          ))}
        </div>
      </div>

      <div style={{ padding: 16, maxWidth: 700, margin: '0 auto' }}>

        {activeTab === 'info' && (
          <form onSubmit={saveBasicInfo} style={cardStyle}>
            <h2 style={titleStyle}>📝 البيانات الأساسية</h2>
            <div style={fieldStyle}><label style={labelStyle}>اسم النشاط</label>
              <input value={form.display_name || ''} onChange={e => setForm({ ...form, display_name: e.target.value })} style={inputStyle} required /></div>
            <div style={fieldStyle}><label style={labelStyle}>نوع النشاط</label>
              <select value={form.entity_type || ''} onChange={e => setForm({ ...form, entity_type: e.target.value })} style={inputStyle}>
                {ENTITY_TYPES.map(t => <option key={t.key} value={t.key}>{t.label}</option>)}
              </select></div>
            <div style={fieldStyle}><label style={labelStyle}>الوصف</label>
              <textarea value={form.description || ''} onChange={e => setForm({ ...form, description: e.target.value })} style={{ ...inputStyle, height: 70, resize: 'none' }} /></div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <div style={fieldStyle}><label style={labelStyle}>الهاتف</label>
                <input value={form.phone || ''} onChange={e => setForm({ ...form, phone: e.target.value })} style={inputStyle} /></div>
              <div style={fieldStyle}><label style={labelStyle}>واتساب</label>
                <input value={form.whatsapp || ''} onChange={e => setForm({ ...form, whatsapp: e.target.value })} style={inputStyle} /></div>
            </div>
            <div style={fieldStyle}><label style={labelStyle}>المدينة</label>
              <input value={form.city || ''} onChange={e => setForm({ ...form, city: e.target.value })} style={inputStyle} /></div>
            <div style={fieldStyle}><label style={labelStyle}>العنوان</label>
              <input value={form.address || ''} onChange={e => setForm({ ...form, address: e.target.value })} style={inputStyle} /></div>
            <div style={fieldStyle}><label style={labelStyle}>ساعات العمل</label>
              <input value={form.working_hours || ''} onChange={e => setForm({ ...form, working_hours: e.target.value })} style={inputStyle} placeholder="09:00 - 21:00" /></div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <div style={fieldStyle}><label style={labelStyle}>lat</label>
                <input value={form.lat || ''} onChange={e => setForm({ ...form, lat: e.target.value })} type="number" step="0.000001" style={inputStyle} /></div>
              <div style={fieldStyle}><label style={labelStyle}>lng</label>
                <input value={form.lng || ''} onChange={e => setForm({ ...form, lng: e.target.value })} type="number" step="0.000001" style={inputStyle} /></div>
            </div>
            <button type="submit" disabled={saving} style={btnPrimary}>{saving ? '⏳' : '💾 حفظ'}</button>
          </form>
        )}

        {activeTab === 'login' && (
          <div>
            <form onSubmit={changeUsername} style={cardStyle}>
              <h2 style={titleStyle}>👤 اسم المستخدم</h2>
              <p style={{ fontSize: 12, color: '#64748b', marginBottom: 12 }}>اسم الدخول للمتجر من `/merchant/login`</p>
              <div style={fieldStyle}><label style={labelStyle}>اسم المستخدم</label>
                <input value={form.username || ''} onChange={e => setForm({ ...form, username: e.target.value })} style={inputStyle} required /></div>
              <button type="submit" disabled={saving} style={btnPrimary}>{saving ? '⏳' : '💾 تحديث'}</button>
            </form>
            <div style={cardStyle}>
              <h2 style={titleStyle}>🔑 إعادة تعيين كلمة المرور</h2>
              <p style={{ fontSize: 12, color: '#64748b', marginBottom: 12 }}>كلمة المرور مشفرة، لا يمكن عرضها — فقط إعادة تعيينها</p>
              <div style={fieldStyle}><label style={labelStyle}>كلمة المرور الجديدة</label>
                <div style={{ position: 'relative' }}>
                  <input type={showPassword ? 'text' : 'password'} value={newPassword} onChange={e => setNewPassword(e.target.value)} style={{ ...inputStyle, paddingLeft: 44 }} placeholder="6 أحرف على الأقل" />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', fontSize: 18, cursor: 'pointer', padding: 4 }}>{showPassword ? '🙈' : '👁️'}</button>
                </div></div>
              <button onClick={resetPassword} disabled={saving || newPassword.length < 6} style={{ ...btnPrimary, background: saving || newPassword.length < 6 ? '#94a3b8' : 'linear-gradient(135deg, #ef4444, #dc2626)' }}>
                🔄 إعادة تعيين كلمة المرور
              </button>
            </div>
          </div>
        )}

        {activeTab === 'subscription' && (
          <div>
            <div style={cardStyle}>
              <h2 style={titleStyle}>💎 الاشتراك الحالي</h2>
              <div style={{ background: '#f8fafc', borderRadius: 12, padding: 16, marginBottom: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 13 }}>
                  <span style={{ color: '#64748b' }}>الباقة</span>
                  <strong>{PLANS.find(p => p.key === entity.subscription_plan)?.label || entity.subscription_plan}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 13 }}>
                  <span style={{ color: '#64748b' }}>ينتهي في</span>
                  <strong>{entity.subscription_expires_at ? new Date(entity.subscription_expires_at).toLocaleDateString('ar-SY') : '—'}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                  <span style={{ color: '#64748b' }}>الحالة</span>
                  <strong style={{ color: daysLeft > 0 ? '#10b981' : '#ef4444' }}>
                    {daysLeft > 0 ? `متبقي ${daysLeft} يوم` : 'منتهي'}
                  </strong>
                </div>
              </div>
              <label style={labelStyle}>تغيير الباقة</label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 6 }}>
                {PLANS.map(p => (
                  <button key={p.key} type="button" onClick={() => changePlan(p.key)} disabled={saving || entity.subscription_plan === p.key} style={{
                    padding: 10, background: entity.subscription_plan === p.key ? 'rgba(16,185,129,0.1)' : '#f8fafc',
                    color: entity.subscription_plan === p.key ? '#10b981' : '#475569',
                    border: entity.subscription_plan === p.key ? '2px solid #10b981' : '1px solid #e2e8f0',
                    borderRadius: 8, fontSize: 12, fontWeight: 900, cursor: entity.subscription_plan === p.key ? 'default' : 'pointer', fontFamily: 'inherit'
                  }}>{p.label} {entity.subscription_plan === p.key && '✓'}</button>
                ))}
              </div>
            </div>
            <div style={cardStyle}>
              <h2 style={titleStyle}>🔄 تجديد الاشتراك</h2>
              <p style={{ fontSize: 12, color: '#64748b', marginBottom: 12 }}>التجديد يضيف المدة على التاريخ الحالي</p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
                {[30, 90, 180, 365].map(d => (
                  <button key={d} type="button" onClick={() => renewSubscription(d)} disabled={saving} style={{ padding: 12, background: '#f8fafc', color: '#0f4d3a', border: '1px solid #cbd5e1', borderRadius: 10, fontSize: 13, fontWeight: 900, cursor: saving ? 'wait' : 'pointer', fontFamily: 'inherit' }}>
                    + {d === 365 ? 'سنة' : `${d} يوم`}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'limits' && (
          <form onSubmit={updateLimits} style={cardStyle}>
            <h2 style={titleStyle}>📊 الحدود</h2>
            <div style={fieldStyle}><label style={labelStyle}>الحد الأقصى للموظفين</label>
              <input type="number" value={form.max_employees || 5} onChange={e => setForm({ ...form, max_employees: e.target.value })} style={inputStyle} min={1} max={100} /></div>
            <div style={fieldStyle}><label style={labelStyle}>الحد الأقصى للأجهزة النشطة</label>
              <input type="number" value={form.max_devices || 2} onChange={e => setForm({ ...form, max_devices: e.target.value })} style={inputStyle} min={1} max={20} /></div>
            <button type="submit" disabled={saving} style={btnPrimary}>{saving ? '⏳' : '💾 حفظ'}</button>
          </form>
        )}

        {activeTab === 'related' && (
          <div style={cardStyle}>
            <h2 style={titleStyle}>🏪 المتاجر المرتبطة</h2>
            <p style={{ fontSize: 12, color: '#64748b', marginBottom: 12 }}>
              كل المتاجر برقم المالك: <strong>{entity.owner_phone || 'غير محدد'}</strong>
            </p>
            <div style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: 12, padding: 12, marginBottom: 12 }}>
              <div style={{ fontSize: 10, color: '#059669', fontWeight: 900, marginBottom: 4 }}>الحالي</div>
              <div style={{ fontSize: 14, fontWeight: 900, color: '#0f172a' }}>{entity.display_name}</div>
              <div style={{ fontSize: 10, color: '#64748b', marginTop: 2 }}>{employeesCount} موظف</div>
            </div>
            {relatedEntities.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 20, color: '#94a3b8', fontSize: 12 }}>لا توجد متاجر أخرى</div>
            ) : relatedEntities.map(rel => (
              <Link key={rel.id} href={`/admin/entities/${rel.id}`} style={{ display: 'block', background: '#f8fafc', borderRadius: 10, padding: 12, marginBottom: 6, textDecoration: 'none', color: 'inherit' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 900, color: '#0f172a' }}>{rel.display_name}</div>
                    <div style={{ fontSize: 10, color: '#64748b', marginTop: 2 }}>{rel.entity_type}</div>
                  </div>
                  <div style={{ fontSize: 10, color: rel.approval_status === 'approved' ? '#10b981' : '#f59e0b', fontWeight: 900 }}>
                    {rel.approval_status === 'approved' ? '✅' : '⏳'}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        {activeTab === 'log' && (
          <div style={cardStyle}>
            <h2 style={titleStyle}>📜 سجل الإجراءات</h2>
            {actionLog.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 20, color: '#94a3b8', fontSize: 12 }}>لا توجد إجراءات</div>
            ) : actionLog.map(log => (
              <div key={log.id} style={{ borderBottom: '1px solid #f1f5f9', paddingBottom: 10, marginBottom: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
                  <strong style={{ color: '#0f172a' }}>{formatAction(log.action_type)}</strong>
                  <span style={{ color: '#94a3b8', fontSize: 10 }}>{new Date(log.created_at).toLocaleString('ar-SY')}</span>
                </div>
                <div style={{ fontSize: 10, color: '#64748b' }}>@{log.admin_username}</div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'danger' && (
          <div style={{ ...cardStyle, borderColor: '#fecaca' }}>
            <h2 style={titleStyle}>⚠️ إجراءات خطرة</h2>
            {entity.approval_status !== 'suspended' ? (
              <button onClick={() => setStatus('suspended')} disabled={saving} style={{ width: '100%', padding: 12, background: 'rgba(245,158,11,0.1)', color: '#f59e0b', border: '1px solid rgba(245,158,11,0.3)', borderRadius: 10, fontSize: 13, fontWeight: 900, cursor: 'pointer', fontFamily: 'inherit', marginBottom: 8 }}>
                ⏸️ إيقاف المتجر
              </button>
            ) : (
              <button onClick={() => setStatus('approved')} disabled={saving} style={{ width: '100%', padding: 12, background: 'rgba(16,185,129,0.1)', color: '#10b981', border: '1px solid rgba(16,185,129,0.3)', borderRadius: 10, fontSize: 13, fontWeight: 900, cursor: 'pointer', fontFamily: 'inherit', marginBottom: 8 }}>
                ✅ إعادة تفعيل
              </button>
            )}
            <button onClick={deleteEntity} disabled={saving} style={{ width: '100%', padding: 12, background: 'rgba(239,68,68,0.1)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 10, fontSize: 13, fontWeight: 900, cursor: 'pointer', fontFamily: 'inherit' }}>
              🗑️ حذف المتجر نهائياً
            </button>
            <div style={{ fontSize: 10, color: '#ef4444', marginTop: 8, textAlign: 'center', fontWeight: 800 }}>
              ⚠️ الحذف لا يمكن التراجع عنه
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function formatAction(type) {
  const map = {
    update_info: '📝 تحديث البيانات', change_username: '👤 تغيير اسم المستخدم',
    reset_password: '🔑 إعادة تعيين كلمة المرور', renew_subscription: '💎 تجديد',
    change_plan: '📊 تغيير الباقة', change_status: '🔄 تغيير الحالة',
    update_limits: '📈 تحديث الحدود', delete_entity: '🗑️ حذف',
  };
  return map[type] || type;
}

const cardStyle = { background: '#fff', borderRadius: 16, padding: 16, marginBottom: 12, border: '1px solid #e2e8f0' };
const titleStyle = { fontSize: 15, fontWeight: 900, color: '#0f172a', margin: '0 0 16px' };
const fieldStyle = { marginBottom: 12 };
const labelStyle = { display: 'block', fontSize: 12, fontWeight: 800, color: '#475569', marginBottom: 6 };
const inputStyle = { width: '100%', padding: '12px 14px', borderRadius: 10, border: '1px solid #cbd5e1', fontSize: 14, fontFamily: 'inherit', boxSizing: 'border-box', outline: 'none', background: '#f8fafc' };
const btnPrimary = { width: '100%', padding: 14, background: '#0f4d3a', color: '#fff', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 900, cursor: 'pointer', fontFamily: 'inherit', marginTop: 8 };
