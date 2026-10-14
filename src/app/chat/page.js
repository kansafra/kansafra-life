'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function ChatListPage() {
  const router = useRouter();
  const [entity, setEntity] = useState(null);
  const [threads, setThreads] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let stored = null;
    try { stored = JSON.parse(localStorage.getItem('sanad_entity') || 'null'); } catch {}
    if (!stored) {
      setLoading(false);
      return;
    }
    setEntity(stored);
    load(stored);
  }, []);

  async function load(ent) {
    if (!supabase) { setLoading(false); return; }
    const { data } = await supabase
      .from('chat_threads')
      .select('*')
      .eq('entity_name', ent.display_name)
      .order('last_at', { ascending: false });
    setThreads(Array.isArray(data) ? data : []);
    setLoading(false);
  }

  if (!entity) {
    return (
      <div className="sect-page" style={{ paddingBottom: 100 }}>
        <div className="inv-header">
          <button className="inv-back" onClick={() => router.back()} type="button">→</button>
          <span className="inv-title">💬 الدردشة</span>
          <span style={{ width: 40 }} />
        </div>
        <div className="sect-empty" style={{ padding: '80px 20px' }}>
          <span className="em">💬</span>
          <p>سجّل دخول لعرض محادثاتك</p>
          <button className="mng-btn primary" onClick={() => router.push('/login')} type="button" style={{ marginTop: 16 }}>
            🔐 تسجيل الدخول
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="sect-page" style={{ paddingBottom: 100 }}>
      <div className="inv-header">
        <button className="inv-back" onClick={() => router.back()} type="button">→</button>
        <span className="inv-title">💬 الدردشة</span>
        <span className="inv-count">{threads.length}</span>
      </div>

      {loading ? (
        <div className="sect-empty"><span className="em">⏳</span><p>جارٍ التحميل...</p></div>
      ) : threads.length === 0 ? (
        <div className="sect-empty">
          <span className="em">💬</span>
          <p>لا توجد محادثات</p>
        </div>
      ) : (
        <div style={{ padding: 16 }}>
          {threads.map((t) => (
            <button
              key={t.id}
              onClick={() => router.push('/chat/' + t.id)}
              type="button"
              className="debt-card"
              style={{ borderRightColor: '#0f4d3a', marginBottom: 10, width: '100%', textAlign: 'right', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12 }}
            >
              <div style={{ width: 50, height: 50, borderRadius: 25, background: 'rgba(15,77,58,.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0 }}>
                👤
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 900 }}>{t.customer_name || t.customer_key || 'عميل'}</div>
                {t.last_message && <div style={{ fontSize: 11, color: 'var(--n-500)', marginTop: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.last_message}</div>}
                <div style={{ fontSize: 10, color: 'var(--n-400)', marginTop: 3, direction: 'ltr', textAlign: 'right' }}>
                  {new Date(t.last_at).toLocaleString('ar-EG', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
              {t.unread_entity > 0 && (
                <span style={{ background: '#dc2626', color: '#fff', borderRadius: 999, minWidth: 22, height: 22, fontSize: 11, fontWeight: 900, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 6px' }}>
                  {t.unread_entity}
                </span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
