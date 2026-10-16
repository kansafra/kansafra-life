'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';

const BUCKET = 'sanad-files';

export default function FileUploader({
  onUpload,
  folder = 'files',
  label = '📎 اختر ملف',
  value = null,
  accept = '.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt',
  maxSize = 20,
  disabled = false,
}) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [fileName, setFileName] = useState(
    value ? value.split('/').pop() : null
  );

  async function handleFile(file) {
    if (!file || !supabase) return;

    if (file.size > maxSize * 1024 * 1024) {
      setError(`حجم الملف يجب أن يكون أقل من ${maxSize} ميجابايت`);
      return;
    }

    setUploading(true);
    setError('');

    try {
      const ext = file.name.split('.').pop() || 'pdf';
      const safeName = file.name
        .replace(/[^a-zA-Z0-9._-]/g, '_')
        .slice(0, 50);
      const path = `${folder}/${Date.now()}-${safeName}`;

      const { error: upErr } = await supabase.storage
        .from(BUCKET)
        .upload(path, file, {
          cacheControl: '3600',
          upsert: false,
          contentType: file.type,
        });

      if (upErr) throw upErr;

      const { data: urlData } = supabase.storage
        .from(BUCKET)
        .getPublicUrl(path);
      const url = urlData.publicUrl;

      setFileName(file.name);
      onUpload?.(url, file.name);
    } catch (err) {
      setError('تعذّر الرفع: ' + (err.message || 'خطأ'));
    } finally {
      setUploading(false);
    }
  }

  return (
    <div style={{ marginBottom: 12 }}>
      {label && (
        <label style={{
          display: 'block', fontSize: 12, fontWeight: 800,
          color: 'var(--n-300)', marginBottom: 6,
        }}>
          {label}
        </label>
      )}
      <label
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          padding: '14px 16px',
          background: fileName ? 'rgba(34,197,94,.08)' : 'rgba(255,255,255,.04)',
          border: fileName ? '1px solid rgba(34,197,94,.3)' : '2px dashed rgba(255,255,255,.15)',
          borderRadius: 14,
          cursor: disabled || uploading ? 'wait' : 'pointer',
        }}
      >
        <input
          type="file"
          accept={accept}
          style={{ display: 'none' }}
          disabled={disabled || uploading}
          onChange={(e) => handleFile(e.target.files?.[0])}
        />
        <div style={{
          fontSize: 26,
          width: 40, height: 40,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: fileName ? 'rgba(34,197,94,.15)' : 'rgba(255,255,255,.05)',
          borderRadius: 10,
        }}>
          {uploading ? '⏳' : fileName ? '✅' : '📎'}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontSize: 13, fontWeight: 900, color: '#fff',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            {uploading ? '... جارٍ الرفع' : fileName || 'اختر ملفاً (PDF، Word، Excel)'}
          </div>
          <div style={{ fontSize: 10.5, color: 'var(--n-500)', marginTop: 2 }}>
            الحجم الأقصى: {maxSize} ميجابايت
          </div>
        </div>
        {fileName && !uploading && (
          <span style={{ fontSize: 11, color: '#22c55e', fontWeight: 900 }}>✓ تم</span>
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
