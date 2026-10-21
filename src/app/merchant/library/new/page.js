'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useCurrentUser } from '@/lib/useCurrentUser';
import { useToast } from '@/components/Toast';

const CATEGORIES = [
  { key: 'general', label: 'عام' }, { key: 'religion', label: 'ديني' },
  { key: 'science', label: 'علمي' }, { key: 'literature', label: 'أدبي' },
  { key: 'history', label: 'تاريخي' }, { key: 'children', label: 'أطفال' },
  { key: 'education', label: 'تعليمي' }, { key: 'other', label: 'أخرى' },
];

export default function MerchantNewBookPage() {
  const router = useRouter();
  const { success, error: toastError } = useToast();
  const { user, loading: userLoading, dataOwnerName } = useCurrentUser();
  const [entityId, setEntityId] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ title: '', author: '', description: '', category: 'general', image_url: '', file_url: '', pages: '', is_free: true });

  useEffect(() => {
    if (userLoading) return;
    if (!user) { router.replace('/login'); return; }
    const stored = JSON.parse(localStorage.getItem('sanad_entity') || 'null');
    if (stored?.parent_entity_id) setEntityId(stored.parent_entity_id);
    else if (dataOwnerName) {
      supabase.from('entities').select('id').eq('display_name', dataOwnerName).maybeSingle().then(({ data }) => { if (data) setEntityId(data.id); });
    }
  }, [user, userLoading, dataOwnerName, router]);

  async function uploadImage(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { toastError('حجم الصورة أقل من 5MB'); return; }
    setUploading(true);
    try {
      const ext = file.name.split('.').pop();
      const name = `library/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
      const { error } = await supabase.storage.from('sanad-files').upload(name, file);
      if (error) throw error;
      const { data: url } = supabase.storage.from('sanad-files').getPublicUrl(name);
      setForm({ ...form, image_url: url.publicUrl });
      success('✅ تم رفع الغلاف');
    } catch (err) { toastError('فشل الرفع'); }
    finally { setUploading(false); }
  }

  async function uploadPdf(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 50 * 1024 * 1024) { toastError('حجم الملف أقل من 50MB'); return; }
    setUploadingFile(true);
    try {
      const ext = file.name.split('.').pop();
      const name = `library/books/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
      const { error } = await supabase.storage.from('sanad-files').upload(name, file);
      if (error) throw error;
      const { data: url } = supabase.storage.from('sanad-files').getPublicUrl(name);
      setForm({ ...form, file_url: url.publicUrl });
      success('✅ تم رفع الكتاب');
    } catch (err) { toastError('فشل رفع الكتاب'); }
    finally { setUploadingFile(false); }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.title.trim()) { toastError('العنوان مطلوب'); return; }
    setSaving(true);
    try {
      const { error } = await supabase.from('library_books').insert({
        entity_id: entityId, provider_name: dataOwnerName,
        title: form.title.trim(), author: form.author.trim() || null,
        description: form.description.trim() || null, category: form.category,
        image_url: form.image_url || null, file_url: form.file_url || null,
        pages: form.pages ? Number(form.pages) : null, is_free: form.is_free, is_active: true,
      });
      if (error) throw error;
      success('🎉 تم نشر الكتاب');
      router.push('/merchant/library');
    } catch (err) { console.error(err); toastError('فشل النشر'); }
    finally { setSaving(false); }
  }

  if (userLoading) return <div style={{ padding: 80, textAlign: 'center' }}>⏳</div>;

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', paddingBottom: 100 }}>
      <div style={{ background: '#0f4d3a', padding: '16px 20px', position: 'sticky', top: 0, zIndex: 20, display: 'flex', alignItems: 'center', gap: 12 }}>
        <button onClick={() => router.back()} style={{ background: 'none', border: 'none', color: '#fff', fontSize: 20, cursor: 'pointer' }}>←</button>
        <h1 style={{ color: '#fff', fontSize: 18, fontWeight: 900, margin: 0 }}>📚 كتاب جديد</h1>
      </div>

      <form onSubmit={handleSubmit} style={{ padding: 16, maxWidth: 600, margin: '0 auto' }}>
        <div style={{ background: '#fff', borderRadius: 16, padding: 16, marginBottom: 16, border: '1px solid #e2e8f0', textAlign: 'center' }}>
          <label style={{ cursor: uploading ? 'wait' : 'pointer', display: 'block' }}>
            <input type="file" accept="image/*" onChange={uploadImage} style={{ display: 'none' }} disabled={uploading} />
            {form.image_url ? (
              <div style={{ position: 'relative', width: 140, height: 180, margin: '0 auto', borderRadius: 10, overflow: 'hidden', border: '1px solid #e2e8f0' }}>
                <img src={form.image_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
            ) : (
              <div style={{ width: 140, height: 180, margin: '0 auto', background: '#f8fafc', borderRadius: 10, border: '2px dashed #cbd5e1', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                <div style={{ fontSize: 32 }}>{uploading ? '⏳' : '📕'}</div>
                <div style={{ fontSize: 11, fontWeight: 900, color: '#64748b' }}>غلاف الكتاب</div>
              </div>
            )}
          </label>
        </div>

        <div style={{ background: '#fff', borderRadius: 16, padding: 20, marginBottom: 16, border: '1px solid #e2e8f0' }}>
          <div style={{ marginBottom: 12 }}>
            <label style={labelStyle}>عنوان الكتاب *</label>
            <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required style={inputStyle} />
          </div>
          <div style={{ marginBottom: 12 }}>
            <label style={labelStyle}>المؤلف</label>
            <input value={form.author} onChange={e => setForm({ ...form, author: e.target.value })} style={inputStyle} />
          </div>
          <div style={{ marginBottom: 12 }}>
            <label style={labelStyle}>الوصف</label>
            <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} style={{ ...inputStyle, height: 80, resize: 'none' }} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={labelStyle}>التصنيف</label>
              <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} style={inputStyle}>
                {CATEGORIES.map(c => <option key={c.key} value={c.key}>{c.label}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>الصفحات</label>
              <input type="number" value={form.pages} onChange={e => setForm({ ...form, pages: e.target.value })} style={inputStyle} />
            </div>
          </div>
        </div>

        <div style={{ background: '#fff', borderRadius: 16, padding: 20, marginBottom: 16, border: '1px solid #e2e8f0' }}>
          <h2 style={{ fontSize: 14, fontWeight: 900, marginTop: 0, marginBottom: 12 }}>📄 ملف الكتاب (PDF)</h2>
          <label style={{ cursor: uploadingFile ? 'wait' : 'pointer', display: 'block' }}>
            <input type="file" accept=".pdf,application/pdf" onChange={uploadPdf} style={{ display: 'none' }} disabled={uploadingFile} />
            <div style={{ padding: 16, background: '#f8fafc', borderRadius: 10, border: '2px dashed #cbd5e1', textAlign: 'center' }}>
              <div style={{ fontSize: 24, marginBottom: 4 }}>{uploadingFile ? '⏳' : (form.file_url ? '✅' : '📄')}</div>
              <div style={{ fontSize: 12, fontWeight: 900, color: form.file_url ? '#10b981' : '#64748b' }}>
                {uploadingFile ? 'جارٍ الرفع...' : (form.file_url ? 'تم الرفع — اضغط للتغيير' : 'اضغط لاختيار PDF')}
              </div>
              <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 4 }}>الحد الأقصى 50MB</div>
            </div>
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: 10, padding: 12, background: '#f8fafc', borderRadius: 10, border: '1px solid #e2e8f0', cursor: 'pointer', marginTop: 12 }}>
            <input type="checkbox" checked={form.is_free} onChange={e => setForm({ ...form, is_free: e.target.checked })} style={{ width: 18, height: 18 }} />
            <span style={{ fontSize: 13, fontWeight: 800 }}>🆓 مجاني للجميع</span>
          </label>
        </div>

        <button type="submit" disabled={saving || uploading || uploadingFile} style={{ width: '100%', padding: 16, background: (saving || uploading || uploadingFile) ? '#94a3b8' : 'linear-gradient(135deg, #10b981, #059669)', color: '#fff', border: 'none', borderRadius: 14, fontWeight: 900, fontSize: 16, cursor: 'pointer', fontFamily: 'inherit', boxShadow: '0 6px 20px rgba(16,185,129,0.3)' }}>
          {saving ? '⏳ جارٍ النشر...' : '📚 نشر الكتاب'}
        </button>
      </form>
    </div>
  );
}

const labelStyle = { display: 'block', fontSize: 12, fontWeight: 800, color: '#475569', marginBottom: 6 };
const inputStyle = { width: '100%', padding: '12px 14px', borderRadius: 10, border: '1px solid #cbd5e1', fontSize: 14, fontFamily: 'inherit', boxSizing: 'border-box', outline: 'none', background: '#f8fafc' };
