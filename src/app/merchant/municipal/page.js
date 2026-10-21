'use client';
import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { useCurrentUser } from '@/lib/useCurrentUser';
import { useToast } from '@/components/Toast';

const STATUS_MAP = {
  pending: { label: 'معلقة', icon: '⏳', color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' },
  in_progress: { label: 'قيد المعالجة', icon: '🔄', color: '#0ea5e9', bg: 'rgba(14,165,233,0.1)' },
  resolved: { label: 'محلولة', icon: '✅', color: '#10b981', bg: 'rgba(16,185,129,0.1)' },
  rejected: { label: 'مرفوضة', icon: '❌', color: '#ef4444', bg: 'rgba(239,68,68,0.1)' },
};

const CATEGORY_LABELS = {
  road: '🛣️ طرق', water: '💧 مياه', electricity: '⚡ كهرباء',
  cleaning: '🧹 نظافة', park: '🌳 حدائق', building: '🏗️ بناء',
  noise: '🔊 ضوضاء', other: '📌 أخرى',
};

export default function MerchantMunicipalPage() {
  const router = useRouter();
  const { success, error: toastError } = useToast();
  const { user, loading: userLoading, dataOwnerName } = useCurrentUser();
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [working, setWorking] = useState(null);
  const [showResponse, setShowResponse] = useState(null);
  const [responseText, setResponseText] = useState('');

  useEffect(() => {
    if (userLoading) return;
    if (!user || !dataOwnerName) { setLoading(false); return; }
    loadComplaints();
  }, [user, userLoading, dataOwnerName]);

  async function loadComplaints() {
    if (!supabase || !dataOwnerName) return;
    setLoading(true);
    try {
      const { data } = await supabase.from('municipal_complaints').select('*').eq('provider_name', dataOwnerName).order('created_at', { ascending: false });
      setComplaints(data || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }

  async function updateStatus(id, status) {
    setWorking(id);
    const updates = { status };
    if (status === 'resolved') updates.resolved_at = new Date().toISOString();
    const { error } = await supabase.from('municipal_complaints').update(updates).eq('id', id);
    if (error) toastError('فشل التحديث');
    else {
      success(status === 'resolved' ? '✅ تم الحل' : '🔄 تم التحديث');
      setComplaints(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c));
    }
    setWorking(null);
  }

  async function sendResponse(id) {
    if (!responseText.trim()) { toastError('اكتب الرد'); return; }
    setWorking(id);
    const { error } = await supabase.from('municipal_complaints').update({ response: responseText.trim(), status: 'in_progress' }).eq('id', id);
    if (error) toastError('فشل الإرسال');
    else {
      success('✅ تم إرسال الرد');
      setComplaints(prev => prev.map(c => c.id === id ? { ...c, response: responseText.trim(), status: 'in_progress' } : c));
      setShowResponse(null);
      setResponseText('');
    }
    setWorking(null);
  }

  const stats = useMemo(() => ({
    total: complaints.length,
    pending: complaints.filter(c => c.status === 'pending').length,
    inProgress: complaints.filter(c => c.status === 'in_progress').length,
    resolved: complaints.filter(c => c.status === 'resolved').length,
  }), [complaints]);

  const filtered = useMemo(() => {
    let list = complaints;
    if (filter !== 'all') list = list.filter(c => c.status === filter);
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(c => (c.title || '').toLowerCase().includes(q) || (c.citizen_name || '').toLowerCase().includes(q));
    }
    return list;
  }, [complaints, filter, search]);

  if (userLoading || loading) return <div style={{ padding: 80, textAlign: 'center' }}>⏳</div>;

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', paddingBottom: 40 }}>
      <div style={{ background: '#0f4d3a', padding: '16px 20px', position: 'sticky', top: 0, zIndex: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
          <Link href="/merchant" style={{ color: '#fff', textDecoration: 'none', fontSize: 20 }}>←</Link>
          <div style={{ flex: 1 }}><h1 style={{ color: '#fff', fontSize: 18, fontWeight: 900, margin: 0 }}>🏢 شكاوى البلدية</h1></div>
          <Link href="/complaints/new" style={{ background: '#fbbf24', color: '#0f4d3a', padding: '8px 14px', borderRadius: 10, fontSize: 12, fontWeight: 900, textDecoration: 'none' }}>+ شكوى</Link>
        </div>
        <input type="search" placeholder="🔍 ابحث بالعنوان أو الاسم..." value={search} onChange={e => setSearch(e.target.value)} style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: 'none', fontSize: 13, outline: 'none', boxSizing: 'border-box', background: 'rgba(255,255,255,0.95)' }} />
        <div style={{ display: 'flex', gap: 6, marginTop: 12, overflowX: 'auto' }}>
          {[{k:'all',l:'الكل'},{k:'pending',l:'⏳ معلقة'},{k:'in_progress',l:'🔄 قيد المعالجة'},{k:'resolved',l:'✅ محلولة'}].map(f => (
            <button key={f.k} onClick={() => setFilter(f.k)} style={{ background: filter === f.k ? '#fff' : 'rgba(255,255,255,0.1)', color: filter === f.k ? '#0f4d3a' : '#fff', border: 'none', padding: '6px 14px', borderRadius: 20, fontSize: 11, fontWeight: 900, cursor: 'pointer', fontFamily: 'inherit' }}>{f.l}</button>
          ))}
        </div>
      </div>

      <div style={{ padding: 16, maxWidth: 800, margin: '0 auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginBottom: 16 }}>
          <StatBox label="الكل" value={stats.total} color="#0f4d3a" />
          <StatBox label="معلقة" value={stats.pending} color="#f59e0b" />
          <StatBox label="قيد المعالجة" value={stats.inProgress} color="#0ea5e9" />
          <StatBox label="محلولة" value={stats.resolved} color="#10b981" />
        </div>

        {filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 40, background: '#fff', borderRadius: 16, color: '#64748b' }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>🏢</div>
            <div style={{ fontSize: 15, fontWeight: 900 }}>{complaints.length === 0 ? 'لا توجد شكاوى' : 'لا نتائج'}</div>
          </div>
        ) : filtered.map(c => {
          const st = STATUS_MAP[c.status] || STATUS_MAP.pending;
          return (
            <div key={c.id} style={{ background: '#fff', borderRadius: 14, padding: 14, marginBottom: 10, border: '1px solid #e2e8f0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 900, color: '#0f172a' }}>{c.title}</div>
                  <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>👤 {c.citizen_name} · 📱 {c.citizen_phone}</div>
                  <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>{CATEGORY_LABELS[c.category] || c.category}</div>
                  {c.location && <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>📍 {c.location}</div>}
                </div>
                <div style={{ background: st.bg, color: st.color, padding: '4px 10px', borderRadius: 8, fontSize: 10, fontWeight: 900 }}>{st.icon} {st.label}</div>
              </div>
              {c.description && <div style={{ fontSize: 12, color: '#475569', lineHeight: 1.5, marginBottom: 8 }}>{c.description}</div>}
              {c.response && <div style={{ background: 'rgba(14,165,233,0.08)', border: '1px solid rgba(14,165,233,0.2)', borderRadius: 8, padding: 10, marginBottom: 8, fontSize: 12, color: '#0284c7' }}><strong>رد البلدية:</strong> {c.response}</div>}
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {c.status === 'pending' && <button onClick={() => updateStatus(c.id, 'in_progress')} disabled={working === c.id} style={btnStyle('rgba(14,165,233,0.1)', '#0284c7')}>🔄 بدء المعالجة</button>}
                {c.status !== 'resolved' && <button onClick={() => updateStatus(c.id, 'resolved')} disabled={working === c.id} style={btnStyle('rgba(16,185,129,0.1)', '#10b981')}>✅ حل</button>}
                {c.status !== 'rejected' && <button onClick={() => updateStatus(c.id, 'rejected')} disabled={working === c.id} style={btnStyle('rgba(239,68,68,0.1)', '#ef4444')}>❌ رفض</button>}
                {c.status !== 'resolved' && <button onClick={() => { setShowResponse(c); setResponseText(c.response || ''); }} style={btnStyle('rgba(139,92,246,0.1)', '#8b5cf6')}>💬 رد</button>}
              </div>
            </div>
          );
        })}
      </div>

      {showResponse && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 100, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
          <div style={{ background: '#fff', width: '100%', maxWidth: 500, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24 }}>
            <h2 style={{ fontSize: 18, fontWeight: 900, margin: '0 0 16px' }}>💬 الرد على الشكوى</h2>
            <div style={{ background: '#f8fafc', borderRadius: 10, padding: 12, marginBottom: 16, fontSize: 12, color: '#475569' }}>{showResponse.title}</div>
            <textarea value={responseText} onChange={e => setResponseText(e.target.value)} style={{ width: '100%', padding: 12, borderRadius: 10, border: '1px solid #cbd5e1', fontSize: 13, height: 100, resize: 'none', fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }} placeholder="اكتب ردك..." />
            <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
              <button onClick={() => { setShowResponse(null); setResponseText(''); }} style={{ flex: 1, padding: 12, background: '#f1f5f9', color: '#475569', border: 'none', borderRadius: 10, fontWeight: 900, cursor: 'pointer', fontFamily: 'inherit' }}>إلغاء</button>
              <button onClick={() => sendResponse(showResponse.id)} disabled={working === showResponse.id} style={{ flex: 2, padding: 12, background: '#0f4d3a', color: '#fff', border: 'none', borderRadius: 10, fontWeight: 900, cursor: 'pointer', fontFamily: 'inherit' }}>{working === showResponse.id ? '⏳ جارٍ الإرسال...' : '📤 إرسال الرد'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StatBox({ label, value, color }) {
  return <div style={{ background: '#fff', borderRadius: 12, padding: 12, textAlign: 'center', border: '1px solid #e2e8f0' }}><div style={{ fontSize: 18, fontWeight: 900, color, marginBottom: 2 }}>{value}</div><div style={{ fontSize: 9.5, color: '#64748b', fontWeight: 800 }}>{label}</div></div>;
}

const btnStyle = (bg, color) => ({ flex: 1, minWidth: 70, padding: 10, background: bg, color, border: 'none', borderRadius: 8, fontSize: 11, fontWeight: 900, cursor: 'pointer', fontFamily: 'inherit' });
