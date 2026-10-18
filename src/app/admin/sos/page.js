'use client';
import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/components/Toast';
import { SkeletonList } from '@/components/Skeleton';
import EmptyState from '@/components/EmptyState';

const STATUS = {
  pending: { label: 'جديد', color: '#ef4444', icon: '🚨' },
  responding: { label: 'قيد الاستجابة', color: '#f59e0b', icon: '🚑' },
  resolved: { label: 'تم الحل', color: '#10b981', icon: '✅' },
  false_alarm: { label: 'بلاغ كاذب', color: '#64748b', icon: '⚠️' },
};

export default function AdminSOS() {
  const router = useRouter();
  const { success, error: tE } = useToast();
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('pending');

  useEffect(() => {
    let stored = null;
    try { stored = JSON.parse(localStorage.getItem('sanad_admin') || 'null'); } catch {}
    if (!stored) { router.replace('/admin/login'); return; }
    load();
  }, [router]);

  async function load() {
    if (!supabase) { setLoading(false); return; }
    const { data } = await supabase.from('sos_alerts').select('*').order('created_at', { ascending: false }).limit(100);
    setAlerts(data || []);
    setLoading(false);
  }

  const filtered = useMemo(() => {
    if (filter === 'all') return alerts;
    return alerts.filter(a => a.status === filter);
  }, [alerts, filter]);

  const counts = useMemo(() => {
    return {
      all: alerts.length,
      pending: alerts.filter(a => a.status === 'pending').length,
      responding: alerts.filter(a => a.status === 'responding').length,
      resolved: alerts.filter(a => a.status === 'resolved').length,
    };
  }, [alerts]);

  async function changeStatus(alert, newStatus) {
    await supabase.from('sos_alerts').update({ status: newStatus, resolved_at: newStatus === 'resolved' ? new Date().toISOString() : null }).eq('id', alert.id);
    success('✅ تم');
    load();
  }

  async function callPhone(phone) {
    if (!phone) return;
    window.location.href = `tel:${phone}`;
  }

  if (loading) return <div style={{ padding: 16, background: '#f8fafc', minHeight: '100vh' }}><SkeletonList count={4} /></div>;

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', paddingBottom: 40 }}>
      <div style={{ position: 'sticky', top: 0, zIndex: 10, background: 'linear-gradient(135deg,#dc2626,#991b1b)', padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <Link href="/admin" style={{ color: '#fff', textDecoration: 'none', fontSize: 20, width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,.15)', borderRadius: '50%' }}>→</Link>
        <div style={{ flex: 1, color: '#fff', fontSize: 16, fontWeight: 900 }}>🚨 بلاغات الطوارئ {counts.pending > 0 && <span style={{ background: '#fff', color: '#dc2626', padding: '2px 8px', borderRadius: 10, fontSize: 11, marginRight: 8 }}>{counts.pending}</span>}</div>
      </div>

      <div style={{ padding: 16 }}>
        <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 4 }}>
          {[['all','الكل',counts.all],['pending','جديد',counts.pending],['responding','استجابة',counts.responding],['resolved','محلول',counts.resolved]].map(([k,l,n]) => (
            <button key={k} onClick={() => setFilter(k)} style={{ padding: '8px 14px', background: filter === k ? '#0f4d3a' : '#fff', color: filter === k ? '#fff' : '#64748b', border: `1px solid ${filter === k ? '#0f4d3a' : '#e5e7eb'}`, borderRadius: 10, fontSize: 11.5, fontWeight: 800, cursor: 'pointer', whiteSpace: 'nowrap', fontFamily: 'inherit' }}>{l} ({n})</button>
          ))}
        </div>
      </div>

      <div style={{ padding: '0 16px' }}>
        {filtered.length === 0 ? <EmptyState icon="✅" title="لا توجد بلاغات" description="كل شيء آمن" /> : filtered.map(a => {
          const s = STATUS[a.status] || STATUS.pending;
          return (
            <div key={a.id} style={{ background: '#fff', border: `2px solid ${a.status === 'pending' ? '#ef4444' : '#e5e7eb'}`, borderRadius: 14, padding: 14, marginBottom: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 900, color: '#0f172a' }}>{a.full_name || 'مجهول'}</div>
                  <div style={{ fontSize: 11, color: '#64748b', direction: 'ltr', textAlign: 'right', marginTop: 2 }}>📞 {a.phone || '—'}</div>
                </div>
                <span style={{ background: `${s.color}20`, color: s.color, padding: '3px 8px', borderRadius: 6, fontSize: 10, fontWeight: 900 }}>{s.icon} {s.label}</span>
              </div>
              {a.category && <div style={{ fontSize: 12, fontWeight: 800, color: '#dc2626', marginBottom: 6 }}>🔴 {a.category}</div>}
              {a.description && <div style={{ fontSize: 12, color: '#334155', background: '#f8fafc', padding: 10, borderRadius: 8, marginBottom: 8, lineHeight: 1.6 }}>{a.description}</div>}
              {a.location_text && <div style={{ fontSize: 11, color: '#64748b', marginBottom: 6 }}>📍 {a.location_text}</div>}
              {a.lat && a.lng && (
                <a href={`https://maps.google.com/?q=${a.lat},${a.lng}`} target="_blank" rel="noopener" style={{ display: 'inline-block', fontSize: 11, color: '#3b82f6', fontWeight: 800, textDecoration: 'none', marginBottom: 8 }}>🗺️ عرض على الخريطة</a>
              )}
              <div style={{ fontSize: 10, color: '#94a3b8', marginBottom: 8 }}>📅 {new Date(a.created_at).toLocaleString('ar-EG')}</div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {a.phone && <button onClick={() => callPhone(a.phone)} style={{ flex: 1, minWidth: 80, padding: 8, background: 'linear-gradient(135deg,#10b981,#059669)', color: '#fff', border: 'none', borderRadius: 8, fontSize: 11, fontWeight: 900, cursor: 'pointer', fontFamily: 'inherit' }}>📞 اتصال</button>}
                {a.status === 'pending' && <button onClick={() => changeStatus(a, 'responding')} style={{ flex: 1, minWidth: 80, padding: 8, background: 'rgba(245,158,11,.15)', color: '#f59e0b', border: 'none', borderRadius: 8, fontSize: 11, fontWeight: 900, cursor: 'pointer', fontFamily: 'inherit' }}>🚑 استجابة</button>}
                {a.status === 'responding' && <button onClick={() => changeStatus(a, 'resolved')} style={{ flex: 1, minWidth: 80, padding: 8, background: 'rgba(16,185,129,.15)', color: '#10b981', border: 'none', borderRadius: 8, fontSize: 11, fontWeight: 900, cursor: 'pointer', fontFamily: 'inherit' }}>✅ حل</button>}
                {a.status === 'pending' && <button onClick={() => changeStatus(a, 'false_alarm')} style={{ padding: 8, background: '#f1f5f9', color: '#64748b', border: 'none', borderRadius: 8, fontSize: 11, fontWeight: 900, cursor: 'pointer', fontFamily: 'inherit' }}>⚠️</button>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
