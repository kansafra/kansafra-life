'use client';
import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/components/Toast';

const FILTERS = [
  { key: 'all', label: 'الكل' },
  { key: 'open', label: 'مفتوحة' },
  { key: 'in_progress', label: 'قيد المعالجة' },
  { key: 'resolved', label: 'محلولة' },
  { key: 'closed', label: 'مغلقة' },
];

export default function AdminSupportPage() {
  const router = useRouter();
  const { success, error: toastError } = useToast();

  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [expandedId, setExpandedId] = useState(null);
  const [working, setWorking] = useState(null);

  const [showReply, setShowReply] = useState(null);
  const [replyText, setReplyText] = useState('');

  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem('sanad_admin') || 'null');
    if (!stored) { router.replace('/admin/login'); return; }
    loadTickets();
  }, [router]);

  async function loadTickets() {
    if (!supabase) return;
    try {
      const { data, error } = await supabase.from('support_tickets').select('*').order('created_at', { ascending: false });
      if (error) {
        // إذا لم يوجد الجدول أو الأعمدة
        setTickets([]);
      } else {
        setTickets(data || []);
      }
    } catch (e) { console.error(e); setTickets([]); }
    finally { setLoading(false); }
  }

  async function updateStatus(ticket, newStatus) {
    setWorking(ticket.id);
    const { error } = await supabase.from('support_tickets').update({
      status: newStatus,
      updated_at: new Date().toISOString(),
    }).eq('id', ticket.id);
    if (error) toastError('فشل التحديث');
    else {
      success(newStatus === 'resolved' ? '✅ تم حل التذكرة' : newStatus === 'closed' ? '🔒 تم إغلاق التذكرة' : '✅ تم التحديث');
      setTickets(prev => prev.map(t => t.id === ticket.id ? { ...t, status: newStatus } : t));
    }
    setWorking(null);
  }

  async function sendReply(ticket) {
    if (!replyText.trim()) { toastError('اكتب الرد أولاً'); return; }
    setWorking(ticket.id);
    const admin = JSON.parse(localStorage.getItem('sanad_admin') || 'null');
    const reply = {
      text: replyText,
      by: admin?.username || 'admin',
      at: new Date().toISOString(),
    };
    const existingReplies = Array.isArray(ticket.replies) ? ticket.replies : [];
    const newReplies = [...existingReplies, reply];

    const { error } = await supabase.from('support_tickets').update({
      replies: newReplies,
      status: ticket.status === 'open' ? 'in_progress' : ticket.status,
      updated_at: new Date().toISOString(),
    }).eq('id', ticket.id);

    if (error) toastError('فشل إرسال الرد');
    else {
      success('✅ تم إرسال الرد');
      setTickets(prev => prev.map(t => t.id === ticket.id ? { ...t, replies: newReplies, status: t.status === 'open' ? 'in_progress' : t.status } : t));
      setShowReply(null);
      setReplyText('');
    }
    setWorking(null);
  }

  async function deleteTicket(ticket) {
    if (!confirm('حذف التذكرة نهائياً؟')) return;
    setWorking(ticket.id);
    const { error } = await supabase.from('support_tickets').delete().eq('id', ticket.id);
    if (error) toastError('فشل الحذف');
    else { success('🗑️ تم الحذف'); setTickets(prev => prev.filter(t => t.id !== ticket.id)); }
    setWorking(null);
  }

  const filtered = useMemo(() => {
    let list = tickets;
    if (filter !== 'all') list = list.filter(t => (t.status || 'open') === filter);
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(t =>
        (t.subject || t.title || '').toLowerCase().includes(q) ||
        (t.message || t.body || '').toLowerCase().includes(q) ||
        (t.user_name || t.customer_name || t.email || '').toLowerCase().includes(q)
      );
    }
    return list;
  }, [tickets, filter, search]);

  const stats = useMemo(() => {
    return {
      total: tickets.length,
      open: tickets.filter(t => (t.status || 'open') === 'open').length,
      inProgress: tickets.filter(t => t.status === 'in_progress').length,
      resolved: tickets.filter(t => ['resolved', 'closed'].includes(t.status)).length,
    };
  }, [tickets]);

  function getTitle(t) {
    return t.subject || t.title || `تذكرة #${t.id?.slice(0, 6) || ''}`;
  }

  function getBody(t) {
    return t.message || t.body || t.content || t.description || '';
  }

  function getAuthor(t) {
    return t.user_name || t.customer_name || t.name || t.email || 'مستخدم';
  }

  if (loading) return <div style={{ padding: 80, textAlign: 'center' }}>⏳</div>;

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', paddingBottom: 40 }}>
      <div style={{ background: '#0f172a', padding: '16px 20px', position: 'sticky', top: 0, zIndex: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
          <Link href="/admin" style={{ color: '#fff', textDecoration: 'none', fontSize: 20 }}>→</Link>
          <h1 style={{ color: '#fff', fontSize: 18, fontWeight: 900, margin: 0, flex: 1 }}>💬 الدعم الفني</h1>
          {stats.open > 0 && (
            <div style={{ background: '#ef4444', color: '#fff', padding: '4px 10px', borderRadius: 8, fontSize: 11, fontWeight: 900 }}>
              {stats.open} مفتوحة
            </div>
          )}
        </div>
        <input type="search" placeholder="🔍 ابحث في التذاكر..." value={search} onChange={e => setSearch(e.target.value)} style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: 'none', fontSize: 13, outline: 'none', boxSizing: 'border-box', background: 'rgba(255,255,255,0.95)' }} />
        <div style={{ display: 'flex', gap: 6, marginTop: 12, overflowX: 'auto' }}>
          {FILTERS.map(f => (
            <button key={f.key} onClick={() => setFilter(f.key)} style={{ background: filter === f.key ? '#fff' : 'rgba(255,255,255,0.1)', color: filter === f.key ? '#0f172a' : '#fff', border: 'none', padding: '6px 14px', borderRadius: 20, fontSize: 12, fontWeight: 900, cursor: 'pointer', whiteSpace: 'nowrap', fontFamily: 'inherit' }}>
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <div style={{ padding: 16 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginBottom: 16 }}>
          <StatBox label="الكل" value={stats.total} color="#0f172a" />
          <StatBox label="مفتوحة" value={stats.open} color="#ef4444" />
          <StatBox label="قيد المعالجة" value={stats.inProgress} color="#f59e0b" />
          <StatBox label="محلولة" value={stats.resolved} color="#10b981" />
        </div>

        {filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 40, background: '#fff', borderRadius: 16, color: '#64748b' }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>💬</div>
            <div style={{ fontSize: 15, fontWeight: 900 }}>{tickets.length === 0 ? 'لا توجد تذاكر دعم' : 'لا توجد نتائج مطابقة'}</div>
            {tickets.length === 0 && (
              <div style={{ fontSize: 12, marginTop: 8 }}>سيظهر هنا أي استفسار من المستخدمين.</div>
            )}
          </div>
        ) : (
          filtered.map(ticket => {
            const status = ticket.status || 'open';
            const isExpanded = expandedId === ticket.id;
            const isWorking = working === ticket.id;
            const replies = Array.isArray(ticket.replies) ? ticket.replies : [];

            const statusMap = {
              open: { bg: 'rgba(239,68,68,0.1)', color: '#ef4444', label: '🔴 مفتوحة' },
              in_progress: { bg: 'rgba(245,158,11,0.1)', color: '#f59e0b', label: '🟡 قيد المعالجة' },
              resolved: { bg: 'rgba(16,185,129,0.1)', color: '#10b981', label: '🟢 محلولة' },
              closed: { bg: 'rgba(148,163,184,0.15)', color: '#64748b', label: '🔒 مغلقة' },
            };
            const st = statusMap[status] || statusMap.open;

            return (
              <div key={ticket.id} style={{ background: '#fff', borderRadius: 16, marginBottom: 12, border: '1px solid #e2e8f0', overflow: 'hidden', opacity: isWorking ? 0.6 : 1 }}>
                <div style={{ padding: 14, cursor: 'pointer' }} onClick={() => setExpandedId(isExpanded ? null : ticket.id)}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10, marginBottom: 8 }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 900, color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{getTitle(ticket)}</div>
                      <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>👤 {getAuthor(ticket)}</div>
                    </div>
                    <div style={{ background: st.bg, color: st.color, padding: '4px 10px', borderRadius: 8, fontSize: 10, fontWeight: 900, whiteSpace: 'nowrap' }}>{st.label}</div>
                  </div>
                  {getBody(ticket) && (
                    <div style={{ fontSize: 12, color: '#475569', marginTop: 4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{getBody(ticket)}</div>
                  )}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
                    <div style={{ fontSize: 10, color: '#94a3b8' }}>{ticket.created_at ? new Date(ticket.created_at).toLocaleString('ar-SY') : '—'}</div>
                    {replies.length > 0 && (
                      <div style={{ fontSize: 10, color: '#0ea5e9', fontWeight: 900 }}>💬 {replies.length} رد</div>
                    )}
                  </div>
                </div>

                {isExpanded && (
                  <div style={{ padding: '0 14px 14px', borderTop: '1px solid #f1f5f9', paddingTop: 12 }}>
                    {getBody(ticket) && (
                      <div style={{ background: '#f8fafc', padding: 12, borderRadius: 10, fontSize: 12, color: '#475569', lineHeight: 1.7, marginBottom: 12, whiteSpace: 'pre-wrap' }}>
                        {getBody(ticket)}
                      </div>
                    )}

                    {replies.length > 0 && (
                      <div style={{ marginBottom: 12 }}>
                        <div style={{ fontSize: 11, fontWeight: 900, color: '#64748b', marginBottom: 8 }}>الردود:</div>
                        {replies.map((r, idx) => (
                          <div key={idx} style={{ background: 'rgba(14,165,233,0.08)', border: '1px solid rgba(14,165,233,0.2)', borderRadius: 8, padding: 10, marginBottom: 6 }}>
                            <div style={{ fontSize: 11, color: '#0284c7', fontWeight: 900, marginBottom: 4 }}>👤 {r.by} · {r.at ? new Date(r.at).toLocaleString('ar-SY') : ''}</div>
                            <div style={{ fontSize: 12, color: '#1e293b', lineHeight: 1.6 }}>{r.text}</div>
                          </div>
                        ))}
                      </div>
                    )}

                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      {status !== 'resolved' && status !== 'closed' && (
                        <button onClick={() => setShowReply(ticket)} disabled={isWorking} style={btnStyle('#0ea5e9', '#fff')}>💬 رد</button>
                      )}
                      {status !== 'resolved' && (
                        <button onClick={() => updateStatus(ticket, 'resolved')} disabled={isWorking} style={btnStyle('#10b981', '#fff')}>✓ حل</button>
                      )}
                      {status === 'resolved' && (
                        <button onClick={() => updateStatus(ticket, 'closed')} disabled={isWorking} style={btnStyle('rgba(148,163,184,0.15)', '#64748b')}>🔒 إغلاق</button>
                      )}
                      {status !== 'open' && status !== 'resolved' && (
                        <button onClick={() => updateStatus(ticket, 'open')} disabled={isWorking} style={btnStyle('rgba(245,158,11,0.1)', '#f59e0b')}>🔄 إعادة فتح</button>
                      )}
                      <button onClick={() => deleteTicket(ticket)} disabled={isWorking} style={btnStyle('rgba(239,68,68,0.1)', '#ef4444')}>🗑️</button>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {showReply && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 100, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
          <div style={{ background: '#fff', width: '100%', maxWidth: 500, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h2 style={{ fontSize: 16, fontWeight: 900, margin: 0 }}>💬 الرد على التذكرة</h2>
              <button onClick={() => { setShowReply(null); setReplyText(''); }} style={{ background: '#f1f5f9', border: 'none', width: 32, height: 32, borderRadius: '50%', fontSize: 16, cursor: 'pointer' }}>✕</button>
            </div>
            <div style={{ background: '#f8fafc', borderRadius: 10, padding: 12, marginBottom: 12, fontSize: 12, color: '#475569' }}>
              <strong>الموضوع:</strong> {getTitle(showReply)}
            </div>
            <textarea
              value={replyText}
              onChange={e => setReplyText(e.target.value)}
              placeholder="اكتب ردك هنا..."
              style={{ width: '100%', height: 140, padding: 12, borderRadius: 10, border: '1px solid #cbd5e1', fontSize: 13, fontFamily: 'inherit', resize: 'none', outline: 'none', boxSizing: 'border-box', background: '#f8fafc' }}
              autoFocus
            />
            <button
              onClick={() => sendReply(showReply)}
              disabled={working === showReply.id || !replyText.trim()}
              style={{ width: '100%', padding: 14, marginTop: 12, background: replyText.trim() ? '#0ea5e9' : '#94a3b8', color: '#fff', border: 'none', borderRadius: 10, fontWeight: 900, fontSize: 14, cursor: replyText.trim() ? 'pointer' : 'not-allowed', fontFamily: 'inherit' }}
            >
              {working === showReply.id ? '⏳ جارٍ الإرسال...' : '📤 إرسال الرد'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function StatBox({ label, value, color }) {
  return (
    <div style={{ background: '#fff', borderRadius: 12, padding: 12, textAlign: 'center', border: '1px solid #e2e8f0' }}>
      <div style={{ fontSize: 18, fontWeight: 900, color, marginBottom: 2 }}>{value}</div>
      <div style={{ fontSize: 9.5, color: '#64748b', fontWeight: 800 }}>{label}</div>
    </div>
  );
}

const btnStyle = (bg, color) => ({ background: bg, color, border: 'none', padding: '10px 14px', borderRadius: 8, fontSize: 12, fontWeight: 900, cursor: 'pointer', fontFamily: 'inherit', flex: 1, minWidth: 60 });
