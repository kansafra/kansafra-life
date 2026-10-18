'use client';
import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { useCurrentUser } from '@/lib/useCurrentUser';
import { useToast } from '@/components/Toast';
import { SkeletonList } from '@/components/Skeleton';
import EmptyState from '@/components/EmptyState';

const PERMIT_TYPES = ['رخصة بناء', 'رخصة تجارية', 'شهادة سكن', 'تصريح حفر', 'تصريح إعلان', 'شهادة وفاة', 'شهادة ميلاد', 'أخرى'];
const STATUS = {
  pending: { label: 'قيد الانتظار', color: '#f59e0b', icon: '⏳' },
  approved: { label: 'موافق عليها', color: '#10b981', icon: '✅' },
  rejected: { label: 'مرفوضة', color: '#ef4444', icon: '❌' },
  issued: { label: 'صادرة', color: '#3b82f6', icon: '📋' },
};

export default function PermitsPage() {
  const router = useRouter();
  const { user, loading: uL } = useCurrentUser();
  const { success, error: tE } = useToast();
  const [permits, setPermits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (uL) return;
    if (!user) { router.replace('/login'); return; }
    load();
  }, [user, uL]);

  async function load() {
    if (!supabase) { setLoading(false); return; }
    const { data } = await supabase.from('municipal_permits').select('*').order('created_at', { ascending: false });
    setPermits(data || []);
    setLoading(false);
  }

  const filtered = useMemo(() => {
    let list = permits;
    if (filter !== 'all') list = list.filter(p => p.status === filter);
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(p => (p.permit_number || '').toLowerCase().includes(q) || (p.citizen_name || '').toLowerCase().includes(q) || (p.citizen_phone || '').includes(q));
    }
    return list;
  }, [permits, filter, search]);

  const stats = useMemo(() => ({
    total: permits.length,
    pending: permits.filter(p => p.status === 'pending').length,
    issued: permits.filter(p => p.status === 'issued').length,
    revenue: permits.filter(p => p.is_paid).reduce((s, p) => s + Number(p.fee || 0), 0),
  }), [permits]);

  function openAdd() {
    const num = 'PM-' + Date.now().toString().slice(-8);
    setForm({ permit_number: num, citizen_name: '', citizen_phone: '', permit_type: 'رخصة بناء', description: '', fee: 0, status: 'pending' });
    setModal('add');
  }

  function openEdit(p) { setForm({ ...p }); setModal('edit'); }

  async function save() {
    if (!form.citizen_name?.trim()) { tE('اسم المواطن مطلوب'); return; }
    if (!form.citizen_phone?.trim()) { tE('الهاتف مطلوب'); return; }
    setSaving(true);
    try {
      const payload = {
        permit_number: form.permit_number,
        citizen_name: form.citizen_name.trim(),
        citizen_phone: form.citizen_phone.trim(),
        permit_type: form.permit_type,
        description: form.description?.trim() || null,
        fee: Number(form.fee) || 0,
        status: form.status || 'pending',
        notes: form.notes?.trim() || null,
        is_paid: form.is_paid === true,
        issued_at: form.status === 'issued' && !form.issued_at ? new Date().toISOString() : form.issued_at,
      };
      let err;
      if (modal === 'edit') ({ error: err } = await supabase.from('municipal_permits').update(payload).eq('id', form.id));
      else ({ error: err } = await supabase.from('municipal_permits').insert(payload));
      if (err) throw err;
      success(modal === 'edit' ? '✅ تم التعديل' : '✅ تمت الإضافة');
      setModal(null); load();
    } catch (e) { tE('تعذّر: ' + e.message); }
    setSaving(false);
  }

  async function updateStatus(p, newStatus) {
    const updates = { status: newStatus };
    if (newStatus === 'issued') updates.issued_at = new Date().toISOString();
    await supabase.from('municipal_permits').update(updates).eq('id', p.id);
    success('✅ تم التحديث'); load();
  }

  async function togglePaid(p) {
    await supabase.from('municipal_permits').update({ is_paid: !p.is_paid }).eq('id', p.id);
    load();
  }

  if (uL || loading) return <div style={{ padding: 16, background: '#f8fafc', minHeight: '100vh' }}><SkeletonList count={4} /></div>;

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', paddingBottom: 80 }}>
      <div style={{ position: 'sticky', top: 0, zIndex: 10, background: '#1e40af', padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <Link href="/merchant/municipal" style={{ color: '#fff', textDecoration: 'none', fontSize: 20, width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,.15)', borderRadius: '50%' }}>→</Link>
        <div style={{ flex: 1 }}>
          <div style={{ color: '#fff', fontSize: 16, fontWeight: 900 }}>📋 المعاملات والرخص</div>
          <div style={{ color: 'rgba(255,255,255,.8)', fontSize: 11, marginTop: 2 }}>{permits.length} معاملة</div>
        </div>
        <button onClick={openAdd} style={{ background: '#fff', color: '#1e40af', border: 'none', padding: '8px 14px', borderRadius: 10, fontSize: 12, fontWeight: 900, cursor: 'pointer', fontFamily: 'inherit' }}>+ معاملة</button>
      </div>

      <div style={{ padding: 16, display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
        <div style={{ background: '#fff', borderRadius: 12, padding: 10, textAlign: 'center', border: '1px solid #e5e7eb' }}>
          <div style={{ fontSize: 18, fontWeight: 900, color: '#0f172a' }}>{stats.total}</div>
          <div style={{ fontSize: 9, color: '#64748b', fontWeight: 700 }}>الكل</div>
        </div>
        <div style={{ background: '#fff', borderRadius: 12, padding: 10, textAlign: 'center', border: '1px solid #e5e7eb' }}>
          <div style={{ fontSize: 18, fontWeight: 900, color: '#f59e0b' }}>{stats.pending}</div>
          <div style={{ fontSize: 9, color: '#64748b', fontWeight: 700 }}>معلقة</div>
        </div>
        <div style={{ background: '#fff', borderRadius: 12, padding: 10, textAlign: 'center', border: '1px solid #e5e7eb' }}>
          <div style={{ fontSize: 18, fontWeight: 900, color: '#3b82f6' }}>{stats.issued}</div>
          <div style={{ fontSize: 9, color: '#64748b', fontWeight: 700 }}>صادرة</div>
        </div>
        <div style={{ background: '#fff', borderRadius: 12, padding: 10, textAlign: 'center', border: '1px solid #e5e7eb' }}>
          <div style={{ fontSize: 13, fontWeight: 900, color: '#10b981' }}>{stats.revenue.toLocaleString()}</div>
          <div style={{ fontSize: 9, color: '#64748b', fontWeight: 700 }}>الإيرادات</div>
        </div>
      </div>

      <div style={{ padding: '0 16px 12px' }}>
        <input type="text" placeholder="🔍 ابحث برقم المعاملة أو الاسم..." value={search} onChange={(e) => setSearch(e.target.value)}
          style={{ width: '100%', padding: '12px 14px', border: '1px solid #e5e7eb', borderRadius: 12, fontSize: 13, fontFamily: 'inherit', boxSizing: 'border-box', outline: 'none', background: '#fff', marginBottom: 10 }} />
        <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 4 }}>
          {[['all', 'الكل'], ['pending', 'معلقة'], ['approved', 'موافق'], ['issued', 'صادرة'], ['rejected', 'مرفوضة']].map(([k, l]) => (
            <button key={k} onClick={() => setFilter(k)} style={{ padding: '8px 14px', background: filter === k ? '#1e40af' : '#fff', color: filter === k ? '#fff' : '#64748b', border: `1px solid ${filter === k ? '#1e40af' : '#e5e7eb'}`, borderRadius: 10, fontSize: 11.5, fontWeight: 800, cursor: 'pointer', whiteSpace: 'nowrap', fontFamily: 'inherit' }}>{l}</button>
          ))}
        </div>
      </div>

      <div style={{ padding: '0 16px' }}>
        {filtered.length === 0 ? (
          <EmptyState icon="📋" title="لا توجد معاملات" description="أضف معاملة جديدة" actionLabel="+ معاملة" onAction={openAdd} />
        ) : filtered.map(p => {
          const s = STATUS[p.status] || STATUS.pending;
          return (
            <div key={p.id} style={{ background: '#fff', borderRadius: 14, padding: 14, marginBottom: 10, border: '1px solid #e5e7eb' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 900, fontFamily: 'monospace', color: '#1e40af', marginBottom: 4 }}>{p.permit_number}</div>
                  <div style={{ fontSize: 14, fontWeight: 900, color: '#0f172a' }}>{p.citizen_name}</div>
                  <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>📂 {p.permit_type} · 📞 {p.citizen_phone}</div>
                </div>
                <span style={{ background: `${s.color}20`, color: s.color, padding: '3px 10px', borderRadius: 6, fontSize: 9.5, fontWeight: 900, height: 'fit-content' }}>{s.icon} {s.label}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 10, borderTop: '1px solid #f1f5f9', marginBottom: 10 }}>
                <div style={{ fontSize: 13, fontWeight: 900, color: p.is_paid ? '#10b981' : '#ef4444' }}>
                  {Number(p.fee).toLocaleString()} SYP {p.is_paid ? '· ✓ مدفوع' : '· غير مدفوع'}
                </div>
                {p.status === 'pending' && (
                  <div style={{ display: 'flex', gap: 4 }}>
                    <button onClick={() => updateStatus(p, 'approved')} style={{ padding: '6px 10px', background: 'rgba(16,185,129,.1)', color: '#10b981', border: 'none', borderRadius: 6, fontSize: 10, fontWeight: 900, cursor: 'pointer', fontFamily: 'inherit' }}>✓ موافقة</button>
                    <button onClick={() => updateStatus(p, 'rejected')} style={{ padding: '6px 10px', background: 'rgba(220,38,38,.1)', color: '#dc2626', border: 'none', borderRadius: 6, fontSize: 10, fontWeight: 900, cursor: 'pointer', fontFamily: 'inherit' }}>✕ رفض</button>
                  </div>
                )}
                {p.status === 'approved' && (
                  <button onClick={() => updateStatus(p, 'issued')} style={{ padding: '6px 12px', background: 'linear-gradient(135deg,#3b82f6,#2563eb)', color: '#fff', border: 'none', borderRadius: 6, fontSize: 10, fontWeight: 900, cursor: 'pointer', fontFamily: 'inherit' }}>📋 إصدار</button>
                )}
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                <button onClick={() => togglePaid(p)} style={{ flex: 1, padding: 6, background: p.is_paid ? 'rgba(16,185,129,.1)' : '#f1f5f9', color: p.is_paid ? '#10b981' : '#64748b', border: 'none', borderRadius: 6, fontSize: 10, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit' }}>{p.is_paid ? '✓ مدفوع' : '💰 تسجيل دفع'}</button>
                <button onClick={() => openEdit(p)} style={{ padding: 6, background: '#f1f5f9', border: 'none', borderRadius: 6, fontSize: 10, cursor: 'pointer', fontFamily: 'inherit' }}>✏️</button>
              </div>
            </div>
          );
        })}
      </div>

      {modal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.6)', zIndex: 100, display: 'flex', alignItems: 'flex-end' }} onClick={() => setModal(null)}>
          <div style={{ background: '#fff', borderRadius: '24px 24px 0 0', width: '100%', maxWidth: 500, margin: '0 auto', padding: '24px 20px 30px', maxHeight: '90vh', overflowY: 'auto' }} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ fontSize: 18, fontWeight: 900, marginBottom: 16 }}>{modal === 'edit' ? 'تعديل معاملة' : 'معاملة جديدة'}</h3>

            <input type="text" value={form.permit_number || ''} disabled style={{ width: '100%', padding: 12, border: '1px solid #e5e7eb', borderRadius: 10, fontSize: 13, marginBottom: 10, boxSizing: 'border-box', fontFamily: 'monospace', background: '#f8fafc', textAlign: 'center', fontWeight: 900, color: '#1e40af' }} />
            <input type="text" placeholder="اسم المواطن *" value={form.citizen_name || ''} onChange={(e) => setForm({ ...form, citizen_name: e.target.value })} style={{ width: '100%', padding: 12, border: '1px solid #e5e7eb', borderRadius: 10, fontSize: 13, marginBottom: 10, boxSizing: 'border-box', fontFamily: 'inherit' }} />
            <input type="tel" placeholder="الهاتف *" value={form.citizen_phone || ''} onChange={(e) => setForm({ ...form, citizen_phone: e.target.value })} style={{ width: '100%', padding: 12, border: '1px solid #e5e7eb', borderRadius: 10, fontSize: 13, marginBottom: 10, boxSizing: 'border-box', fontFamily: 'inherit', direction: 'ltr', textAlign: 'right' }} />
            <select value={form.permit_type || 'رخصة بناء'} onChange={(e) => setForm({ ...form, permit_type: e.target.value })} style={{ width: '100%', padding: 12, border: '1px solid #e5e7eb', borderRadius: 10, fontSize: 13, marginBottom: 10, boxSizing: 'border-box', fontFamily: 'inherit' }}>
              {PERMIT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
            <textarea placeholder="وصف المعاملة" value={form.description || ''} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} style={{ width: '100%', padding: 12, border: '1px solid #e5e7eb', borderRadius: 10, fontSize: 13, marginBottom: 10, boxSizing: 'border-box', fontFamily: 'inherit', resize: 'vertical' }} />
            <input type="number" placeholder="الرسوم" value={form.fee || 0} onChange={(e) => setForm({ ...form, fee: e.target.value })} style={{ width: '100%', padding: 12, border: '1px solid #e5e7eb', borderRadius: 10, fontSize: 13, marginBottom: 10, boxSizing: 'border-box', fontFamily: 'inherit' }} />
            <textarea placeholder="ملاحظات داخلية" value={form.notes || ''} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} style={{ width: '100%', padding: 12, border: '1px solid #e5e7eb', borderRadius: 10, fontSize: 13, marginBottom: 16, boxSizing: 'border-box', fontFamily: 'inherit', resize: 'vertical' }} />

            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setModal(null)} style={{ flex: 1, padding: 12, background: '#f1f5f9', border: 'none', borderRadius: 10, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit' }}>إلغاء</button>
              <button onClick={save} disabled={saving} style={{ flex: 1, padding: 12, background: 'linear-gradient(135deg,#1e40af,#1e3a8a)', color: '#fff', border: 'none', borderRadius: 10, fontWeight: 900, cursor: saving ? 'not-allowed' : 'pointer', fontFamily: 'inherit' }}>{saving ? '...' : '✓ حفظ'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
