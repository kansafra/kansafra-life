// ═══════════ Simple QR Generator (no deps) ═══════════
// ينتج SVG بسيط لـ QR يعتمد على مكتبة خارجية
export function generateQRUrl(data, size = 200) {
  const encoded = encodeURIComponent(data);
  return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encoded}`;
}

export function generateInvoiceQR(orderCode, total, currency) {
  return generateQRUrl(`SANAD|INV|${orderCode}|${total}|${currency}`);
}

export function generateAppointmentQR(aptId, patientName, date, time) {
  return generateQRUrl(`SANAD|APT|${aptId}|${patientName}|${date}|${time}`);
}

export function generateEntityQR(entityName, phone) {
  return generateQRUrl(`SANAD|ENT|${entityName}|${phone || ''}`);
}
