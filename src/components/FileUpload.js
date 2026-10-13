'use client';
import { useState, useRef } from 'react';
import { uploadFile, fileIcon } from '@/lib/upload';

export default function FileUpload({ folder = 'general', onUpload, currentUrl, label = 'ارفع ملف' }) {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(currentUrl || '');
  const [uploading, setUploading] = useState(false);
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef(null);

  function handleFile(f) {
    if (!f) return;
    setFile(f);
    if (f.type.startsWith('image/')) {
      const url = URL.createObjectURL(f);
      setPreview(url);
    } else {
      setPreview('');
    }
  }

  async function upload() {
    if (!file) return;
    setUploading(true);
    const result = await uploadFile(file, folder);
    setUploading(false);
    if (!result.ok) { alert('تعذّر الرفع: ' + result.error); return; }
    setPreview(result.url);
    onUpload?.(result.url);
  }

  function remove() {
    setFile(null);
    setPreview('');
    onUpload?.('');
    if (inputRef.current) inputRef.current.value = '';
  }

  return (
    <div>
      {preview ? (
        <div className="file-preview">
          {preview.startsWith('blob:') || preview.startsWith('http') ? (
            <img src={preview} alt="" />
          ) : (
            <span style={{ fontSize: 40 }}>{fileIcon(file?.type)}</span>
          )}
          <button className="remove" onClick={remove} type="button">✕</button>
        </div>
      ) : (
        <div
          className={`file-drop ${dragging ? 'dragover' : ''}`}
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => { e.preventDefault(); setDragging(false); handleFile(e.dataTransfer.files[0]); }}
        >
          <div className="file-drop-icon">📤</div>
          <div className="file-drop-text">{label}</div>
          <div className="file-drop-hint">اضغط للاختيار — حد أقصى 5MB</div>
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/*,application/pdf,video/*,audio/*"
        style={{ display: 'none' }}
        onChange={(e) => handleFile(e.target.files[0])}
      />

      {file && !preview && (
        <button onClick={upload} disabled={uploading} type="button" className="new-service-submit" style={{ marginTop: 12 }}>
          {uploading ? '... جارٍ الرفع' : '📤 رفع الملف'}
        </button>
      )}

      {file && preview && !preview.startsWith('blob:') && (
        <button onClick={upload} disabled={uploading} type="button" className="new-service-submit" style={{ marginTop: 12 }}>
          {uploading ? '... جارٍ الرفع' : '📤 تحديث الرفع'}
        </button>
      )}
    </div>
  );
}
