// ═══════════ رفع الملفات ═══════════
import { supabase } from './supabase';

const BUCKET = 'sanad-files';
const MAX_SIZE_MB = 5;

export async function uploadFile(file, folder = 'general') {
  if (!supabase) return { ok: false, error: 'قاعدة البيانات غير متصلة' };
  if (!file) return { ok: false, error: 'لا يوجد ملف' };

  if (file.size > MAX_SIZE_MB * 1024 * 1024) {
    return { ok: false, error: `حجم الملف أكبر من ${MAX_SIZE_MB}MB` };
  }

  const ext = (file.name.split('.').pop() || 'bin').toLowerCase();
  const path = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

  const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
    cacheControl: '3600',
    upsert: false,
  });

  if (error) {
    console.error('Upload error:', error);
    return { ok: false, error: error.message };
  }

  const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return { ok: true, url: urlData.publicUrl, path };
}

export async function deleteFile(path) {
  if (!supabase || !path) return { ok: false };
  const { error } = await supabase.storage.from(BUCKET).remove([path]);
  return { ok: !error };
}

export function fileIcon(type = '') {
  if (type.startsWith('image/')) return '🖼️';
  if (type.startsWith('video/')) return '🎬';
  if (type.startsWith('audio/')) return '🎧';
  if (type === 'application/pdf') return '📄';
  return '📁';
}
