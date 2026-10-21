'use client';
import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { useCurrentUser } from '@/lib/useCurrentUser';
import { useToast } from '@/components/Toast';

export default function InternetSubscribersPage() {
  const router = useRouter();
  const { success, error: toastError } = useToast();
  const { user, loading: userLoading, dataOwnerName } = useCurrentUser();

  const [entityId, setEntityId] = useState(null);
  const [subs, setSubs] = useState([]);
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editSub, setEditSub] = useState(null);
  const [form, setForm] = useState({ name: '', phone: '', address: '', plan_id: '', start_date: new Date().toISOString().split('T')[0], end_date: '', status: 'active', notes: '' });
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(null);

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
      const [sRes, pRes] = await Promise.all([
        supabase.from('internet_subscribers').select('*').eq('provider_name', dataOwnerName).order('created_at', { ascending: false }),
        supabase.from('internet_plans').select('id, name, speed_mbps, price').eq('provider_name', dataOwnerName).eq('is_active', true),
      ]);
      setSubs(sRes.data || []);
      setPlans(pRes.data || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }

  function openAdd() {
    setForm({ name: '', phone: '', address: '', plan_id: '', start_date: new Date().toISOString().split('T')[0], end_date: '', status: 'active', notes: '' });
    setEditSub(null);
    setShowForm(true);
  }

  function openEdit(s) {
    setForm({ name: s.name || '', phone: s.phone || '', address: s.address || '', plan_id: s.plan_id || '', start_date: s.start_date || '', end_date: s.end_date || '', status: s.status || 'active', notes: s.notes || '' });
    setEditSub(s);
    setShowForm(true);
  }

  async function saveSub(e) {
    e.preventDefault();
    if (!form.name.trim() || !form.phone.trim() || !form.plan_id) { toastError('الاسم والهاتف والخطة مطلوبة'); return; }
    setSaving(true);
    try {
      const payload = {
        entity_id: entityId, provider_name: dataOwnerName,
        name: form.name.trim(), phone: form.phone.trim(), address: form.address.trim() || null,
        plan_id: form.plan_id, start_date: form.start_date || null, end_date: form.end_date || null,
        status: form.status, notes: form.notes.trim() || null,
      };
      if (editSub) {
        const { error } = await supabase.from('internet_subscribers').update(payload).eq('id', editSub.id);
        if (error) throw error;
        success('✅ تم التعديل');
      } else {
        const { error } = await supabase.from('internet_subscribers').insert(payload);
        if (error) throw error;
        success('🎉 تم إضافة المشترك');
      }
      setShowForm(false);
      loadAll();
    } catch (err) { console.error(err); toastError('فشل الحفظ'); }
    finally { setSaving(false); }
  }

  async function deleteSub(s) {
    if (!confirm(`حذف المشترك "${s.name}"؟`)) return;
    setDeleting(s.id);
    const { error } = await supabase.from('internet_subscribers').delete().eq('id', s.id);
    if (!error) { success('🗑️ تم الحذف'); setSubs(prev => prev.filter(x => x.id !== s.id)); }
    setDeleting(null);
  }

  const filtered = useMemo(() => {
    if (!search.trim()) return subs;
    const q = search.trim().toLowerCase();
    return subs.filter(s => (s.name || '').toLowerCase().includes(q) || (s.phone || '').includes(q));
  }, [subs, search]);

  function getPlanName(id) { return plans.find(p => p.id === id)?.name || '—'; }

  if (userLoading || loading) return <div style={{ padding: 80, textAlign: 'center' }}>⏳</div>;

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', paddingBottom: 100 }}>
      <div style={{ background: '#0f4d3a', padding: '16px 20px', position: 'sticky', top: 0, zIndex: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
          <Link href="/merchant" style={{ color: '#fff', textDecoration: 'none', fontSize: 20 }}>←</Link>
          <div style={{ flex: 1 }}>
            <h1 style={{ color: '#fff', fontSize: 18, fontWeight: 900, margin: 0 }}>👥 المشتركون</h1>
            <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: 11, marginTop: 2 }}>{dataOwnerName}</div>
          </div>
          <button onClick={openAdd} style={{ background: '#fbbf24', color: '#0f4d3a', border: 'none', padding: '8px 14px', borderRadius: 10, fontSize: 12, fontWeight: 900, cursor: 'pointer', fontFamily: 'inherit' }}>+ جديد</button>
        </div>
        <input type="search" placeholder="🔍 ابحث بالاسم أو الهاتف..." value={search} onChange={e => setSearch(e.target.value)} style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: 'none', fontSize: 13, outline: 'none', boxSizing: 'border-box', background: 'rgba(255,255,255,0.95)' }} />
      </div>

      <div style={{ display: 'flex', gap: 6, padding: '10px 16px', background: '#fff', borderBottom: '1px solid #e2e8f0', overflowX: 'auto' }}>
        <Link href="/merchant/internet/plans" style={navStyle(false)}>📡 الخطط</Link>
        <Link href="/merchant/internet/subscribers" style={navStyle(true)}>👥 المشتركون</Link>
        <Link href="/merchant/internet/invoices" style={navStyle(false)}>💰 الفواتير</Link>
        <Link href="/merchant/internet/tickets" style={navStyle(false)}>🎫 التذاكر</Link>
      </div>

      <div style={{ padding: 16, maxWidth: 700, margin: '0 auto' }}>
        {filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 40, background: '#fff', borderRadius: 16, color: '#64748b' }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>👥</div>
            <div style={{ fontSize: 15, fontWeight: 900, marginBottom: 8 }}>{subs.length === 0 ? 'لا يوجد مشتركون' : 'لا نتائج'}</div>
            {subs.length === 0 && <button onClick={openAdd} style={{ background: '#0f4d3a', color: '#fff', padding: '10px 20px', borderRadius: 10, border: 'none', fontSize: 13, fontWeight: 900, cursor: 'pointer', fontFamily: 'inherit' }}>+ أضف مشترك</button>}
          </div>
        ) : filtered.map(s => (
          <div key={s.id} style={{ background: '#fff', borderRadius: 14, padding: 14, marginBottom: 10, border: '1px solid #e2e8f0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 900, color: '#0f172a' }}>{s.name}</div>
                <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>📱 {s.phone}</div>
                <div style={{ fontSize: 11, color: '#8b5cf6', marginTop: 2 }}>📡 {getPlanName(s.plan_id)}</div>
              </div>
              <div style={{ background: s.status === 'active' ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)', color: s.status === 'active' ? '#10b981' : '#ef4444', padding: '4px 10px', borderRadius: 8, fontSize: 10, fontWeight: 900 }}>
                {s.status === 'active' ? '✅ نشط' : '⏸️ موقوف'}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              <button onClick={() => openEdit(s)} style={btnStyle('rgba(14,165,233,0.1)', '#0284c7')}>✏️ تعديل</button>
              <button onClick={() => deleteSub(s)} disabled={deleting === s.id} style={btnStyle('rgba(239,68,68,0.1)', '#ef4444')}>{deleting === s.id ? '⏳' : '🗑️'}</button>
            </div>
          </div>
        ))}
      </div>

      {showForm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 100, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
          <div style={{ background: '#fff', width: '100%', maxWidth: 500, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, maxHeight: '90vh', overflowY: 'auto' }}>
            <h2 style={{ fontSize: 18, fontWeight: 900, margin: '0 0 20px' }}>{editSub ? '✏️ تعديل مشترك' : '👥 مشترك جديد'}</h2>
            <form onSubmit={saveSub}>
              <div style={{ marginBottom: 12 }}><label style={labelStyle}>الاسم *</label><input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required style={inputStyle} /></div>
              <div style={{ marginBottom: 12 }}><label style={labelStyle}>الهاتف *</label><input type="tel" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} required style={inputStyle} /></div>
              <div style={{ marginBottom: 12 }}><label style={labelStyle}>العنوان</label><input value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} style={inputStyle} /></div>
              <div style={{ marginBottom: 12 }}><label style={labelStyle}>الخطة *</label><select value={form.plan_id} onChange={e => setForm({ ...form, plan_id: e.target.value })} required style={inputStyle}><option value="">— اختر خطة —</option>{plans.map(p => <option key={p.id} value={p.id}>{p.name} ({p.speed_mbps} Mbps - {p.price} ل.س)</option>)}</select></div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
                <div><label style={labelStyle}>تاريخ البدء</label><input type="date" value={form.start_date} onChange={e => setForm({ ...form, start_date: e.target.value })} style={inputStyle} /></div>
                <div><label style={labelStyle}>تاريخ الانتهاء</label><input type="date" value={form.end_date} onChange={e => setForm({ ...form, end_date: e.target.value })} style={inputStyle} /></div>
              </div>
              <div style={{ marginBottom: 12 }}><label style={labelStyle}>الحالة</label><select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })} style={inputStyle}><option value="active">نشط</option><option value="suspended">موقوف</option><option value="expired">منتهي</option></select></div>
              <div style={{ marginBottom: 20 }}><label style={labelStyle}>ملاحظات</label><textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} style={{ ...inputStyle, height: 60, resize: 'none' }} /></div>
              <button type="submit" disabled={saving} style={{ width: '100%', padding: 14, background: '#0f4d3a', color: '#fff', border: 'none', borderRadius: 10, fontWeight: 900, fontSize: 15, cursor: 'pointer', fontFamily: 'inherit' }}>{saving ? '⏳ جارٍ الحفظ...' : '💾 حفظ'}</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function navStyle(active) { return { background: active ? '#0f4d3a' : '#fff', color: active ? '#fff' : '#64748b', border: active ? '1px solid #0f4d3a' : '1px solid #e2e8f0', padding: '8px 14px', borderRadius: 20, fontSize: 12, fontWeight: 900, textDecoration: 'none', whiteSpace: 'nowrap' }; }
const btnStyle = (bg, color) => ({ flex: 1, padding: 10, background: bg, color, border: 'none', borderRadius: 8, fontSize: 12, fontWeight: 900, cursor: 'pointer', fontFamily: 'inherit' });
const labelStyle = { display: 'block', fontSize: 12, fontWeight: 800, color: '#475569', marginBottom: 6 };
const inputStyle = { width: '100%', padding: '12px 14px', borderRadius: 10, border: '1px solid #cbd5e1', fontSize: 14, fontFamily: 'inherit', boxSizing: 'border-box', outline: 'none', background: '#f8fafc' };
