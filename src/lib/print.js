// ═══════════ Sanad Print Helpers ═══════════

export function printThermal(elementId, options = {}) {
  const el = document.getElementById(elementId);
  if (!el) { alert('العنصر غير موجود'); return; }

  const { width = '80mm', title = 'طباعة' } = options;
  const w = window.open('', '_blank');
  if (!w) { alert('الرجاء السماح بالنوافذ المنبثقة'); return; }

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
      <title>${title}</title>
      ${cssText}
      <style>
        @page { size: ${width} auto; margin: 4mm; }
        body { font-family: 'Cairo', monospace; font-size: 12px; padding: 0; margin: 0; color: #000; }
        * { color: #000 !important; background: #fff !important; box-shadow: none !important; }
        .no-print, .invoice-actions, .share-row, button { display: none !important; }
        table { width: 100%; border-collapse: collapse; font-size: 11px; }
        th, td { border-bottom: 1px dashed #999; padding: 4px 2px; }
        h1 { font-size: 16px; margin: 0 0 4px; text-align: center; }
        .invoice-brand-mark img { width: 60px; height: 60px; }
      </style>
    </head>
    <body>
      ${el.outerHTML}
      <script>window.onload = () => { setTimeout(() => { window.print(); window.close(); }, 300); };</script>
    </body>
    </html>
  `);
  w.document.close();
}

export function printA4(elementId, title = 'طباعة') {
  const el = document.getElementById(elementId);
  if (!el) return;
  const w = window.open('', '_blank');
  const styles = document.querySelectorAll('style, link[rel="stylesheet"]');
  let css = '';
  styles.forEach((s) => {
    if (s.tagName === 'LINK') css += `<link rel="stylesheet" href="${s.href}">`;
    else css += s.outerHTML;
  });
  w.document.write(`
    <!DOCTYPE html><html dir="rtl" lang="ar"><head><meta charset="UTF-8"><title>${title}</title>
    ${css}
    <style>@page{size:A4;margin:15mm}body{background:#fff}.no-print,.invoice-actions,button{display:none!important}</style>
    </head><body>${el.outerHTML}<script>window.onload=()=>setTimeout(()=>{window.print();window.close()},300)</script></body></html>
  `);
  w.document.close();
}
