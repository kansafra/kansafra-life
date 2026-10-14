'use client';
import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

export default function ImportPage() {
  const router = useRouter();
  const [entity, setEntity] = useState(null);
  const [rows, setRows] = useState([]);
  const [headers, setHeaders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const fileRef = useRef(null);

  if (!entity && typeof window !== 'undefined') {
    let stored = null;
    try { stored = JSON.parse(localStorage.getItem('sanad_entity') || 'null'); } catch {}
    if (!stored) { router.replace('/login'); return null; }
    setEntity(stored);
  }

  function parseCSV(text) {
    const lines = text.split(/\r?\n/).filter((l) => l.trim());
    if (lines.length === 0) return { headers: [], rows: [] };
    const header = lines[0].split(',').map((h) => h.trim().replace(/^["']|["']$/g, ''));
    const dataRows = lines.slice(1).map((line) => {
      const values = [];
      let cur = '';
      let inQ = false;
      for (let i = 0; i < line.length; i++) {
        const ch = line[i];
        if (ch === '"') inQ = !inQ;
        else if (ch === ',' && !inQ) { values.push(cur.trim()); cur = ''; }
        else cur += ch;
      }
      values.push(cur.trim());
      const obj = {};
      header.forEach((h, i) => { obj[h] = values[i] || ''; });
      return obj;
    });
    return { headers: header, rows: dataRows };
  }

  function handleFile(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target.result;
      const parsed = parseCSV(text);
      setHeaders(parsed.headers);
      setRows(parsed.rows);
      setResult(null);
    };
    reader.readAsText(file, 'utf-8');
  }

  async function importData() {
    if (!rows.length) { alert('لا توجد بيانات'); return; }
    if (!supabase) return;
    setLoading(true);
    let success = 0;
    let failed = 0;

    for (const row of rows) {
      const title = row.title || row.name || row.اسم || row.الاسم || '';
      if (!title.trim()) { failed++; continue; }
      const payload = {
        provider_name: entity.display_name,
        title: title.trim(),
        description: row.description || row.الوصف || null,
        price: Number(row.price || row.السعر || 0),
        discount_percent: Number(row.discount || row.الخصم || 0),
        currency: row.currency || row.العملة || 'SYP',
        stock: Number(row.stock || row.الكمية || 0),
        unit: row.unit || row.الوحدة || 'قطعة',
        category: row.category || row.الفئة || null,
        is_active: true,
      };
      const { error } = await supabase.from('products').insert(payload);
      if (error) failed++; else success++;
    }

    setLoading(false);
    setResult({ success, failed, total: rows.length });
  }

  if (!entity) return <div className="sect-empty" style={{ padding: 80 }}><span className="em">⏳</span></div>;

  return (
    <div className="sect-page" style={{ paddingBottom: 40 }}>
      <div className="inv-header">
        <Link href="/merchant" className="inv-back">→</Link>
        <span className="inv-title">📥 استيراد منتجات</span>
      </div>

      <div style={{ padding: 20 }}>
        <div style={{ background: 'var(--f-50)', padding: 16, borderRadius: 14, marginBottom: 20, fontSize: 13, lineHeight: 1.7, color: 'var(--f-800)' }}>
          <strong style={{ display: 'block', marginBottom: 8 }}>📋 صيغة الملف:</strong>
          ملف CSV بالأعمدة: <code style={{ background: '#fff', padding: '2px 6px', borderRadius: 6 }}>title, price, discount, stock, unit, category, description</code>
          <br />
          <a href="data:text/csv;charset=utf-8,%EF%BB%BFtitle,price,discount,stock,unit,category,description%0A%D9%85%D9%86%D8%AA%D8%AC%20%D8%AA%D8%AC%D8%B1%D9%8A%D8%A8%D9%8A,1000,0,10,%D9%82%D8%B7%D8%B9%D8%A9,food,%D9%88%D8%B5%D9%81" download="sanad-products-template.csv" style={{ display: 'inline-block', marginTop: 8, color: 'var(--f-700)', fontWeight: 800, textDecoration: 'underline' }}>
            تحميل ملف القالب
          </a>
        </div>

        <input ref={fileRef} type="file" accept=".csv,text/csv" onChange={handleFile} style={{ display: 'none' }} />
        <button className="new-service-submit" onClick={() => fileRef.current?.click()} type="button" style={{ width: '100%' }}>
          {rows.length > 0 ? '📁 اختيار ملف آخر' : '📁 اختيار ملف CSV'}
        </button>

        {rows.length > 0 && (
          <>
            <div style={{ marginTop: 20, padding: 14, background: 'var(--c-50)', borderRadius: 12 }}>
              <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--n-900)', marginBottom: 8 }}>
                ✅ تم تحميل {rows.length} صف
              </div>
              <div style={{ fontSize: 11, color: 'var(--n-500)' }}>
                الأعمدة: {headers.join(', ')}
              </div>
            </div>

            <div style={{ marginTop: 16, maxHeight: 300, overflow: 'auto', border: '1px solid var(--c-200)', borderRadius: 12 }}>
              <table style={{ width: '100%', fontSize: 11, borderCollapse: 'collapse' }}>
                <thead style={{ background: 'var(--f-50)', position: 'sticky', top: 0 }}>
                  <tr>
                    {headers.slice(0, 5).map((h) => (
                      <th key={h} style={{ padding: 8, textAlign: 'right', fontWeight: 800, color: 'var(--f-700)' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.slice(0, 20).map((row, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid var(--c-100)' }}>
                      {headers.slice(0, 5).map((h) => (
                        <td key={h} style={{ padding: 6, color: 'var(--n-700)' }}>{String(row[h] || '').slice(0, 30)}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
              {rows.length > 20 && <div style={{ padding: 8, fontSize: 11, color: 'var(--n-500)', textAlign: 'center' }}>... و{rows.length - 20} صف آخر</div>}
            </div>

            <button className="new-service-submit" onClick={importData} disabled={loading} type="button" style={{ marginTop: 20 }}>
              {loading ? `... جارٍ استيراد ${rows.length} منتج` : `✓ استيراد ${rows.length} منتج`}
            </button>
          </>
        )}

        {result && (
          <div style={{ marginTop: 20, padding: 16, background: result.failed === 0 ? 'rgba(22,163,74,.1)' : 'rgba(245,158,11,.1)', border: '1px solid var(--c-200)', borderRadius: 14 }}>
            <div style={{ fontSize: 14, fontWeight: 900, color: result.failed === 0 ? '#16a34a' : '#d97706', marginBottom: 8 }}>
              {result.failed === 0 ? '✅ نجح الاستيراد' : '⚠️ نجح جزئياً'}
            </div>
            <div style={{ fontSize: 12.5, color: 'var(--n-700)', lineHeight: 1.8 }}>
              ✅ نجح: {result.success}<br />
              ❌ فشل: {result.failed}<br />
              📊 الإجمالي: {result.total}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
