// ═══════════ التقييمات والمفضلة ═══════════
import { supabase } from './supabase';

export async function loadReviews(targetType, targetId) {
  if (!supabase) return [];
  const { data } = await supabase
    .from('reviews')
    .select('*')
    .eq('target_type', targetType)
    .eq('target_id', targetId)
    .eq('is_approved', true)
    .order('created_at', { ascending: false });
  return Array.isArray(data) ? data : [];
}

export async function submitReview({
  targetType, targetId, targetName,
  reviewerName, reviewerPhone, rating, comment,
}) {
  if (!supabase) return { ok: false, error: 'قاعدة البيانات غير متصلة' };
  const { error } = await supabase.from('reviews').insert({
    target_type: targetType,
    target_id: targetId,
    target_name: targetName || null,
    reviewer_name: reviewerName,
    reviewer_phone: reviewerPhone || null,
    rating: Number(rating),
    comment: comment || null,
  });
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

export function avgRating(reviews) {
  if (!reviews.length) return { avg: 0, count: 0, bars: [0,0,0,0,0] };
  const sum = reviews.reduce((s, r) => s + Number(r.rating || 0), 0);
  const bars = [0, 0, 0, 0, 0];
  reviews.forEach((r) => {
    const idx = Math.max(0, Math.min(4, 5 - Number(r.rating)));
    bars[idx]++;
  });
  return {
    avg: (sum / reviews.length).toFixed(1),
    count: reviews.length,
    bars,
  };
}

// ═══ Favorites ═══
const FAV_KEY = 'sanad_fav_key';
const FAV_STORE = 'sanad_favorites_v1';

export function getFavKey() {
  if (typeof window === 'undefined') return 'server';
  let key = localStorage.getItem(FAV_KEY);
  if (!key) {
    key = 'guest_' + Math.random().toString(36).slice(2, 12);
    try { localStorage.setItem(FAV_KEY, key); } catch {}
  }
  return key;
}

export function getFavorites() {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(FAV_STORE);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

export function isFavorite(targetType, targetId) {
  return getFavorites().some((f) => f.target_type === targetType && f.target_id === targetId);
}

export function toggleFavorite(item) {
  const list = getFavorites();
  const idx = list.findIndex((f) => f.target_type === item.target_type && f.target_id === item.target_id);
  if (idx >= 0) {
    list.splice(idx, 1);
  } else {
    list.unshift({ ...item, added_at: Date.now() });
  }
  try { localStorage.setItem(FAV_STORE, JSON.stringify(list)); } catch {}
  window.dispatchEvent(new Event('sanad-fav-updated'));
  return idx < 0;
}

export function removeFavorite(targetType, targetId) {
  const list = getFavorites().filter(
    (f) => !(f.target_type === targetType && f.target_id === targetId)
  );
  try { localStorage.setItem(FAV_STORE, JSON.stringify(list)); } catch {}
  window.dispatchEvent(new Event('sanad-fav-updated'));
}
