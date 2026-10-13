'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

export default function AdminAnalytics() {
  const router = useRouter();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ views: 0, actions: 0, today: 0, week: 0 });

  useEffect(() => {
    let stored = null;
    try { stored = JSON.parse(localStorage.getItem('sanad_admin') || 'null'); } catch {}
    if (!stored) { router.replace('/admin/login'); return; }
    load();
  }, [router]);

  async function load() {
    if (!supabase) return;
    const { data } = await supabase.from('audit_log').select('*').order('created_at', { ascending: false }).limit(500);
    const list = Array.isArray(data) ? data : [];
    setLogs(list);

    const today = new Date().toISOString().slice(0, 10);
    const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString();
    setStats({
      views: list.filter((x) => x.action === 'page_view').length,
      actions: list.filter((x) => x.action !== 'page_view').length,
      today: list.filter((x) => x.created_at?.slice(0, 10) === today).length,
      week: list.filter((x) => x.created_at >= weekAgo).length,
    });
    setLoading(false);
  }

  // Sparkline بيانات آخر 7 أيام
  const days = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    days.push({
      day: d.toLocaleDateString('ar-EG', { weekday: 'short' }),
      count: logs.filter((x) => x.created_at?.slice(0, 10) === key).length,
    });
  }
  const maxCount = Math.max(...days.map((d) => d.count), 1);

  return (
    <div className="admin-page">
      <div className="admin-sub-header">
        <Link href="/admin" className="admin-sub-back">→</Link>
        <span className="admin-sub-title">📊 التحليلات</span>
        <button onClick={load} type="button" className="mng-add-btn">🔄</button>
      </div>

      <div className="an-grid">
        <div className="an-card">
          <div className="an-val">{stats.views}</div>
          <div className="an-lbl">زيارات</div>
        </div>
        <div className="an-card">
          <div className="an-val">{stats.actions}</div>
          <div className="an-lbl">إجراءات</div>
        </div>
        <div className="an-card">
          <div className="an-val">{stats.today}</div>
          <div className="an-lbl">اليوم</div>
        </div>
        <div className="an-card">
          <div className="an-val">{stats.week}</div>
          <div className="an-lbl">آخر 7 أيام</div>
        </div>
      </div>

      <div style={{ padding: '0 20px 20px' }}>
        <div className="report-chart" style={{ background: 'rgba(255,255,255,.03)', borderColor: 'rgba(255,255,255,.08)' }}>
          <div className="report-chart-title" style={{ color: '#fff' }}>النشاط الأسبوعي</div>
          <div className="bars">
            {days.map((d, i) => (
              <div key={i} className="bar-col">
                <span className="bar-value" style={{ color: '#e8b923' }}>{d.count}</span>
                <div className="bar alt" style={{ height: `${(d.count / maxCount) * 100}%` }} />
                <span className="bar-label" style={{ color: 'rgba(255,255,255,.4)' }}>{d.day}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{ padding: '0 20px 30px' }}>
        <div style={{ fontSize: 13, fontWeight: 900, color: 'rgba(255,255,255,.7)', marginBottom: 12 }}>
          آخر الأحداث
        </div>
        {logs.slice(0, 20).map((l, i) => (
          <div key={i} style={{ padding: 12, background: 'rgba(255,255,255,.03)', border: '1px solid rgba(255,255,255,.06)', borderRadius: 12, marginBottom: 8 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
              <span style={{ fontSize: 12, fontWeight: 800, color: '#fff' }}>{l.action}</span>
              <span style={{ fontSize: 10, color: 'rgba(255,255,255,.3)', fontFamily: 'monospace' }}>
                {new Date(l.created_at).toLocaleString('ar-EG', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
            {l.target_id && <div style={{ fontSize: 10.5, color: 'rgba(255,255,255,.4)', fontFamily: 'monospace', direction: 'ltr', textAlign: 'right' }}>{l.target_id}</div>}
          </div>
        ))}
      </div>
    </div>
  );
}
