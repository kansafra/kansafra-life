import { supabase } from './supabase';

export async function trackPageView(path, referrer) {
  if (!supabase) return;
  try {
    let device = 'desktop';
    if (typeof navigator !== 'undefined') {
      if (/Mobi|Android/i.test(navigator.userAgent)) device = 'mobile';
      else if (/Tablet|iPad/i.test(navigator.userAgent)) device = 'tablet';
    }
    await supabase.from('audit_log').insert({
      action: 'page_view',
      target_type: 'page',
      target_id: path,
      details: { referrer: referrer || null, device },
      user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : null,
    });
  } catch (e) {}
}

export async function trackAction(action, targetType, targetId, details) {
  if (!supabase) return;
  try {
    await supabase.from('audit_log').insert({
      action,
      target_type: targetType,
      target_id: String(targetId || ''),
      details: details || null,
    });
  } catch (e) {}
}
