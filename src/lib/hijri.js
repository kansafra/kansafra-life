// ═══════════ Sanad Hijri Calendar ═══════════

export function toHijri(date = new Date()) {
  try {
    const fmt = new Intl.DateTimeFormat('ar-SA-u-ca-islamic-umalqura', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
    return fmt.format(date);
  } catch {
    return '';
  }
}

export function toHijriShort(date = new Date()) {
  try {
    const fmt = new Intl.DateTimeFormat('ar-SA-u-ca-islamic-umalqura', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
    return fmt.format(date);
  } catch { return ''; }
}

export function formatBothDates(date = new Date()) {
  const g = new Intl.DateTimeFormat('ar-EG', {
    day: 'numeric', month: 'long', year: 'numeric',
  }).format(date);
  const h = toHijri(date);
  return { gregorian: g, hijri: h };
}

export function hijriMonthName(date = new Date()) {
  try {
    const fmt = new Intl.DateTimeFormat('ar-SA-u-ca-islamic-umalqura', { month: 'long' });
    return fmt.format(date);
  } catch { return ''; }
}
