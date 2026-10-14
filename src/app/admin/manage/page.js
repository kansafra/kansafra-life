'use client';


import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { ADMIN_TABLES } from '@/lib/adminTables';

export default function AdminManage() {
  const router = useRouter();
  const [counts, setCounts] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let stored = null;
    try { stored = JSON.parse(localStorage.getItem('sanad_admin') || 'null'); } catch {}
    if (!stored) { router.replace('/admin/login'); return; }
    loadCounts();
  }, [router]);

  async function loadCounts() {
    if (!supabase) { setLoading(false); return; }
    const tables = Object.keys(ADMIN_TABLES);
    const results = await Promise.all(
      tables.map((t) =>
        supabase.from(t).select('*', { count: 'exact', head: true }).then((r) => [t, r.count || 0])
      )
    );
    const map = {};
    results.forEach(([t, c]) => { map[t] = c; });
    setCounts(map);
    setLoading(false);
  }

  return (
    <div className="admin-page">
      <div className="admin-sub-header">
        <Link href="/admin" className="admin-sub-back">→</Link>
        <span className="admin-sub-title">إدارة المحتوى</span>
        <span className="admin-sub-count">{Object.keys(ADMIN_TABLES).length} جدول</span>
      </div>

      <div style={{ padding: '14px 20px 0', fontSize: 12, color: 'rgba(255,255,255,.45)', fontWeight: 600, lineHeight: 1.6 }}>
        تحكم كامل بكل شيء — عرض، تعديل، حذف من مكان واحد
      </div>

      {loading ? (
        <div className="sect-empty"><span className="em">⏳</span><p>جارٍ التحميل...</p></div>
      ) : (
        <div className="admin-tables-grid">
          {Object.entries(ADMIN_TABLES).map(([key, cfg]) => (
            <Link key={key} href={`/admin/manage/${key}`} className="admin-table-card">
              <div className="admin-table-icon">{cfg.icon}</div>
              <div className="admin-table-name">{cfg.label}</div>
              <div className="admin-table-count">{counts[key] ?? 0} سجل</div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
