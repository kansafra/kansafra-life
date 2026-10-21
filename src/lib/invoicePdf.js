'use client';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

export async function generateInvoicePdf(element) {
  // انتظر تحميل الخطوط العربية (مهم جداً)
  if (document.fonts && document.fonts.ready) {
    await document.fonts.ready;
  }

  const canvas = await html2canvas(element, {
    scale: 2,
    useCORS: true,
    backgroundColor: '#ffffff',
    logging: false,
    windowWidth: 794,
  });

  const imgData = canvas.toDataURL('image/png');
  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pdfWidth = pdf.internal.pageSize.getWidth();
  const pdfHeight = pdf.internal.pageSize.getHeight();
  const imgHeight = (canvas.height * pdfWidth) / canvas.width;

  let heightLeft = imgHeight;
  let position = 0;

  pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, imgHeight);
  heightLeft -= pdfHeight;

  while (heightLeft > 0) {
    position = heightLeft - imgHeight;
    pdf.addPage();
    pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, imgHeight);
    heightLeft -= pdfHeight;
  }

  return pdf;
}

export async function downloadInvoicePdf(element, filename) {
  const pdf = await generateInvoicePdf(element);
  pdf.save(filename);
  return { ok: true };
}

export async function shareInvoicePdf(element, invoice, provider) {
  const pdf = await generateInvoicePdf(element);
  const blob = pdf.output('blob');
  const filename = `فاتورة-${invoice.invoice_number}.pdf`;
  const file = new File([blob], filename, { type: 'application/pdf' });

  if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
    try {
      await navigator.share({
        files: [file],
        title: `فاتورة ${invoice.invoice_number}`,
        text: `فاتورة من ${provider?.display_name || 'سند'} - الإجمالي: ${Number(invoice.total).toLocaleString()} ${invoice.currency}`,
      });
      return { shared: true };
    } catch (e) {
      if (e.name === 'AbortError') return { cancelled: true };
    }
  }

  pdf.save(filename);
  return { downloaded: true };
}
