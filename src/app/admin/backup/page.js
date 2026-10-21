'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/components/Toast';

const TABLES = [
  { key: 'entities', label: 'المتاجر' },
  { key: 'customers', label: 'الزبائن' },
  { key: 'orders', label: 'الطلبات' },
  { key: 'products', label: 'المنتجات' },
  { key: 'notifications', label: 'الإشعارات' },
  { key: 'invoices', label: 'الفواتير' },
  { key: 'employees', label: 'الموظفون' },
  { key: 'coupons', label: 'الكوبونات' },
  { key: 'reviews', label: 'التقييمات' },
];

export default function AdminBackupPage() {
  const router = useRouter();
  const { success, error: toastError } = useToast();
  const [counts, setCounts] = useState({});
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(null);

  useEffect(() => {
    const admin = JSON.parse(localStorage.getItem('sanad_admin') || 'null');
    if (!admin) { router.replace('/admin/login'); return; }
    loadCounts();
  }, [router]);

  async function loadCounts() {
    if (!supabase) return;
    setLoading(true);
    try {
      const results = {};
      for (const t of TABLES) {
        const { count } = await supabase.from(t.key).select('*', { count: 'exact', head: true });
        results[t.key] = count || 0;
      }
      setCounts(results);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }

  async function exportTable(tableKey) {
    setExporting(tableKey);
    try {
      const { data, error } = await supabase.from(tableKey).select('*');
      if (error) throw error;
      const json = JSON.stringify(data, null, 2);
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${tableKey}-backup-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      success(`✅ تم تصدير ${data.length} صف`);
    } catch (err) { console.error(err); toastError('فشل التصدير'); }
    finally { setExporting(null); }
  }

  async function exportAll() {
    if (!confirm('تصدير كل الجداول؟ (قد يستغرق دقيقة)')) return;
    setExporting('all');
    try {
      const backup = { exported_at: new Date().toISOString(), tables: {} };
      for (const t of TABLES) {
        const { data } = await supabase.from(t.key).select('*');
        backup.tables[t.key] = data || [];
      }
      const json = JSON.stringify(backup, null, 2);
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `sanad-full-backup-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      success('✅ تم تصدير النسخة الكاملة');
    } catch (err) { toastError('فشل التصدير'); }
    finally { setExporting(null); }
  }

  if (loading) return <div style={{ padding: 80, textAlign: 'center' }}>⏳</div>;

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', paddingBottom: 40 }}>
      <div style={{ background: '#0f172a', padding: '16px 20px', position: 'sticky', top: 0, zIndex: 20, display: 'flex', alignItems: 'center', gap: 12 }}>
        <Link href="/admin" style={{ color: '#fff', textDecoration: 'none', fontSize: 20 }}>←</Link>
        <h1 style={{ color: '#fff', fontSize: 18, fontWeight: 900, margin: 0 }}>💾 النسخ الاحتياطي</h1>
      </div>

      <div style={{ padding: 16, maxWidth: 700, margin: '0 auto' }}>
        <div style={{ background: 'linear-gradient(135deg, #0f172a, #1e293b)', borderRadius: 18, padding: 20, color: '#fff', marginBottom: 16 }}>
          <div style={{ fontSize: 11, opacity: 0.7, fontWeight: 700, marginBottom: 6 }}>إجمالي السجلات</div>
          <div style={{ fontSize: 28, fontWeight: 900 }}>{Object.values(counts).reduce((a, b) => a + b, 0).toLocaleString()}</div>
          <button onClick={exportAll} disabled={exporting === 'all'} style={{ width: '100%', marginTop: 16, padding: 14, background: exporting === 'all' ? '#475569' : '#10b981', color: '#fff', border: 'none', borderRadius: 12, fontSize: 14, fontWeight: 900, cursor: exporting === 'all' ? 'wait' : 'pointer', fontFamily: 'inherit' }}>
            {exporting === 'all' ? '⏳ جارٍ التصدير...' : '📥 تصدير نسخة كاملة (JSON)'}
          </button>
        </div>

        <div style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.3)', borderRadius: 12, padding: 14, marginBottom: 16 }}>
          <div style={{ fontSize: 11, color: '#92400e', fontWeight: 800, lineHeight: 1.6 }}>
            💡 <strong>نصيحة:</strong> قم بتصدير نسخة احتياطية أسبوعياً على الأقل، واحفظها في مكان آمن (Google Drive / جهاز خارجي).
          </div>
        </div>

        <h2 style={{ fontSize: 14, fontWeight: 900, color: '#0f172a', marginBottom: 12 }}>📋 تصدير جدول واحد</h2>
        {TABLES.map(t => (
          <div key={t.key} style={{ background: '#fff', borderRadius: 12, padding: 14, marginBottom: 8, border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 900, color: '#0f172a' }}>{t.label}</div>
              <div style={{ fontSize: 10.5, color: '#64748b', marginTop: 2, fontFamily: 'monospace' }}>{t.key} · {counts[t.key] || 0} سجل</div>
            </div>
            <button onClick={() => exportTable(t.key)} disabled={exporting === t.key} style={{ padding: '8px 16px', background: exporting === t.key ? '#94a3b8' : 'rgba(16,185,129,0.1)', color: exporting === t.key ? '#fff' : '#10b981', border: '1px solid rgba(16,185,129,0.3)', borderRadius: 8, fontSize: 11, fontWeight: 900, cursor: exporting === t.key ? 'wait' : 'pointer', fontFamily: 'inherit' }}>
              {exporting === t.key ? '⏳' : '📥'}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
