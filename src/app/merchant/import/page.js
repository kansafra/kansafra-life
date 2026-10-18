'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { useCurrentUser } from '@/lib/useCurrentUser';
import { useToast } from '@/components/Toast';

export default function ImportPage() {
  const router = useRouter();
  const { user, loading: uL, isOwner, isSectionAdmin, dataOwnerName } = useCurrentUser();
  const { success, error: tE } = useToast();
  const [importType, setImportType] = useState('products');
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState([]);
  const [importing, setImporting] = useState(false);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (uL) return;
    if (!user) { router.replace('/login'); return; }
    if (!isOwner && !isSectionAdmin) { router.replace('/merchant'); return; }
    loadLogs();
  }, [user, uL, isOwner, isSectionAdmin]);

  async function loadLogs() {
    if (!supabase || !dataOwnerName) { setLoading(false); return; }
    const { data } = await supabase.from('import_logs').select('*').eq('entity_name', dataOwnerName).order('created_at', { ascending: false }).limit(10);
    setLogs(data || []);
    setLoading(false);
  }

  function parseCSV(text) {
    const lines = text.trim().split('\n');
    if (lines.length < 2) return { headers: [], rows: [] };
    const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
    const rows = lines.slice(1).map(line => {
      const values = [];
      let current = '';
      let inQuote = false;
      for (let i = 0; i < line.length; i++) {
        const ch = line[i];
        if (ch === '"') { inQuote = !inQuote; continue; }
        if (ch === ',' && !inQuote) { values.push(current.trim()); current = ''; }
        else current += ch;
      }
      values.push(current.trim());
      const obj = {};
      headers.forEach((h, i) => obj[h] = values[i] || '');
      return obj;
    });
    return { headers, rows };
  }

  function handleFile(e) {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const { headers, rows } = parseCSV(evt.target.result);
        setPreview(rows.slice(0, 5));
      } catch (e) { tE('ملف غير صالح'); }
    };
    reader.readAsText(f, 'UTF-8');
  }

  async function startImport() {
    if (!file) { tE('اختر ملفاً'); return; }
    setImporting(true);
    try {
      const text = await file.text();
      const { rows } = parseCSV(text);
      if (rows.length === 0) { tE('الملف فارغ'); setImporting(false); return; }

      let successCount = 0, failCount = 0;
      const errors = [];

      for (const row of rows) {
        try {
          if (importType === 'products') {
            if (!row.title || !row.price) throw new Error('title/price مطلوب');
            const { error } = await supabase.from('products').insert({
              provider_name: dataOwnerName,
              title: row.title,
              description: row.description || null,
              price: Number(row.price) || 0,
              currency: row.currency || 'SYP',
              category: row.category || 'other',
              stock: Number(row.stock) || 1,
              unit: row.unit || 'قطعة',
              is_active: true,
              moderation_status: 'approved',
            });
            if (error) throw error;
          } else if (importType === 'customers') {
            if (!row.name || !row.phone) throw new Error('name/phone مطلوب');
            const { error } = await supabase.from('customers').insert({
              entity_name: dataOwnerName,
              name: row.name,
              phone: row.phone,
              address: row.address || null,
            });
            if (error) throw error;
          }
          successCount++;
        } catch (e) {
          failCount++;
          if (errors.length < 10) errors.push(`صف ${successCount + failCount}: ${e.message}`);
        }
      }

      await supabase.from('import_logs').insert({
        entity_name: dataOwnerName,
        import_type: importType,
        total_rows: rows.length,
        success_rows: successCount,
        failed_rows: failCount,
        error_log: errors.join('\n') || null,
      });

      success(`✅ نجح ${successCount} · فشل ${failCount}`);
      setFile(null);
      setPreview([]);
      loadLogs();
    } catch (e) { tE('تعذّر: ' + e.message); }
    setImporting(false);
  }

  function downloadTemplate() {
    const templates = {
      products: 'title,description,price,currency,category,stock,unit\nمنتج 1,وصف المنتج,1000,SYP,other,10,قطعة',
      customers: 'name,phone,address\nأحمد,0956111111,كنصفرة',
    };
    const blob = new Blob(['\uFEFF' + templates[importType]], { type: 'text/csv;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `template-${importType}.csv`;
    a.click();
    success('تم التحميل');
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', paddingBottom: 40 }}>
      <div style={{ position: 'sticky', top: 0, zIndex: 10, background: '#0f4d3a', padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <Link href="/merchant" style={{ color: '#fff', textDecoration: 'none', fontSize: 20, width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,.1)', borderRadius: '50%' }}>→</Link>
        <div style={{ flex: 1, color: '#fff', fontSize: 16, fontWeight: 900 }}>📥 الاستيراد</div>
      </div>

      <div style={{ padding: 16 }}>
        <div style={{ background: '#fff', borderRadius: 16, padding: 16, marginBottom: 12, border: '1px solid #e5e7eb' }}>
          <div style={{ fontSize: 14, fontWeight: 900, marginBottom: 12 }}>1️⃣ اختر النوع</div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => setImportType('products')} style={{ flex: 1, padding: 12, background: importType === 'products' ? '#0f4d3a' : '#f1f5f9', color: importType === 'products' ? '#fff' : '#64748b', border: 'none', borderRadius: 10, fontWeight: 900, cursor: 'pointer', fontFamily: 'inherit' }}>📦 منتجات</button>
            <button onClick={() => setImportType('customers')} style={{ flex: 1, padding: 12, background: importType === 'customers' ? '#0f4d3a' : '#f1f5f9', color: importType === 'customers' ? '#fff' : '#64748b', border: 'none', borderRadius: 10, fontWeight: 900, cursor: 'pointer', fontFamily: 'inherit' }}>👥 عملاء</button>
          </div>
        </div>

        <div style={{ background: '#fff', borderRadius: 16, padding: 16, marginBottom: 12, border: '1px solid #e5e7eb' }}>
          <div style={{ fontSize: 14, fontWeight: 900, marginBottom: 12 }}>2️⃣ حمّل القالب</div>
          <button onClick={downloadTemplate} style={{ width: '100%', padding: 12, background: 'rgba(59,130,246,.1)', color: '#3b82f6', border: '1px solid rgba(59,130,246,.3)', borderRadius: 10, fontWeight: 900, cursor: 'pointer', fontFamily: 'inherit' }}>⬇️ تحميل قالب CSV</button>
        </div>

        <div style={{ background: '#fff', borderRadius: 16, padding: 16, marginBottom: 12, border: '1px solid #e5e7eb' }}>
          <div style={{ fontSize: 14, fontWeight: 900, marginBottom: 12 }}>3️⃣ ارفع الملف</div>
          <input type="file" accept=".csv" onChange={handleFile} id="file-input" style={{ display: 'none' }} />
          <label htmlFor="file-input" style={{ display: 'block', padding: 30, border: '2px dashed #cbd5e1', borderRadius: 12, textAlign: 'center', cursor: 'pointer', background: '#f8fafc' }}>
            <div style={{ fontSize: 42, marginBottom: 8 }}>📁</div>
            <div style={{ fontSize: 13, fontWeight: 800, color: '#334155' }}>{file ? file.name : 'اضغط لاختيار ملف CSV'}</div>
          </label>
        </div>

        {preview.length > 0 && (
          <div style={{ background: '#fff', borderRadius: 16, padding: 16, marginBottom: 12, border: '1px solid #e5e7eb' }}>
            <div style={{ fontSize: 14, fontWeight: 900, marginBottom: 12 }}>👁️ معاينة ({preview.length} صف)</div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', fontSize: 11, borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#f1f5f9' }}>
                    {Object.keys(preview[0]).map(k => <th key={k} style={{ padding: 8, textAlign: 'right', fontWeight: 900 }}>{k}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {preview.map((row, i) => (
                    <tr key={i} style={{ borderTop: '1px solid #e5e7eb' }}>
                      {Object.values(row).map((v, j) => <td key={j} style={{ padding: 8, textAlign: 'right', color: '#64748b' }}>{v}</td>)}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <button onClick={startImport} disabled={!file || importing} style={{ width: '100%', padding: 16, background: !file || importing ? '#94a3b8' : 'linear-gradient(135deg,#10b981,#059669)', color: '#fff', border: 'none', borderRadius: 12, fontSize: 15, fontWeight: 900, cursor: !file || importing ? 'not-allowed' : 'pointer', fontFamily: 'inherit', marginBottom: 16 }}>
          {importing ? '⏳ جارٍ الاستيراد...' : '✓ بدء الاستيراد'}
        </button>

        {logs.length > 0 && (
          <div style={{ background: '#fff', borderRadius: 16, padding: 16, border: '1px solid #e5e7eb' }}>
            <div style={{ fontSize: 14, fontWeight: 900, marginBottom: 12 }}>📋 آخر العمليات</div>
            {logs.map(l => (
              <div key={l.id} style={{ padding: '8px 0', borderBottom: '1px solid #f1f5f9', fontSize: 11 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <strong>{l.import_type === 'products' ? '📦 منتجات' : '👥 عملاء'}</strong>
                  <span style={{ color: '#64748b' }}>{new Date(l.created_at).toLocaleDateString('ar-EG')}</span>
                </div>
                <div style={{ color: '#10b981', fontWeight: 800 }}>✅ {l.success_rows} نجح {l.failed_rows > 0 && <span style={{ color: '#ef4444' }}> · ❌ {l.failed_rows} فشل</span>}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
