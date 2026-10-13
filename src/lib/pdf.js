// ═══════════ PDF Export (uses browser print) ═══════════

export function printElement(elementId) {
  const el = document.getElementById(elementId);
  if (!el) { alert('العنصر غير موجود'); return; }

  const w = window.open('', '_blank');
  const styles = document.querySelectorAll('style, link[rel="stylesheet"]');
  let cssText = '';
  styles.forEach((s) => {
    if (s.tagName === 'LINK') cssText += `<link rel="stylesheet" href="${s.href}">`;
    else cssText += s.outerHTML;
  });

  w.document.write(`
    <!DOCTYPE html>
    <html dir="rtl" lang="ar">
    <head>
      <meta charset="UTF-8">
      <title>طباعة — سند</title>
      ${cssText}
      <style>
        @media print {
          body { padding: 20px; }
          .no-print, button { display: none !important; }
        }
        body { background: #fff; }
      </style>
    </head>
    <body>
      ${el.outerHTML}
    </body>
    </html>
  `);
  w.document.close();
  setTimeout(() => { w.print(); }, 500);
}

export function exportJSON(data, filename) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename || `export-${Date.now()}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export function exportCSV(rows, headers, filename) {
  const csv = '\uFEFF' + [
    headers,
    ...rows.map((r) => headers.map((h) => String(r[h] ?? '').replace(/,/g, ' '))),
  ].map((r) => r.join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename || `export-${Date.now()}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
