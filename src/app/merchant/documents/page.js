'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { useCurrentUser } from '@/lib/useCurrentUser';
import { useToast } from '@/components/Toast';
import { SkeletonList } from '@/components/Skeleton';
import EmptyState from '@/components/EmptyState';
import FileUploader from '@/components/FileUploader';

export default function DocsPage() {
  const router = useRouter();
  const { user, loading: uL, dataOwnerName } = useCurrentUser();
  const { success, error: tE } = useToast();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ title: '', file_url: '', category: 'general' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (uL) return;
    if (!user) { router.replace('/login'); return; }
    load();
  }, [user, uL]);

  async function load() {
    if (!supabase || !dataOwnerName) { setLoading(false); return; }
    const { data } = await supabase.from('documents').select('*').eq('entity_name', dataOwnerName).order('created_at', { ascending: false });
    setItems(data || []);
    setLoading(false);
  }

  async function save() {
    if (!form.title?.trim()) { tE('العنوان مطلوب'); return; }
    if (!form.file_url) { tE('الملف مطلوب'); return; }
    setSaving(true);
    try {
      const { error } = await supabase.from('documents').insert({
        entity_name: dataOwnerName, title: form.title.trim(), file_url: form.file_url, category: form.category || 'general',
      });
      if (error) throw error;
      success('✅ تم'); setModal(false); setForm({ title: '', file_url: '', category: 'general' }); load();
    } catch (e) { tE('تعذّر: ' + e.message); }
    setSaving(false);
  }

  async function del(c) {
    if (!confirm('حذف؟')) return;
    await supabase.from('documents').delete().eq('id', c.id);
    success('تم'); load();
  }

  if (uL || loading) return <div style={{ padding: 16, background: '#f8fafc', minHeight: '100vh' }}><SkeletonList count={3} /></div>;

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', paddingBottom: 80 }}>
      <div style={{ position: 'sticky', top: 0, zIndex: 10, background: '#0f4d3a', padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <Link href="/merchant" style={{ color: '#fff', textDecoration: 'none', fontSize: 20, width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,.1)', borderRadius: '50%' }}>→</Link>
        <div style={{ flex: 1, color: '#fff', fontSize: 16, fontWeight: 900 }}>📄 المستندات ({items.length})</div>
        <button onClick={() => setModal(true)} style={{ background: '#fbbf24', color: '#0f4d3a', border: 'none', padding: '8px 14px', borderRadius: 10, fontSize: 12, fontWeight: 900, cursor: 'pointer', fontFamily: 'inherit' }}>+ ملف</button>
      </div>
      <div style={{ padding: 16 }}>
        {items.length === 0 ? <EmptyState icon="📄" title="لا توجد مستندات" actionLabel="+ رفع ملف" onAction={() => setModal(true)} /> : items.map(it => (
          <div key={it.id} style={{ background: '#fff', borderRadius: 14, padding: 14, marginBottom: 10, border: '1px solid #e5e7eb', display: 'flex', gap: 12 }}>
            <div style={{ width: 48, height: 48, borderRadius: 10, background: 'linear-gradient(135deg,#0f4d3a,#075640)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0 }}>📄</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 900, marginBottom: 4 }}>{it.title}</div>
              <div style={{ fontSize: 11, color: '#64748b' }}>{it.category}</div>
              <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 4 }}>{new Date(it.created_at).toLocaleDateString('ar-EG')}</div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <a href={it.file_url} target="_blank" rel="noopener" style={{ padding: 6, background: '#f1f5f9', borderRadius: 6, fontSize: 12, textDecoration: 'none' }}>👁️</a>
              <button onClick={() => del(it)} style={{ padding: 6, background: 'rgba(220,38,38,.1)', color: '#dc2626', border: 'none', borderRadius: 6, fontSize: 12, cursor: 'pointer' }}>🗑️</button>
            </div>
          </div>
        ))}
      </div>
      {modal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.6)', zIndex: 100, display: 'flex', alignItems: 'flex-end' }} onClick={() => setModal(false)}>
          <div style={{ background: '#fff', borderRadius: '24px 24px 0 0', width: '100%', maxWidth: 500, margin: '0 auto', padding: '24px 20px 30px' }} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ fontSize: 18, fontWeight: 900, marginBottom: 16 }}>رفع مستند</h3>
            <input type="text" placeholder="العنوان *" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} style={{ width: '100%', padding: 12, border: '1px solid #e5e7eb', borderRadius: 10, fontSize: 13, marginBottom: 10, boxSizing: 'border-box', fontFamily: 'inherit' }} />
            <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} style={{ width: '100%', padding: 12, border: '1px solid #e5e7eb', borderRadius: 10, fontSize: 13, marginBottom: 10, boxSizing: 'border-box', fontFamily: 'inherit' }}>
              <option value="general">عام</option>
              <option value="license">رخصة</option>
              <option value="contract">عقد</option>
              <option value="invoice">فاتورة</option>
            </select>
            <div style={{ marginBottom: 16 }}>
              <FileUploader label="ارفع الملف" folder="documents" value={form.file_url} onUpload={(url) => setForm({ ...form, file_url: url })} maxSize={20} />
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setModal(false)} style={{ flex: 1, padding: 12, background: '#f1f5f9', border: 'none', borderRadius: 10, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit' }}>إلغاء</button>
              <button onClick={save} disabled={saving} style={{ flex: 1, padding: 12, background: 'linear-gradient(135deg,#10b981,#059669)', color: '#fff', border: 'none', borderRadius: 10, fontWeight: 900, cursor: saving ? 'not-allowed' : 'pointer', fontFamily: 'inherit' }}>{saving ? '...' : '✓ رفع'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
