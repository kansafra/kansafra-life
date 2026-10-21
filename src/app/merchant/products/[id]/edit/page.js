'use client';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { useCurrentUser } from '@/lib/useCurrentUser';
import { useToast } from '@/components/Toast';

export default function EditProductPage() {
  const { id } = useParams();
  const router = useRouter();
  const { success, error: toastError } = useToast();
  const { user, loading: userLoading, dataOwnerName } = useCurrentUser();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [product, setProduct] = useState(null);

  const [form, setForm] = useState({
    title: '',
    description: '',
    price: '',
    discount_percent: '0',
    stock: '10',
    image_url: '',
    is_active: true,
  });

  useEffect(() => {
    if (userLoading) return;
    if (!user) { router.replace('/login'); return; }
    loadProduct();
  }, [id, user, userLoading]);

  async function loadProduct() {
    if (!supabase || !id) return;
    try {
      const { data, error } = await supabase.from('products').select('*').eq('id', id).maybeSingle();
      if (error) throw error;
      if (!data) { toastError('المنتج غير موجود'); router.push('/merchant/products'); return; }

      // التحقق من الملكية (أمان)
      if (data.provider_name !== dataOwnerName) {
        toastError('ليس لديك صلاحية لتعديل هذا المنتج');
        router.push('/merchant/products');
        return;
      }

      setProduct(data);
      setForm({
        title: data.title || '',
        description: data.description || '',
        price: data.price || '',
        discount_percent: data.discount_percent || '0',
        stock: data.stock || '0',
        image_url: data.image_url || '',
        is_active: data.is_active !== false,
      });
    } catch (err) {
      console.error(err);
      toastError('حدث خطأ في التحميل');
    } finally {
      setLoading(false);
    }
  }

  async function handleImageUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { toastError('حجم الصورة يجب أن يكون أقل من 5MB'); return; }

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `products/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${fileExt}`;
      
      const { error: upErr } = await supabase.storage.from('sanad-files').upload(fileName, file);
      if (upErr) throw upErr;

      const { data: urlData } = supabase.storage.from('sanad-files').getPublicUrl(fileName);
      setForm({ ...form, image_url: urlData.publicUrl });
      success('✅ تم تحديث الصورة');
    } catch (err) {
      console.error(err);
      toastError('فشل رفع الصورة');
    } finally {
      setUploading(false);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.title.trim()) { toastError('اسم المنتج مطلوب'); return; }
    const priceNum = Number(form.price);
    if (!priceNum || priceNum <= 0) { toastError('السعر يجب أن يكون أكبر من صفر'); return; }

    setSaving(true);
    try {
      const payload = {
        title: form.title.trim(),
        description: form.description.trim(),
        price: priceNum,
        discount_percent: Number(form.discount_percent) || 0,
        stock: Number(form.stock) || 0,
        image_url: form.image_url || null,
        is_active: form.is_active,
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase.from('products').update(payload).eq('id', id);
      if (error) throw error;

      success('✅ تم حفظ التعديلات');
      router.push('/merchant/products');
    } catch (err) {
      console.error(err);
      toastError('فشل التعديل');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!confirm('هل أنت متأكد من حذف هذا المنتج نهائياً؟')) return;
    if (prompt('اكتب "حذف" للتأكيد:') !== 'حذف') { toastError('تم الإلغاء'); return; }

    setDeleting(true);
    try {
      const { error } = await supabase.from('products').delete().eq('id', id);
      if (error) throw error;
      success('🗑️ تم حذف المنتج');
      router.push('/merchant/products');
    } catch (err) {
      toastError('فشل الحذف');
    } finally {
      setDeleting(false);
    }
  }

  if (userLoading || loading) return <div style={{ padding: 80, textAlign: 'center' }}>⏳</div>;

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', paddingBottom: 100 }}>
      <div style={{ background: '#0f4d3a', padding: '16px 20px', position: 'sticky', top: 0, zIndex: 20, display: 'flex', alignItems: 'center', gap: 12 }}>
        <button onClick={() => router.back()} style={{ background: 'none', border: 'none', color: '#fff', fontSize: 20, cursor: 'pointer' }}>←</button>
        <h1 style={{ color: '#fff', fontSize: 18, fontWeight: 900, margin: 0, flex: 1 }}>✏️ تعديل المنتج</h1>
        <button onClick={handleDelete} disabled={deleting} style={{ background: 'rgba(239,68,68,0.2)', color: '#fff', border: '1px solid rgba(239,68,68,0.4)', padding: '6px 12px', borderRadius: 8, fontSize: 11, fontWeight: 900, cursor: deleting ? 'wait' : 'pointer', fontFamily: 'inherit' }}>
          {deleting ? '⏳' : '🗑️ حذف'}
        </button>
      </div>

      <form onSubmit={handleSubmit} style={{ padding: 16, maxWidth: 600, margin: '0 auto' }}>
        
        {/* الصورة */}
        <div style={{ background: '#fff', borderRadius: 16, padding: 16, marginBottom: 16, border: '1px solid #e2e8f0', textAlign: 'center' }}>
          <label style={{ cursor: uploading ? 'wait' : 'pointer', display: 'block' }}>
            <input type="file" accept="image/*" onChange={handleImageUpload} style={{ display: 'none' }} disabled={uploading} />
            {form.image_url ? (
              <div style={{ position: 'relative', width: '100%', height: 200, borderRadius: 12, overflow: 'hidden', border: '1px solid #e2e8f0' }}>
                <img src={form.image_url} alt="preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                <div style={{ position: 'absolute', bottom: 8, right: 8, background: 'rgba(0,0,0,0.6)', color: '#fff', padding: '4px 10px', borderRadius: 8, fontSize: 11, fontWeight: 900 }}>🔄 تغيير</div>
              </div>
            ) : (
              <div style={{ width: '100%', height: 200, background: '#f8fafc', borderRadius: 12, border: '2px dashed #cbd5e1', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                <div style={{ fontSize: 40 }}>{uploading ? '⏳' : '📸'}</div>
                <div style={{ fontSize: 13, fontWeight: 900, color: '#64748b' }}>{uploading ? 'جارٍ الرفع...' : 'تغيير الصورة'}</div>
              </div>
            )}
          </label>
        </div>

        {/* الحقول */}
        <div style={{ background: '#fff', borderRadius: 16, padding: 20, marginBottom: 16, border: '1px solid #e2e8f0' }}>
          <div style={{ marginBottom: 12 }}>
            <label style={labelStyle}>اسم المنتج *</label>
            <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required style={inputStyle} />
          </div>

          <div style={{ marginBottom: 12 }}>
            <label style={labelStyle}>الوصف</label>
            <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} style={{ ...inputStyle, height: 80, resize: 'none' }} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
            <div>
              <label style={labelStyle}>السعر (ل.س) *</label>
              <input type="number" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} required style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>الخصم %</label>
              <input type="number" value={form.discount_percent} onChange={e => setForm({ ...form, discount_percent: e.target.value })} min={0} max={99} style={inputStyle} />
            </div>
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={labelStyle}>المخزون</label>
            <input type="number" value={form.stock} onChange={e => setForm({ ...form, stock: e.target.value })} min={0} style={inputStyle} />
          </div>

          {/* حالة المنتج */}
          <label style={{ display: 'flex', alignItems: 'center', gap: 10, padding: 12, background: '#f8fafc', borderRadius: 10, border: '1px solid #e2e8f0', cursor: 'pointer' }}>
            <input type="checkbox" checked={form.is_active} onChange={e => setForm({ ...form, is_active: e.target.checked })} style={{ width: 18, height: 18 }} />
            <span style={{ fontSize: 13, fontWeight: 800 }}>المنتج ظاهر للزبائن (مفعل)</span>
          </label>
        </div>

        {/* حفظ */}
        <button type="submit" disabled={saving || uploading} style={{ width: '100%', padding: 16, background: (saving || uploading) ? '#94a3b8' : 'linear-gradient(135deg, #10b981, #059669)', color: '#fff', border: 'none', borderRadius: 14, fontWeight: 900, fontSize: 16, cursor: (saving || uploading) ? 'wait' : 'pointer', fontFamily: 'inherit', boxShadow: '0 6px 20px rgba(16,185,129,0.3)' }}>
          {saving ? '⏳ جارٍ الحفظ...' : '💾 حفظ التعديلات'}
        </button>
      </form>
    </div>
  );
}

const labelStyle = { display: 'block', fontSize: 12, fontWeight: 800, color: '#475569', marginBottom: 6 };
const inputStyle = { width: '100%', padding: '12px 14px', borderRadius: 10, border: '1px solid #cbd5e1', fontSize: 14, fontFamily: 'inherit', boxSizing: 'border-box', outline: 'none', background: '#f8fafc' };
