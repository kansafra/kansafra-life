// ═══════════ متعدد المجتمعات ═══════════
import { supabase } from './supabase';

const STORAGE_KEY = 'sanad_community';

export function getCurrentCommunity() {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

export function setCurrentCommunity(community) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(community));
  } catch {}
  window.dispatchEvent(new Event('sanad-community-change'));
}

export async function loadCommunities() {
  if (!supabase) return [];
  const { data } = await supabase.from('communities').select('*').eq('is_active', true).order('name');
  return Array.isArray(data) ? data : [];
}

export async function loadCommunityBySlug(slug) {
  if (!supabase) return null;
  const { data } = await supabase.from('communities').select('*').eq('slug', slug).maybeSingle();
  return data;
}

export function getCommunityHeaders() {
  const c = getCurrentCommunity();
  return c ? { 'x-community': c.slug } : {};
}
