'use client';

// Safe date for hydration
const __safeDate = (d) => (typeof window !== 'undefined' ? __safeDate(d) : __safeDate(0));

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

export default function NotificationsPage() {
  const router = useRouter();
  const [entity, setEntity] = useState(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let stored = null;
    try { stored = JSON.parse(localStorage.getItem('sanad_entity') || 'null'); } catch {}
    setEntity(stored);
    load(stored);
  }, []);

  async function load(ent) {
    if (!supabase) { setLoading(false); return; }
    let query = supabase.from('notifications').select('*').order('created_at', { ascending: false }).limit(100);
    if (ent?.display_name) query = query.or(`recipient_entity.eq.${ent.display_name},recipient_entity.is.null`);
    const { data } = await query;
    setItems(Array.isArray(data) ? data : []);
    setLoading(false);
  }

  async function markRead(id) {
    await supabase.from('notifications').update({ is_read: true }).eq('id', id);
    setItems((arr) => arr.map((x) => x.id === id ? { ...x, is_read: true } : x));
  }

  async function markAllRead() {
    const unread = items.filter((x) => !x.is_read);
    for (const it of unread) {
      await supabase.from('notifications').update({ is_read: true }).eq('id', it.id);
    }
    setItems((arr) => arr.map((x) => ({ ...x, is_read: true })));
  }

  const unreadCount = items.filter((x) => !x.is_read).length;

  return (
    <div className="notif-page">
      <div className="notif-header">
        <Link href={entity ? '/merchant' : '/'} className="notif-back">→</Link>
        <span className="notif-title">🔔 الإشعارات</span>
        {unreadCount > 0 && <span className="notif-badge">{unreadCount} جديد</span>}
      </div>

      {items.length > 0 && unreadCount > 0 && (
        <div style={{ padding: '16px 20px 0' }}>
          <button className="mng-btn primary" onClick={markAllRead} type="button" style={{ width: '100%', padding: 12 }}>
            ✓ تعليم الكل كمقروء
          </button>
        </div>
      )}

      {loading ? (
        <div className="sect-empty"><span className="em">⏳</span><p>جارٍ التحميل...</p></div>
      ) : items.length === 0 ? (
        <div className="sect-empty">
          <span className="em">🔔</span>
          <p>لا توجد إشعارات</p>
        </div>
      ) : (
        <div className="notif-list">
          {items.map((n) => (
            <div key={n.id} className={`notif-card ${n.is_read ? '' : 'unread'}`} onClick={() => markRead(n.id)}>
              <div className={`notif-icon ${n.type || 'info'}`}>
                {n.type === 'warning' ? '⚠️' : n.type === 'error' ? '❌' : n.type === 'success' ? '✅' : '🔔'}
              </div>
              <div className="notif-body">
                <div className="notif-card-title">{n.title}</div>
                {n.body && <div className="notif-card-text">{n.body}</div>}
                <div className="notif-card-time">
                  {__safeDate(n.created_at).toLocaleString('ar-EG', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
