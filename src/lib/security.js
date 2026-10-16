// ═══════════ Security ═══════════
import { supabase } from './supabase';

// ═══ TOTP (Time-based One-Time Password) ═══
const BASE32_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

function base32Encode(bytes) {
  let bits = 0, value = 0, output = '';
  for (let i = 0; i < bytes.length; i++) {
    value = (value << 8) | bytes[i];
    bits += 8;
    while (bits >= 5) {
      output += BASE32_CHARS[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  if (bits > 0) output += BASE32_CHARS[(value << (5 - bits)) & 31];
  return output;
}

export function generateTOTPSecret(length = 32) {
  const bytes = new Uint8Array(length);
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    crypto.getRandomValues(bytes);
  } else {
    for (let i = 0; i < length; i++) bytes[i] = Math.floor(Math.random() * 256);
  }
  return base32Encode(bytes);
}

// HMAC-SHA1 (simplified — works in browser)
async function hmacSHA1(keyBytes, messageBytes) {
  if (typeof crypto === 'undefined' || !crypto.subtle) return null;
  const key = await crypto.subtle.importKey('raw', keyBytes, { name: 'HMAC', hash: 'SHA-1' }, false, ['sign']);
  const sig = await crypto.subtle.sign('HMAC', key, messageBytes);
  return new Uint8Array(sig);
}

function base32Decode(str) {
  const cleaned = str.replace(/=+$/, '').toUpperCase();
  let bits = 0, value = 0;
  const bytes = [];
  for (let i = 0; i < cleaned.length; i++) {
    const idx = BASE32_CHARS.indexOf(cleaned[i]);
    if (idx === -1) continue;
    value = (value << 5) | idx;
    bits += 5;
    if (bits >= 8) {
      bytes.push((value >>> (bits - 8)) & 255);
      bits -= 8;
    }
  }
  return new Uint8Array(bytes);
}

export async function generateTOTP(secret) {
  try {
    const key = base32Decode(secret);
    const counter = Math.floor(Date.now() / 30000);
    const msg = new Uint8Array(8);
    let tmp = counter;
    for (let i = 7; i >= 0; i--) { msg[i] = tmp & 255; tmp = Math.floor(tmp / 256); }
    const hmac = await hmacSHA1(key, msg);
    if (!hmac) return '------';
    const offset = hmac[hmac.length - 1] & 15;
    const code = ((hmac[offset] & 127) << 24) | ((hmac[offset + 1] & 255) << 16) | ((hmac[offset + 2] & 255) << 8) | (hmac[offset + 3] & 255);
    return String(code % 1000000).padStart(6, '0');
  } catch {
    return '------';
  }
}

export function getOTPAuthURL(secret, label, issuer = 'سند') {
  return `otpauth://totp/${encodeURIComponent(issuer)}:${encodeURIComponent(label)}?secret=${secret}&issuer=${encodeURIComponent(issuer)}&algorithm=SHA1&digits=6&period=30`;
}

// ═══ Device Fingerprint ═══
export function getDeviceFingerprint() {
  if (typeof window === 'undefined') return 'server';
  const parts = [
    navigator.userAgent,
    navigator.language,
    screen.width + 'x' + screen.height,
    new Date().getTimezoneOffset(),
  ];
  let hash = 0;
  const str = parts.join('|');
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash = hash & hash;
  }
  return 'dev_' + Math.abs(hash).toString(36);
}

// ═══ Secrets Storage ═══
export function getCurrentUserKey() {
  if (typeof window === 'undefined') return 'guest';
  let stored = null;
  try { stored = JSON.parse(localStorage.getItem('sanad_entity') || 'null'); } catch {}
  if (stored?.username) return `entity_${stored.username}`;
  let admin = null;
  try { admin = JSON.parse(localStorage.getItem('sanad_admin') || 'null'); } catch {}
  if (admin?.username) return `admin_${admin.username}`;
  let guest = localStorage.getItem('sanad_guest_key');
  if (!guest) {
    guest = 'guest_' + Math.random().toString(36).slice(2, 12);
    try { localStorage.setItem('sanad_guest_key', guest); } catch {}
  }
  return guest;
}

export async function loadSecrets() {
  if (!supabase) return null;
  const key = getCurrentUserKey();
  const { data } = await supabase.from('user_secrets').select('*').eq('user_key', key).maybeSingle();
  return data;
}

export async function saveSecrets(updates) {
  if (!supabase) return { ok: false };
  const key = getCurrentUserKey();
  const existing = await loadSecrets();
  if (existing) {
    const { error } = await supabase.from('user_secrets').update({ ...updates, updated_at: new Date().toISOString() }).eq('user_key', key);
    return { ok: !error, error };
  }
  const { error } = await supabase.from('user_secrets').insert({ user_key: key, ...updates });
  return { ok: !error, error };
}

// ═══ Login Alerts ═══
export async function recordLogin() {
  const fp = getDeviceFingerprint();
  await saveSecrets({
    last_login: new Date().toISOString(),
    last_ip: fp,
  });
}
