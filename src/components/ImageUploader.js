'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';

const BUCKET = 'sanad-files';

export default function ImageUploader({ 
  onUpload, 
  folder = 'general', 
  label = '📸 اختر صورة',
  value = null,
  aspect = '16/9',
  maxSize = 5,
  disabled = false,
}) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [preview, setPreview] = useState(value);

  async function handleFile(file) {
    if (!file || !supabase) return;

    if (!file.type.startsWith('image/')) {
      setError('يرجى اختيار ملف صورة');
      return;
    }
    if (file.size > maxSize * 1024 * 1024) {
      setError(`حجم الصورة يجب أن يكون أقل من ${maxSize} ميجابايت`);
      return;
    }

    setUploading(true);
    setError('');

    try {
      const ext = file.name.split('.').pop() || 'jpg';
      const fileName = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

      const { error: upErr } = await supabase.storage
        .from(BUCKET)
        .upload(fileName, file, { cacheControl: '3600', upsert: false });

      if (upErr) throw upErr;

      const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(fileName);
      const url = urlData.publicUrl;

      setPreview(url);
      onUpload?.(url);
    } catch (err) {
      setError('تعذّر الرفع: ' + (err.message || 'خطأ'));
    } finally {
      setUploading(false);
    }
  }

  return (
    <div style={{ marginBottom: 12 }}>
      {label && (
        <label style={{ display: 'block', fontSize: 12, fontWeight: 800, color: 'var(--n-300)', marginBottom: 6 }}>
          {label}
        </label>
      )}
      <label
        style={{
          display: 'block',
          aspectRatio: aspect,
          background: preview ? `url(${preview}) center/cover` : 'rgba(255,255,255,.04)',
          border: '2px dashed rgba(255,255,255,.15)',
          borderRadius: 14,
          cursor: disabled || uploading ? 'wait' : 'pointer',
          position: 'relative',
          overflow: 'hidden',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <input
          type="file"
          accept="image/*"
          style={{ display: 'none' }}
          disabled={disabled || uploading}
          onChange={(e) => handleFile(e.target.files?.[0])}
        />
        {!preview && !uploading && (
          <div style={{ textAlign: 'center', color: 'rgba(255,255,255,.5)' }}>
            <div style={{ fontSize: 32, marginBottom: 6 }}>📸</div>
            <div style={{ fontSize: 12, fontWeight: 700 }}>اضغط لاختيار صورة</div>
          </div>
        )}
        {uploading && (
          <div style={{ color: '#fff', fontSize: 14, fontWeight: 900 }}>
            ⏳ جارٍ الرفع...
          </div>
        )}
        {preview && !uploading && (
          <div style={{
            position: 'absolute', bottom: 8, left: 8,
            background: 'rgba(0,0,0,.7)', color: '#fff',
            padding: '4px 10px', borderRadius: 999,
            fontSize: 10, fontWeight: 900,
          }}>
            ✓ تم الرفع
          </div>
        )}
      </label>
      {error && (
        <div style={{ color: '#f87171', fontSize: 11, marginTop: 4 }}>
          ⚠️ {error}
        </div>
      )}
    </div>
  );
}
