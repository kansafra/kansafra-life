// ═══════════ Sanad Offline-First Cache ═══════════
const CACHE_PREFIX = 'sanad_cache_';
const CACHE_TTL = 5 * 60 * 1000; // 5 دقائق

export function cacheSet(key, data) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(CACHE_PREFIX + key, JSON.stringify({
      data,
      ts: Date.now(),
    }));
  } catch (e) {
    // قد يكون ممتلئاً
    cleanOldCache();
    try {
      localStorage.setItem(CACHE_PREFIX + key, JSON.stringify({ data, ts: Date.now() }));
    } catch {}
  }
}

export function cacheGet(key, ignoreTTL = false) {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(CACHE_PREFIX + key);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!ignoreTTL && Date.now() - parsed.ts > CACHE_TTL) return null;
    return parsed.data;
  } catch { return null; }
}

export function cacheRemove(key) {
  if (typeof window === 'undefined') return;
  try { localStorage.removeItem(CACHE_PREFIX + key); } catch {}
}

export function cleanOldCache() {
  if (typeof window === 'undefined') return;
  try {
    const keys = Object.keys(localStorage);
    keys.forEach((k) => {
      if (k.startsWith(CACHE_PREFIX)) {
        try {
          const parsed = JSON.parse(localStorage.getItem(k) || '{}');
          if (Date.now() - (parsed.ts || 0) > 24 * 60 * 60 * 1000) {
            localStorage.removeItem(k);
          }
        } catch { localStorage.removeItem(k); }
      }
    });
  } catch {}
}

export function isOnline() {
  if (typeof navigator === 'undefined') return true;
  return navigator.onLine;
}

export async function fetchWithCache(cacheKey, fetcher) {
  // إذا كنا متصلين، نجلب ثم نخزّن
  if (isOnline()) {
    try {
      const fresh = await fetcher();
      if (fresh !== null && fresh !== undefined) {
        cacheSet(cacheKey, fresh);
      }
      return fresh;
    } catch (e) {
      // فشل الاتصال → ارجع للكاش
      const cached = cacheGet(cacheKey, true);
      if (cached) return cached;
      throw e;
    }
  }
  // offline → ارجع للكاش
  const cached = cacheGet(cacheKey, true);
  return cached;
}

export function getCacheStats() {
  if (typeof window === 'undefined') return { count: 0, sizeKb: 0 };
  let count = 0, size = 0;
  try {
    Object.keys(localStorage).forEach((k) => {
      if (k.startsWith(CACHE_PREFIX)) {
        count++;
        size += (localStorage.getItem(k) || '').length;
      }
    });
  } catch {}
  return { count, sizeKb: Math.round(size / 1024) };
}
