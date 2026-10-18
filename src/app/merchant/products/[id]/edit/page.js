'use client';
import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { useCurrentUser } from '@/lib/useCurrentUser';
import { useToast } from '@/components/Toast';
import ImageUploader from '@/components/ImageUploader';
import FileUploader from '@/components/FileUploader';

export default function EditProductPage() {
  const router = useRouter();
  const params = useParams();
  const { user, loading: userLoading, isOwner, isSectionAdmin, hasPermission, dataOwnerName } = useCurrentUser();
  const { success, error: toastError } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const [form, setForm] = useState({
    title: '', description: '', price: '', discount_percent: 0,
    currency: 'SYP', category: 'other', stock: 1, unit: 'قطعة',
    image_url: '', file_url: '',
  });

  useEffect(() => {
    if (userLoading) return;
    if (!user) { router.replace('/login'); return; }
    if (params?.id) load(params.id);
  }, [user, userLoading, params?.id]);

  async function load(id) {
    if (!supabase) { setLoading(false); return; }
    try {
      const { data, error } = await supabase.from('products').select('*').eq('id', id).maybeSingle();
      if (error || !data) { setNotFound(true); setLoading(false); return; }
      
      // تحقق الملكية
      if (!isSectionAdmin && data.provider_name !== dataOwnerName) {
        setNotFound(true); setLoading(false); return;
      }
      
      setForm({
        title: data.title || '',
        description: data.description || '',
        price: data.price || '',
        discount_percent: data.discount_percent || 0,
        currency: data.currency || 'SYP',
        category: data.category || 'other',
        stock: data.stock || 1,
        unit: data.unit || 'قطعة',
        image_url: data.image_url || '',
        file_url: data.file_url || '',
      });
    } catch (e) { toastError('تعذّر التحميل'); }
    setLoading(false);
  }

  function update(k, v) { setForm(f => ({ ...f, [k]: v })); }

  async function save() {
    if (!form.title?.trim() || form.title.trim().length < 3) { toastError('الاسم مطلوب (3 أحرف+)'); return; }
    if (!form.price || Number(form.price) <= 0) { toastError('السعر مطلوب'); return; }
    
    setSaving(true);
    try {
      const { error } = await supabase.from('products').update({
        title: form.title.trim(),
        description: form.description?.trim() || null,
        price: Number(form.price),
        discount_percent: Number(form.discount_percent) || 0,
        currency: form.currency,
        category: form.category,
        stock: Number(form.stock) || 0,
        unit: form.unit,
        image_url: form.image_url || null,
        file_url: form.file_url || null,
        updated_at: new Date().toISOString(),
      }).eq('id', params.id);
      
      if (error) throw error;
      success('✅ تم حفظ التعديلات');
      setTimeout(() => router.push('/merchant/products'), 800);
    } catch (e) { toastError('تعذّر: ' + e.message); }
    setSaving(false);
  }

  async function handleDelete() {
    if (!confirm('حذف هذا المنتج نهائياً؟')) return;
    try {
      await supabase.from('products').delete().eq('id', params.id);
      success('تم الحذف');
      router.push('/merchant/products');
    } catch (e) { toastError('تعذّر: ' + e.message); }
  }

  if (!userLoading && user && !isOwner && !isSectionAdmin && !hasPermission('products')) {
    return <div style={{ padding: 60, textAlign: 'center' }}>🔒 ليس لديك صلاحية</div>;
  }
  if (userLoading || loading) {
    return <div style={{ padding: 60, textAlign: 'center' }}>⏳</div>;
  }
  if (notFound) {
    return (
      <div style={{ minHeight: '100vh', background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
        <div style={{ background: '#fff', borderRadius: 16, padding: 40, textAlign: 'center', maxWidth: 400 }}>
          <div style={{ fontSize: 56, marginBottom: 16 }}>🔍</div>
          <div style={{ fontSize: 18, fontWeight: 900, marginBottom: 8 }}>المنتج غير موجود</div>
          <Link href="/merchant/products" style={{ display: 'inline-block', background: '#0f4d3a', color: '#fff', padding: '10px 20px', borderRadius: 10, textDecoration: 'none', fontWeight: 800, marginTop: 16 }}>← المنتجات</Link>
        </div>
      </div>
    );
  }

  const finalPrice = Number(form.price || 0) - (Number(form.price || 0) * Number(form.discount_percent || 0) / 100);

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', paddingBottom: 100 }}>
      <div style={{ position: 'sticky', top: 0, zIndex: 10, background: '#0f4d3a', padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <Link href="/merchant/products" style={{ color: '#fff', textDecoration: 'none', fontSize: 20, width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,.1)', borderRadius: '50%' }}>→</Link>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 16, fontWeight: 900, color: '#fff' }}>✏️ تعديل المنتج</div>
        </div>
        <button onClick={handleDelete} style={{ background: 'rgba(220,38,38,.2)', color: '#fff', border: '1px solid rgba(220,38,38,.4)', padding: '8px 14px', borderRadius: 10, fontSize: 12, fontWeight: 900, cursor: 'pointer', fontFamily: 'inherit' }}>🗑️</button>
      </div>

      <div style={{ padding: 16 }}>
        <div style={{ background: '#fff', borderRadius: 16, padding: 16, marginBottom: 12, border: '1px solid #e5e7eb' }}>
          <div style={{ fontSize: 14, fontWeight: 900, marginBottom: 12 }}>📝 معلومات أساسية</div>
          
          <div style={{ marginBottom: 12 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 800, color: '#334155', marginBottom: 6 }}>اسم المنتج *</label>
            <input type="text" value={form.title} onChange={(e) => update('title', e.target.value)}
              style={{ width: '100%', padding: 12, border: '1px solid #e5e7eb', borderRadius: 10, fontSize: 14, fontFamily: 'inherit', boxSizing: 'border-box', outline: 'none' }} />
          </div>

          <div style={{ marginBottom: 12 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 800, color: '#334155', marginBottom: 6 }}>الوصف</label>
            <textarea value={form.description} onChange={(e) => update('description', e.target.value)} rows={3}
              style={{ width: '100%', padding: 12, border: '1px solid #e5e7eb', borderRadius: 10, fontSize: 13, fontFamily: 'inherit', boxSizing: 'border-box', outline: 'none', resize: 'vertical' }} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 800, color: '#334155', marginBottom: 6 }}>السعر *</label>
              <input type="number" value={form.price} onChange={(e) => update('price', e.target.value)}
                style={{ width: '100%', padding: 12, border: '1px solid #e5e7eb', borderRadius: 10, fontSize: 14, fontFamily: 'inherit', boxSizing: 'border-box', outline: 'none' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 800, color: '#334155', marginBottom: 6 }}>العملة</label>
              <select value={form.currency} onChange={(e) => update('currency', e.target.value)}
                style={{ width: '100%', padding: 12, border: '1px solid #e5e7eb', borderRadius: 10, fontSize: 13, fontFamily: 'inherit', boxSizing: 'border-box', outline: 'none' }}>
                <option value="SYP">SYP</option>
                <option value="USD">USD</option>
                <option value="TRY">TRY</option>
              </select>
            </div>
          </div>
        </div>

        <div style={{ background: '#fff', borderRadius: 16, padding: 16, marginBottom: 12, border: '1px solid #e5e7eb' }}>
          <div style={{ fontSize: 14, fontWeight: 900, marginBottom: 12 }}>💰 الخصم والمخزون</div>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 800, color: '#334155', marginBottom: 6 }}>خصم %</label>
              <input type="number" min="0" max="100" value={form.discount_percent} onChange={(e) => update('discount_percent', e.target.value)}
                style={{ width: '100%', padding: 12, border: '1px solid #e5e7eb', borderRadius: 10, fontSize: 14, fontFamily: 'inherit', boxSizing: 'border-box', outline: 'none' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 800, color: '#334155', marginBottom: 6 }}>المخزون</label>
              <input type="number" min="0" value={form.stock} onChange={(e) => update('stock', e.target.value)}
                style={{ width: '100%', padding: 12, border: '1px solid #e5e7eb', borderRadius: 10, fontSize: 14, fontFamily: 'inherit', boxSizing: 'border-box', outline: 'none' }} />
            </div>
          </div>

          {Number(form.discount_percent) > 0 && (
            <div style={{ background: 'rgba(16,185,129,.1)', padding: 10, borderRadius: 8, fontSize: 12, color: '#065f46', fontWeight: 700 }}>
              💰 السعر النهائي: <span style={{ fontSize: 15, fontWeight: 900 }}>{Math.round(finalPrice).toLocaleString()}</span> {form.currency}
            </div>
          )}
        </div>

        <div style={{ background: '#fff', borderRadius: 16, padding: 16, marginBottom: 12, border: '1px solid #e5e7eb' }}>
          <div style={{ fontSize: 14, fontWeight: 900, marginBottom: 12 }}>📸 الوسائط</div>
          <div style={{ marginBottom: 12 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 800, color: '#334155', marginBottom: 6 }}>صورة المنتج</label>
            <ImageUploader label="ارفع صورة" folder="products" value={form.image_url} onUpload={(url) => update('image_url', url)} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 800, color: '#334155', marginBottom: 6 }}>ملف PDF</label>
            <FileUploader label="ارفع ملف" folder="products-files" value={form.file_url} onUpload={(url) => update('file_url', url)} maxSize={20} />
          </div>
        </div>
      </div>

      <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, padding: 16, background: '#fff', borderTop: '1px solid #e5e7eb' }}>
        <button onClick={save} disabled={saving} style={{
          width: '100%', padding: 16, background: saving ? '#94a3b8' : 'linear-gradient(135deg,#10b981,#059669)',
          color: '#fff', border: 'none', borderRadius: 12, fontSize: 15, fontWeight: 900,
          cursor: saving ? 'not-allowed' : 'pointer', fontFamily: 'inherit',
        }}>
          {saving ? '... جارٍ الحفظ' : '✓ حفظ التعديلات'}
        </button>
      </div>
    </div>
  );
}
