'use client';


import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

export default function AdminAudit() {
  const router = useRouter();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let stored = null;
    try { stored = JSON.parse(localStorage.getItem('sanad_admin') || 'null'); } catch {}
    if (!stored) { router.replace('/admin/login'); return; }
    load();
  }, [router]);

  async function load() {
    if (!supabase) { setLoading(false); return; }
    const { data } = await supabase.from('audit_log').select('*').order('created_at', { ascending: false }).limit(200);
    setItems(Array.isArray(data) ? data : []);
    setLoading(false);
  }

  return (
    <div className="admin-page">
      <div className="admin-sub-header">
        <Link href="/admin" className="admin-sub-back">→</Link>
        <span className="admin-sub-title">سجل التدقيق</span>
        <span className="admin-sub-count">{items.length}</span>
      </div>

      {loading ? (
        <div className="sect-empty"><span className="em">⏳</span><p>جارٍ التحميل...</p></div>
      ) : items.length === 0 ? (
        <div className="sect-empty">
          <span className="em">📝</span>
          <p>لا توجد عمليات مسجلة بعد</p>
          <p style={{ fontSize: 11, marginTop: 8, color: 'rgba(255,255,255,.3)' }}>
            سيتم تسجيل كل عملية تلقائياً هنا
          </p>
        </div>
      ) : (
        <div className="admin-items">
          {items.map((it) => (
            <div key={it.id} className="admin-item">
              <div className="admin-item-icon" style={{ fontSize: 18 }}>📋</div>
              <div className="admin-item-body">
                <div className="admin-item-title">{it.action}</div>
                <div className="admin-item-meta">
                  {it.actor && <span>👤 {it.actor}</span>}
                  {it.target_type && <span>🎯 {it.target_type}</span>}
                  {it.ip && <span style={{ fontFamily: 'monospace', direction: 'ltr' }}>{it.ip}</span>}
                </div>
                <div style={{ fontSize: 10, color: 'rgba(255,255,255,.3)', marginTop: 4 }}>
                  {new Date(it.created_at).toLocaleString('ar-EG')}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
