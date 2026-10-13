// ═══════════ Share helper ═══════════
import { supabase } from './supabase';

export async function trackShare(targetType, targetId, method) {
  if (!supabase) return;
  try {
    await supabase.from('share_clicks').insert({
      target_type: targetType,
      target_id: String(targetId || ''),
      method,
    });
  } catch (e) { /* silent */ }
}

export function shareViaWhatsApp(text, url) {
  const msg = encodeURIComponent(`${text}\n${url}`);
  trackShare('link', url, 'whatsapp');
  window.open(`https://wa.me/?text=${msg}`, '_blank');
}

export function shareViaTelegram(text, url) {
  trackShare('link', url, 'telegram');
  window.open(`https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`, '_blank');
}

export function shareViaFacebook(url) {
  trackShare('link', url, 'facebook');
  window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, '_blank');
}

export function shareViaEmail(text, url) {
  trackShare('link', url, 'email');
  window.location.href = `mailto:?subject=${encodeURIComponent(text)}&body=${encodeURIComponent(url)}`;
}

export async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
    trackShare('link', text, 'copy');
    return true;
  } catch { return false; }
}

export async function nativeShare(title, text, url) {
  if (typeof navigator === 'undefined') return false;
  if (navigator.share) {
    try {
      await navigator.share({ title, text, url });
      trackShare('link', url, 'native');
      return true;
    } catch { return false; }
  }
  return false;
}
