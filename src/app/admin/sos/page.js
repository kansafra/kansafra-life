'use client';


import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

const CATS = { medical: '🚑 طبي', security: '🚨 أمني', civil: '🚒 مدني', service: '⚡ خدمي', env: '🌿 بيئي' };
const STATUS = { received: 'مستلم', dispatched: 'مُرسل', in_progress: 'جارٍ', resolved: 'مكتمل', cancelled: 'ملغي' };
const STATUS_BADGE = { received:'danger', dispatched:'warn', in_progress:'info', resolved:'active', cancelled:'info' };

export default function AdminSOS() {
  const router = useRouter();
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    let stored = null;
    try { stored = JSON.parse(localStorage.getItem('sanad_admin') || 'null'); } catch {}
    if (!stored) { router.replace('/admin/login'); return; }
    load();
  }, [router]);

  async function load() {
    if (!supabase) { setLoading(false); return; }
    const { data } = await supabase.from('sos_alerts').select('*').order('created_at', { ascending: false });
    setAlerts(Array.isArray(data) ? data : []);
    setLoading(false);
  }

  async function updateStatus(id, status) {
    const { error } = await supabase.from('sos_alerts').update({ status }).eq('id', id);
    if (!error) setAlerts((arr) => arr.map((a) => a.id === id ? { ...a, status } : a));
  }

  const filtered = filter === 'all' ? alerts : alerts.filter((a) => a.status === filter);

  return (
    <div className="admin-page">
      <div className="admin-sub-header">
        <Link href="/admin" className="admin-sub-back">→</Link>
        <span className="admin-sub-title">إدارة SOS</span>
        <span className="admin-sub-count">{alerts.length}</span>
      </div>

      <div className="admin-filters">
        <button className={`admin-filter ${filter === 'all' ? 'active' : ''}`} onClick={() => setFilter('all')} type="button">الكل</button>
        {Object.entries(STATUS).map(([k, v]) => (
          <button key={k} className={`admin-filter ${filter === k ? 'active' : ''}`} onClick={() => setFilter(k)} type="button">
            {v}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="sect-empty"><span className="em">⏳</span><p>جارٍ التحميل...</p></div>
      ) : filtered.length === 0 ? (
        <div className="sect-empty"><span className="em">🆘</span><p>لا توجد بلاغات</p></div>
      ) : (
        <div className="admin-items">
          {filtered.map((a) => (
            <div key={a.id} className="admin-item">
              <div className="admin-item-icon" style={{ background: 'rgba(220,38,38,.15)', borderColor: 'rgba(220,38,38,.3)', color: '#f87171' }}>
                {CATS[a.category]?.split(' ')[0] || '🚨'}
              </div>
              <div className="admin-item-body">
                <div className="admin-item-title">{a.full_name}</div>
                <div className="admin-item-meta">
                  <span>{a.phone}</span>
                  <span>{CATS[a.category] || a.category}</span>
                  <span className={`admin-badge ${STATUS_BADGE[a.status] || 'info'}`}>{STATUS[a.status] || a.status}</span>
                </div>
                <div style={{ fontSize: 10, color: 'rgba(255,255,255,.3)', marginTop: 4, fontFamily: 'monospace', direction: 'ltr' }}>
                  {a.ref_code} · {new Date(a.created_at).toLocaleString('ar-EG', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
              <div className="admin-item-actions" style={{ flexDirection: 'column', gap: 4 }}>
                {a.status !== 'resolved' && a.status !== 'cancelled' && (
                  <button className="admin-act-btn ok" onClick={() => updateStatus(a.id, 'resolved')} type="button" title="إكمال">✓</button>
                )}
                <a href={`tel:${a.phone}`} className="admin-act-btn" style={{ textDecoration: 'none' }} title="اتصال">📞</a>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
