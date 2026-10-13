'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

export default function AdminSupport() {
  const router = useRouter();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('open');
  const [replying, setReplying] = useState(null);
  const [replyText, setReplyText] = useState('');

  useEffect(() => {
    let stored = null;
    try { stored = JSON.parse(localStorage.getItem('sanad_admin') || 'null'); } catch {}
    if (!stored) { router.replace('/admin/login'); return; }
    load();
  }, [router]);

  async function load() {
    if (!supabase) return;
    const { data } = await supabase.from('support_tickets').select('*').order('created_at', { ascending: false });
    setTickets(Array.isArray(data) ? data : []);
    setLoading(false);
  }

  async function sendReply(t) {
    if (!replyText.trim()) return;
    await supabase.from('support_tickets').update({
      reply: replyText,
      status: 'resolved',
      replied_at: new Date().toISOString(),
    }).eq('id', t.id);
    setReplying(null);
    setReplyText('');
    load();
  }

  async function updateStatus(t, status) {
    await supabase.from('support_tickets').update({ status }).eq('id', t.id);
    load();
  }

  const filtered = filter === 'all' ? tickets : tickets.filter((t) => t.status === filter);

  return (
    <div className="admin-page">
      <div className="admin-sub-header">
        <Link href="/admin" className="admin-sub-back">→</Link>
        <span className="admin-sub-title">💬 الدعم الفني</span>
        <span className="admin-sub-count">{tickets.length}</span>
      </div>

      <div className="admin-filters">
        <button className={`admin-filter ${filter === 'all' ? 'active' : ''}`} onClick={() => setFilter('all')} type="button">الكل ({tickets.length})</button>
        <button className={`admin-filter ${filter === 'open' ? 'active' : ''}`} onClick={() => setFilter('open')} type="button">مفتوحة</button>
        <button className={`admin-filter ${filter === 'in_progress' ? 'active' : ''}`} onClick={() => setFilter('in_progress')} type="button">قيد المعالجة</button>
        <button className={`admin-filter ${filter === 'resolved' ? 'active' : ''}`} onClick={() => setFilter('resolved')} type="button">محلولة</button>
      </div>

      {loading ? (
        <div className="sect-empty"><span className="em">⏳</span></div>
      ) : filtered.length === 0 ? (
        <div className="sect-empty"><span className="em">💬</span><p>لا توجد تذاكر</p></div>
      ) : (
        <div style={{ padding: '14px 20px 30px', display: 'flex', flexDirection: 'column', gap: 10 }}>
          {filtered.map((t) => (
            <div key={t.id} className={`ticket-card priority-${t.priority}`} style={{ background: 'rgba(255,255,255,.03)', border: '1px solid rgba(255,255,255,.06)' }}>
              <div className="ticket-head">
                <div className="ticket-subject" style={{ color: '#fff' }}>{t.subject}</div>
                <span className={`ticket-status ${t.status}`}>
                  {t.status === 'open' ? 'مفتوحة' : t.status === 'in_progress' ? 'قيد المعالجة' : 'محلولة'}
                </span>
              </div>
              <div className="ticket-user" style={{ color: 'rgba(255,255,255,.5)' }}>
                {t.user_name} · {t.user_phone} · {new Date(t.created_at).toLocaleDateString('ar-EG')}
              </div>
              <div className="ticket-message" style={{ background: 'rgba(255,255,255,.04)', color: 'rgba(255,255,255,.75)' }}>{t.message}</div>
              {t.reply && (
                <div className="ticket-reply" style={{ background: 'rgba(232,185,35,.08)', color: '#e8b923', borderRightColor: '#e8b923' }}>
                  <strong>الرد:</strong> {t.reply}
                </div>
              )}
              {t.status !== 'resolved' && (
                <div style={{ display: 'flex', gap: 6, marginTop: 10 }}>
                  <button className="mng-btn primary" onClick={() => setReplying(t)} type="button" style={{ flex: 1 }}>✏️ رد</button>
                  <button className="mng-btn" onClick={() => updateStatus(t, 'in_progress')} type="button" style={{ flex: 1, background: 'rgba(245,158,11,.15)', color: '#f59e0b' }}>⏳ معالجة</button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {replying && (
        <div className="mng-modal-bg" onClick={() => setReplying(null)}>
          <div className="mng-modal" onClick={(e) => e.stopPropagation()} style={{ background: '#101010' }}>
            <div className="mng-modal-handle" />
            <h3 className="mng-modal-title" style={{ color: '#fff' }}>✏️ الرد على التذكرة</h3>
            <div style={{ background: 'rgba(255,255,255,.04)', padding: 12, borderRadius: 12, marginBottom: 14 }}>
              <div style={{ fontSize: 13, fontWeight: 800, color: '#fff', marginBottom: 4 }}>{replying.subject}</div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,.5)' }}>{replying.message}</div>
            </div>
            <div className="new-service-field">
              <label className="new-service-label" style={{ color: 'rgba(255,255,255,.6)' }}>الرد</label>
              <textarea className="new-service-textarea" value={replyText} onChange={(e) => setReplyText(e.target.value)} placeholder="اكتب ردك..." />
            </div>
            <div className="admin-form-actions">
              <button className="mng-btn ghost" onClick={() => setReplying(null)} type="button">إلغاء</button>
              <button className="mng-btn primary" onClick={() => sendReply(replying)} type="button">✓ إرسال الرد</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
