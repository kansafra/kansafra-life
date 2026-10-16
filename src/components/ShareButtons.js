'use client';
import { useState } from 'react';
import {
  shareViaWhatsApp, shareViaTelegram, shareViaFacebook,
  shareViaEmail, copyToClipboard, nativeShare
} from '@/lib/share';

export default function ShareButtons({ title, url, captureId = null }) {
  const [busy, setBusy] = useState(false);
  const currentUrl = url || (typeof window !== 'undefined' ? window.location.href : '');

  // نلتقط العنصر كصورة PNG
  async function captureAsImage() {
    if (!captureId) return null;
    try {
      const el = document.getElementById(captureId);
      if (!el) return null;
      const html2canvas = (await import('html2canvas')).default;
      const canvas = await html2canvas(el, {
        backgroundColor: '#ffffff',
        scale: 2,
        useCORS: true,
        logging: false,
      });
      return new Promise((resolve) => {
        canvas.toBlob((blob) => resolve(blob), 'image/png', 0.95);
      });
    } catch (e) {
      console.warn('capture failed:', e);
      return null;
    }
  }

  // مشاركة الصورة + الرابط معاً
  async function handleNative() {
    if (busy) return;
    setBusy(true);
    try {
      if (captureId && navigator.canShare) {
        const blob = await captureAsImage();
        if (blob) {
          const file = new File([blob], `${title || 'invoice'}.png`, { type: 'image/png' });
          if (navigator.canShare({ files: [file] })) {
            try {
              await navigator.share({
                title,
                text: title,
                files: [file],
              });
              setBusy(false);
              return;
            } catch (e) {
              if (e.name !== 'AbortError') console.warn('share files failed:', e);
            }
          }
        }
      }
      // fallback: مشاركة نص + رابط
      const ok = await nativeShare(title, title, currentUrl);
      if (!ok) alert('المتصفح لا يدعم المشاركة المباشرة');
    } catch (err) {
      console.warn(err);
    }
    setBusy(false);
  }

  // مشاركة كصورة عبر واتساب مباشرة
  async function handleWhatsAppImage() {
    if (busy) return;
    setBusy(true);
    const blob = await captureAsImage();
    if (blob && navigator.canShare) {
      const file = new File([blob], `${title || 'invoice'}.png`, { type: 'image/png' });
      if (navigator.canShare({ files: [file] })) {
        try {
          await navigator.share({ files: [file], title, text: title });
          setBusy(false);
          return;
        } catch (e) { /* fallback */ }
      }
    }
    // fallback: نص واتساب
    shareViaWhatsApp(`${title}\n${currentUrl}`);
    setBusy(false);
  }

  async function handleCopy() {
    const ok = await copyToClipboard(currentUrl);
    if (ok) alert('✅ تم نسخ الرابط');
  }

  return (
    <div className="share-row">
      <button
        className="share-btn native"
        onClick={handleNative}
        type="button"
        disabled={busy}
        style={{
          background: busy ? '#666' : 'linear-gradient(135deg, #0ea5e9, #0284c7)',
          color: '#fff',
          gridColumn: '1 / -1',
          padding: '14px 16px',
          fontSize: 14,
          fontWeight: 900,
        }}
      >
        <span className="share-icon">{busy ? '⏳' : '📤'}</span>
        {busy ? '... جارٍ التحضير' : '📄 مشاركة الفاتورة كصورة'}
      </button>

      <button className="share-btn wa" onClick={handleWhatsAppImage} type="button" disabled={busy}>
        <span className="share-icon">💬</span>
        واتساب
      </button>
      <button className="share-btn tg" onClick={() => shareViaTelegram(title, currentUrl)} type="button">
        <span className="share-icon">✈️</span>
        تيليجرام
      </button>
      <button className="share-btn fb" onClick={() => shareViaFacebook(currentUrl)} type="button">
        <span className="share-icon">📘</span>
        فيسبوك
      </button>
      <button className="share-btn em" onClick={() => shareViaEmail(title, currentUrl)} type="button">
        <span className="share-icon">✉️</span>
        إيميل
      </button>
      <button className="share-btn cp" onClick={handleCopy} type="button">
        <span className="share-icon">📋</span>
        نسخ
      </button>
    </div>
  );
}
