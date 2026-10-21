'use client';
import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { useCurrentUser } from '@/lib/useCurrentUser';
import { useToast } from '@/components/Toast';

const PRIORITIES = { low: { label: 'منخفضة', color: '#94a3b8' }, normal: { label: 'عادية', color: '#0ea5e9' }, high: { label: 'عالية', color: '#f59e0b' }, urgent: { label: 'عاجلة', color: '#ef4444' } };

export default function InternetTicketsPage() {
  const router = useRouter();
  const { success, error: toastError } = useToast();
  const { user, loading: userLoading, dataOwnerName } = useCurrentUser();

  const [entityId, setEntityId] = useState(null);
  const [tickets, setTickets] = useState([]);
  const [subs, setSubs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ subscriber_id: '', title: '', description: '', priority: 'normal' });
  const [saving, setSaving] = useState(false);

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
      const [tRes, sRes] = await Promise.all([
        supabase.from('internet_tickets').select('*').eq('provider_name', dataOwnerName).order('created_at', { ascending: false }),
        supabase.from('internet_subscribers').select('id, name, phone').eq('provider_name', dataOwnerName),
      ]);
      setTickets(tRes.data || []);
      setSubs(sRes.data || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }

  function openAdd() {
    setForm({ subscriber_id: '', title: '', description: '', priority: 'normal' });
    setShowForm(true);
  }

  async function saveTicket(e) {
    e.preventDefault();
    if (!form.subscriber_id || !form.title.trim()) { toastError('المشترك والعنوان مطلوبان'); return; }
    setSaving(true);
    try {
      const payload = {
        entity_id: entityId, provider_name: dataOwnerName,
        subscriber_id: form.subscriber_id, title: form.title.trim(),
        description: form.description.trim() || null, priority: form.priority, status: 'open',
      };
      const { error } = await supabase.from('internet_tickets').insert(payload);
      if (error) throw error;
      success('🎫 تم فتح التذكرة');
      setShowForm(false);
      loadAll();
    } catch (err) { console.error(err); toastError('فشل الإنشاء'); }
    finally { setSaving(false); }
  }

  async function updateStatus(ticket, status) {
    const { error } = await supabase.from('internet_tickets').update({ status }).eq('id', ticket.id);
    if (!error) {
      success(status === 'resolved' ? '✅ تم الحل' : '🔄 تم التحديث');
      setTickets(prev => prev.map(t => t.id === ticket.id ? { ...t, status } : t));
    }
  }

  async function deleteTicket(t) {
    if (!confirm('حذف التذكرة؟')) return;
    const { error } = await supabase.from('internet_tickets').delete().eq('id', t.id);
    if (!error) { success('🗑️ تم الحذف'); setTickets(prev => prev.filter(x => x.id !== t.id)); }
  }

  const filtered = useMemo(() => {
    if (filter === 'all') return tickets;
    return tickets.filter(t => t.status === filter);
  }, [tickets, filter]);

  const stats = useMemo(() => ({
    total: tickets.length,
    open: tickets.filter(t => t.status === 'open').length,
    resolved: tickets.filter(t => t.status === 'resolved').length,
  }), [tickets]);

  function getSubName(id) { return subs.find(s => s.id === id)?.name || '—'; }

  if (userLoading || loading) return <div style={{ padding: 80, textAlign: 'center' }}>⏳</div>;

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', paddingBottom: 100 }}>
      <div style={{ background: '#0f4d3a', padding: '16px 20px', position: 'sticky', top: 0, zIndex: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
          <Link href="/merchant" style={{ color: '#fff', textDecoration: 'none', fontSize: 20 }}>←</Link>
          <div style={{ flex: 1 }}>
            <h1 style={{ color: '#fff', fontSize: 18, fontWeight: 900, margin: 0 }}>🎫 تذاكر الدعم</h1>
            <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: 11, marginTop: 2 }}>{dataOwnerName}</div>
          </div>
          <button onClick={openAdd} style={{ background: '#fbbf24', color: '#0f4d3a', border: 'none', padding: '8px 14px', borderRadius: 10, fontSize: 12, fontWeight: 900, cursor: 'pointer', fontFamily: 'inherit' }}>+ تذكرة</button>
        </div>
        <div style={{ display: 'flex', gap: 6, overflowX: 'auto' }}>
          {['all', 'open', 'resolved'].map(f => (
            <button key={f} onClick={() => setFilter(f)} style={{ background: filter === f ? '#fff' : 'rgba(255,255,255,0.1)', color: filter === f ? '#0f4d3a' : '#fff', border: 'none', padding: '6px 14px', borderRadius: 20, fontSize: 11, fontWeight: 900, cursor: 'pointer', fontFamily: 'inherit' }}>
              {f === 'all' ? 'الكل' : f === 'open' ? 'مفتوحة' : 'محلولة'}
            </button>
          ))}
        </div>
      </div>

      <div style={{ display: 'flex', gap: 6, padding: '10px 16px', background: '#fff', borderBottom: '1px solid #e2e8f0', overflowX: 'auto' }}>
        <Link href="/merchant/internet/plans" style={navStyle(false)}>📡 الخطط</Link>
        <Link href="/merchant/internet/subscribers" style={navStyle(false)}>👥 المشتركون</Link>
        <Link href="/merchant/internet/invoices" style={navStyle(false)}>💰 الفواتير</Link>
        <Link href="/merchant/internet/tickets" style={navStyle(true)}>🎫 التذاكر</Link>
      </div>

      <div style={{ padding: 16, maxWidth: 700, margin: '0 auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 16 }}>
          <StatBox label="الكل" value={stats.total} color="#0f4d3a" />
          <StatBox label="مفتوحة" value={stats.open} color="#ef4444" />
          <StatBox label="محلولة" value={stats.resolved} color="#10b981" />
        </div>

        {filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 40, background: '#fff', borderRadius: 16, color: '#64748b' }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>🎫</div>
            <div style={{ fontSize: 15, fontWeight: 900, marginBottom: 8 }}>{tickets.length === 0 ? 'لا توجد تذاكر' : 'لا نتائج'}</div>
            {tickets.length === 0 && <button onClick={openAdd} style={{ background: '#0f4d3a', color: '#fff', padding: '10px 20px', borderRadius: 10, border: 'none', fontSize: 13, fontWeight: 900, cursor: 'pointer', fontFamily: 'inherit' }}>+ افتح تذكرة</button>}
          </div>
        ) : filtered.map(t => {
          const pr = PRIORITIES[t.priority] || PRIORITIES.normal;
          return (
            <div key={t.id} style={{ background: '#fff', borderRadius: 14, padding: 14, marginBottom: 10, border: '1px solid #e2e8f0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 900, color: '#0f172a' }}>🎫 {t.title}</div>
                  <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>👤 {getSubName(t.subscriber_id)}</div>
                </div>
                <div style={{ background: `${pr.color}15`, color: pr.color, padding: '3px 8px', borderRadius: 6, fontSize: 9, fontWeight: 900 }}>{pr.label}</div>
              </div>
              {t.description && <div style={{ fontSize: 12, color: '#475569', lineHeight: 1.5, marginBottom: 10 }}>{t.description}</div>}
              <div style={{ display: 'flex', gap: 6 }}>
                {t.status === 'open' && <button onClick={() => updateStatus(t, 'resolved')} style={btnStyle('rgba(16,185,129,0.1)', '#10b981')}>✅ حل</button>}
                {t.status !== 'open' && <button onClick={() => updateStatus(t, 'open')} style={btnStyle('rgba(245,158,11,0.1)', '#f59e0b')}>🔄 فتح</button>}
                <button onClick={() => deleteTicket(t)} style={btnStyle('rgba(239,68,68,0.1)', '#ef4444')}>🗑️</button>
              </div>
            </div>
          );
        })}
      </div>

      {showForm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 100, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
          <div style={{ background: '#fff', width: '100%', maxWidth: 500, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24 }}>
            <h2 style={{ fontSize: 18, fontWeight: 900, margin: '0 0 20px' }}>🎫 تذكرة جديدة</h2>
            <form onSubmit={saveTicket}>
              <div style={{ marginBottom: 12 }}><label style={labelStyle}>المشترك *</label><select value={form.subscriber_id} onChange={e => setForm({ ...form, subscriber_id: e.target.value })} required style={inputStyle}><option value="">— اختر مشتركاً —</option>{subs.map(s => <option key={s.id} value={s.id}>{s.name} ({s.phone})</option>)}</select></div>
              <div style={{ marginBottom: 12 }}><label style={labelStyle}>العنوان *</label><input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required style={inputStyle} /></div>
              <div style={{ marginBottom: 12 }}><label style={labelStyle}>الوصف</label><textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} style={{ ...inputStyle, height: 80, resize: 'none' }} /></div>
              <div style={{ marginBottom: 20 }}><label style={labelStyle}>الأولوية</label><select value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value })} style={inputStyle}>{Object.entries(PRIORITIES).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}</select></div>
              <button type="submit" disabled={saving} style={{ width: '100%', padding: 14, background: '#0f4d3a', color: '#fff', border: 'none', borderRadius: 10, fontWeight: 900, fontSize: 15, cursor: 'pointer', fontFamily: 'inherit' }}>{saving ? '⏳ جارٍ الحفظ...' : '💾 إنشاء'}</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function StatBox({ label, value, color }) { return <div style={{ background: '#fff', borderRadius: 12, padding: 12, textAlign: 'center', border: '1px solid #e2e8f0' }}><div style={{ fontSize: 18, fontWeight: 900, color, marginBottom: 2 }}>{value}</div><div style={{ fontSize: 9.5, color: '#64748b', fontWeight: 800 }}>{label}</div></div>; }
function navStyle(active) { return { background: active ? '#0f4d3a' : '#fff', color: active ? '#fff' : '#64748b', border: active ? '1px solid #0f4d3a' : '1px solid #e2e8f0', padding: '8px 14px', borderRadius: 20, fontSize: 12, fontWeight: 900, textDecoration: 'none', whiteSpace: 'nowrap' }; }
const btnStyle = (bg, color) => ({ flex: 1, padding: 10, background: bg, color, border: 'none', borderRadius: 8, fontSize: 12, fontWeight: 900, cursor: 'pointer', fontFamily: 'inherit' });
const labelStyle = { display: 'block', fontSize: 12, fontWeight: 800, color: '#475569', marginBottom: 6 };
const inputStyle = { width: '100%', padding: '12px 14px', borderRadius: 10, border: '1px solid #cbd5e1', fontSize: 14, fontFamily: 'inherit', boxSizing: 'border-box', outline: 'none', background: '#f8fafc' };
