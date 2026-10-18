'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/components/Toast';

const TABLES = [
  { key: 'entities', label: 'المزودون', icon: '🏪' },
  { key: 'orders', label: 'الطلبات', icon: '🛍️' },
  { key: 'products', label: 'المنتجات', icon: '📦' },
  { key: 'services', label: 'الخدمات', icon: '🛠️' },
  { key: 'customers', label: 'العملاء', icon: '👥' },
  { key: 'reviews', label: 'التقييمات', icon: '⭐' },
  { key: 'coupons', label: 'الكوبونات', icon: '🎟️' },
  { key: 'announcements', label: 'الإعلانات', icon: '📢' },
];

export default function AdminBackup() {
  const router = useRouter();
  const { success, error: tE } = useToast();
  const [counts, setCounts] = useState({});
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [selected, setSelected] = useState(TABLES.map(t => t.key));

  useEffect(() => {
    let stored = null;
    try { stored = JSON.parse(localStorage.getItem('sanad_admin') || 'null'); } catch {}
    if (!stored) { router.replace('/admin/login'); return; }
    loadCounts();
  }, [router]);

  async function loadCounts() {
    if (!supabase) { setLoading(false); return; }
    const c = {};
    for (const t of TABLES) {
      const { count } = await supabase.from(t.key).select('*', { count: 'exact', head: true });
      c[t.key] = count || 0;
    }
    setCounts(c);
    setLoading(false);
  }

  async function exportTable(key) {
    const { data, error } = await supabase.from(key).select('*');
    if (error) throw error;
    return data || [];
  }

  async function exportAll() {
    setExporting(true);
    try {
      const backup = {
        exported_at: new Date().toISOString(),
        version: '1.0',
        platform: 'Sanad',
        tables: {},
      };
      for (const key of selected) {
        const data = await exportTable(key);
        backup.tables[key] = data;
      }
      const json = JSON.stringify(backup, null, 2);
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `sanad-backup-${new Date().toISOString().slice(0,10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      success(`✅ تم تصدير ${Object.keys(backup.tables).length} جدول`);
    } catch (e) { tE('تعذّر: ' + e.message); }
    setExporting(false);
  }

  function toggle(key) {
    setSelected(prev => prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]);
  }

  const totalRecords = Object.values(counts).reduce((s, c) => s + c, 0);

  if (loading) return <div style={{ padding: 60, textAlign: 'center' }}>⏳</div>;

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', paddingBottom: 40 }}>
      <div style={{ position: 'sticky', top: 0, zIndex: 10, background: '#0f4d3a', padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <Link href="/admin" style={{ color: '#fff', textDecoration: 'none', fontSize: 20, width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,.1)', borderRadius: '50%' }}>→</Link>
        <div style={{ flex: 1, color: '#fff', fontSize: 16, fontWeight: 900 }}>💾 النسخ الاحتياطي</div>
      </div>

      <div style={{ padding: 16 }}>
        <div style={{ background: 'linear-gradient(135deg,#0f4d3a,#075640)', borderRadius: 18, padding: 20, color: '#fff', marginBottom: 16 }}>
          <div style={{ fontSize: 11, opacity: 0.85, marginBottom: 6 }}>إجمالي السجلات</div>
          <div style={{ fontSize: 28, fontWeight: 900 }}>{totalRecords.toLocaleString()}</div>
          <div style={{ fontSize: 11, opacity: 0.75, marginTop: 8 }}>{TABLES.length} جدول</div>
        </div>

        <div style={{ background: '#fff', borderRadius: 16, padding: 16, marginBottom: 12, border: '1px solid #e5e7eb' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <div style={{ fontSize: 14, fontWeight: 900 }}>📋 الجداول</div>
            <button onClick={() => setSelected(selected.length === TABLES.length ? [] : TABLES.map(t => t.key))} style={{ padding: '4px 10px', background: '#f1f5f9', border: 'none', borderRadius: 6, fontSize: 11, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit' }}>
              {selected.length === TABLES.length ? 'إلغاء الكل' : 'تحديد الكل'}
            </button>
          </div>
          {TABLES.map(t => (
            <label key={t.key} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: 12, background: selected.includes(t.key) ? 'rgba(16,185,129,.08)' : '#f8fafc', borderRadius: 10, marginBottom: 6, cursor: 'pointer', border: `1px solid ${selected.includes(t.key) ? '#10b981' : 'transparent'}` }}>
              <input type="checkbox" checked={selected.includes(t.key)} onChange={() => toggle(t.key)} />
              <span style={{ fontSize: 18 }}>{t.icon}</span>
              <span style={{ flex: 1, fontSize: 13, fontWeight: 800 }}>{t.label}</span>
              <span style={{ fontSize: 12, color: '#64748b', fontWeight: 800 }}>{counts[t.key]?.toLocaleString() || 0}</span>
            </label>
          ))}
        </div>

        <button onClick={exportAll} disabled={exporting || selected.length === 0} style={{
          width: '100%', padding: 16, background: exporting || selected.length === 0 ? '#94a3b8' : 'linear-gradient(135deg,#10b981,#059669)',
          color: '#fff', border: 'none', borderRadius: 12, fontSize: 15, fontWeight: 900,
          cursor: exporting || selected.length === 0 ? 'not-allowed' : 'pointer', fontFamily: 'inherit',
          boxShadow: '0 4px 12px rgba(16,185,129,.3)',
        }}>
          {exporting ? '⏳ جارٍ التصدير...' : `⬇️ تصدير ${selected.length} جدول (JSON)`}
        </button>

        <div style={{ marginTop: 16, padding: 12, background: 'rgba(251,191,36,.1)', border: '1px solid rgba(251,191,36,.3)', borderRadius: 10, fontSize: 11, color: '#92400e', lineHeight: 1.7 }}>
          <strong>💡 نصيحة:</strong> خزّن النسخة في مكان آمن (Google Drive, SD Card). يتم تصدير البيانات بشكل JSON — يمكن استعادتها لاحقاً.
        </div>
      </div>
    </div>
  );
}
