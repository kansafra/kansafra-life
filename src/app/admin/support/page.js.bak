'use client';
import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/components/Toast';
import { SkeletonList } from '@/components/Skeleton';
import EmptyState from '@/components/EmptyState';

const STATUS = {
  open: { label: 'مفتوح', color: '#3b82f6', icon: '🔵' },
  in_progress: { label: 'قيد المعالجة', color: '#f59e0b', icon: '🟡' },
  resolved: { label: 'محلول', color: '#10b981', icon: '🟢' },
  closed: { label: 'مغلق', color: '#64748b', icon: '⚫' },
};

export default function AdminSupportPage() {
  const router = useRouter();
  const { success, error: tE } = useToast();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('open');
  const [selected, setSelected] = useState(null);
  const [reply, setReply] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let stored = null;
    try { stored = JSON.parse(localStorage.getItem('sanad_admin') || 'null'); } catch {}
    if (!stored) { router.replace('/admin/login'); return; }
    load();
  }, [router]);

  async function load() {
    if (!supabase) { setLoading(false); return; }
    const { data } = await supabase.from('support_tickets').select('*').order('created_at', { ascending: false });
    setTickets(data || []);
    setLoading(false);
  }

  const filtered = useMemo(() => {
    if (filter === 'all') return tickets;
    return tickets.filter(t => t.status === filter);
  }, [tickets, filter]);

  const counts = useMemo(() => {
    return {
      all: tickets.length,
      open: tickets.filter(t => t.status === 'open').length,
      in_progress: tickets.filter(t => t.status === 'in_progress').length,
      resolved: tickets.filter(t => t.status === 'resolved').length,
    };
  }, [tickets]);

  async function sendReply() {
    if (!reply.trim() || !selected) { tE('اكتب الرد أولاً'); return; }
    setSaving(true);
    try {
      const { error } = await supabase.from('support_tickets').update({
        reply: reply.trim(),
        status: 'resolved',
      }).eq('id', selected.id);
      if (error) throw error;
      success('✅ تم الرد');
      setSelected(null);
      setReply('');
      load();
    } catch (e) { tE('تعذّر: ' + e.message); }
    setSaving(false);
  }

  async function changeStatus(ticket, newStatus) {
    await supabase.from('support_tickets').update({ status: newStatus }).eq('id', ticket.id);
    success('✅ تم');
    load();
    if (selected?.id === ticket.id) setSelected({ ...selected, status: newStatus });
  }

  if (loading) return <div style={{ padding: 16, background: '#f8fafc', minHeight: '100vh' }}><SkeletonList count={4} /></div>;

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', paddingBottom: 40 }}>
      <div style={{ position: 'sticky', top: 0, zIndex: 10, background: '#0f4d3a', padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <Link href="/admin" style={{ color: '#fff', textDecoration: 'none', fontSize: 20, width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,.1)', borderRadius: '50%' }}>→</Link>
        <div style={{ flex: 1, color: '#fff', fontSize: 16, fontWeight: 900 }}>💬 الدعم ({counts.open} جديد)</div>
      </div>

      <div style={{ padding: 16 }}>
        <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 4 }}>
          {[['all','الكل',counts.all],['open','مفتوح',counts.open],['in_progress','قيد المعالجة',counts.in_progress],['resolved','محلول',counts.resolved]].map(([k,l,n]) => (
            <button key={k} onClick={() => setFilter(k)} style={{ padding: '8px 14px', background: filter === k ? '#0f4d3a' : '#fff', color: filter === k ? '#fff' : '#64748b', border: `1px solid ${filter === k ? '#0f4d3a' : '#e5e7eb'}`, borderRadius: 10, fontSize: 11.5, fontWeight: 800, cursor: 'pointer', whiteSpace: 'nowrap', fontFamily: 'inherit' }}>{l} ({n})</button>
          ))}
        </div>
      </div>

      <div style={{ padding: '0 16px' }}>
        {filtered.length === 0 ? <EmptyState icon="💬" title="لا توجد تذاكر" /> : filtered.map(t => {
          const s = STATUS[t.status] || STATUS.open;
          return (
            <div key={t.id} onClick={() => { setSelected(t); setReply(t.reply || ''); }} style={{ background: '#fff', borderRadius: 14, padding: 14, marginBottom: 10, border: '1px solid #e5e7eb', cursor: 'pointer' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <div style={{ fontSize: 14, fontWeight: 900, flex: 1 }}>{t.subject}</div>
                <span style={{ background: `${s.color}20`, color: s.color, padding: '3px 8px', borderRadius: 6, fontSize: 10, fontWeight: 900 }}>{s.icon} {s.label}</span>
              </div>
              {t.entity_name && <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 4 }}>🏪 {t.entity_name}</div>}
              <div style={{ fontSize: 12, color: '#64748b', lineHeight: 1.6, marginBottom: 8 }}>{t.message.slice(0, 100)}{t.message.length > 100 ? '...' : ''}</div>
              {t.reply && (
                <div style={{ background: 'rgba(16,185,129,.08)', border: '1px solid rgba(16,185,129,.2)', borderRadius: 8, padding: 8, marginBottom: 4 }}>
                  <div style={{ fontSize: 10, fontWeight: 900, color: '#059669', marginBottom: 2 }}>✓ ردك:</div>
                  <div style={{ fontSize: 11, color: '#334155' }}>{t.reply.slice(0, 80)}{t.reply.length > 80 ? '...' : ''}</div>
                </div>
              )}
              <div style={{ fontSize: 10, color: '#94a3b8' }}>{new Date(t.created_at).toLocaleString('ar-EG')}</div>
            </div>
          );
        })}
      </div>

      {selected && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.6)', zIndex: 100, display: 'flex', alignItems: 'flex-end' }} onClick={() => setSelected(null)}>
          <div style={{ background: '#fff', borderRadius: '24px 24px 0 0', width: '100%', maxWidth: 500, margin: '0 auto', padding: '24px 20px 30px', maxHeight: '90vh', overflow: 'auto' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ width: 40, height: 4, background: '#cbd5e1', borderRadius: 2, margin: '0 auto 16px' }} />
            <h3 style={{ fontSize: 16, fontWeight: 900, marginBottom: 6 }}>{selected.subject}</h3>
            {selected.entity_name && <div style={{ fontSize: 11, color: '#64748b', marginBottom: 12 }}>🏪 {selected.entity_name}</div>}
            
            <div style={{ background: '#f8fafc', borderRadius: 12, padding: 12, marginBottom: 12, fontSize: 12, color: '#334155', lineHeight: 1.7 }}>{selected.message}</div>

            <div style={{ display: 'flex', gap: 6, marginBottom: 12, flexWrap: 'wrap' }}>
              {Object.entries(STATUS).map(([k, s]) => (
                <button key={k} onClick={() => changeStatus(selected, k)} style={{ padding: '6px 10px', background: selected.status === k ? s.color : '#f1f5f9', color: selected.status === k ? '#fff' : '#64748b', border: 'none', borderRadius: 8, fontSize: 10, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit' }}>{s.icon} {s.label}</button>
              ))}
            </div>

            <label style={{ display: 'block', fontSize: 12, fontWeight: 800, color: '#334155', marginBottom: 6 }}>الرد</label>
            <textarea value={reply} onChange={(e) => setReply(e.target.value)} rows={4} placeholder="اكتب ردك هنا..." style={{ width: '100%', padding: 12, border: '1px solid #e5e7eb', borderRadius: 10, fontSize: 13, marginBottom: 12, boxSizing: 'border-box', fontFamily: 'inherit', resize: 'vertical' }} />

            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setSelected(null)} style={{ flex: 1, padding: 12, background: '#f1f5f9', border: 'none', borderRadius: 10, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit' }}>إغلاق</button>
              <button onClick={sendReply} disabled={saving} style={{ flex: 1, padding: 12, background: 'linear-gradient(135deg,#10b981,#059669)', color: '#fff', border: 'none', borderRadius: 10, fontWeight: 900, cursor: saving ? 'not-allowed' : 'pointer', fontFamily: 'inherit' }}>{saving ? '...' : '✓ إرسال الرد'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
