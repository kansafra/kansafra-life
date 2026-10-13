'use client';
import { shareViaWhatsApp, shareViaTelegram, shareViaFacebook, shareViaEmail, copyToClipboard, nativeShare } from '@/lib/share';

export default function ShareButtons({ title, url }) {
  const currentUrl = url || (typeof window !== 'undefined' ? window.location.href : '');

  async function handleNative() {
    const ok = await nativeShare(title, title, currentUrl);
    if (!ok) alert('المتصفح لا يدعم المشاركة المباشرة');
  }

  async function handleCopy() {
    const ok = await copyToClipboard(currentUrl);
    if (ok) alert('✅ تم نسخ الرابط');
  }

  return (
    <div className="share-row">
      <button className="share-btn wa" onClick={() => shareViaWhatsApp(title, currentUrl)} type="button">
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
