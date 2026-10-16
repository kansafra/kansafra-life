'use client';


import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { getSession } from '@/lib/auth';

export default function EditProduct() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id;

  const [entity, setEntity] = useState(null);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  const [f, setF] = useState({
    title: '', description: '', price: '', discount_percent: '0',
    currency: 'SYP', image_url: '', category: 'other', stock: '1', unit: 'قطعة',
  });

  useEffect(() => {
    let stored = null;
    try {
      const raw = localStorage.getItem('sanad_entity');
      if (raw) stored = JSON.parse(raw);
    } catch {}
    if (!stored) { router.replace('/login'); return; }
    setEntity(stored);

    async function load() {
      if (!supabase || !id) { setFetching(false); return; }
      const { data } = await supabase.from('products').select('*').eq('id', id).single();
      if (data) {
        setF({
          title: data.title || '',
          description: data.description || '',
          price: String(data.price || ''),
          discount_percent: String(data.discount_percent || 0),
          currency: data.currency || 'SYP',
          image_url: data.image_url || '',
          category: data.category || 'other',
          stock: String(data.stock || 0),
          unit: data.unit || 'قطعة',
        });
      }
      setFetching(false);
    }
    load();
  }, [router, id]);

  const update = (k, v) => setF((old) => ({ ...old, [k]: v }));
  const finalPrice = Math.round(
    (Number(f.price) || 0) - ((Number(f.price) || 0) * (Number(f.discount_percent) || 0) / 100)
  );

  async function submit(e) {
    e.preventDefault();
    setError('');
    if (!f.title.trim()) { setError('اسم المنتج مطلوب'); return; }
    if (!f.price || Number(f.price) <= 0) { setError('السعر مطلوب'); return; }

    setLoading(true);
    const { error: err } = await supabase.from('products').update({
      title: f.title.trim(),
      description: f.description.trim() || null,
      price: Number(f.price),
      discount_percent: Number(f.discount_percent) || 0,
      currency: f.currency,
      image_url: f.image_url.trim() || null,
      category: f.category,
      stock: Number(f.stock) || 0,
      unit: f.unit,
    }).eq('id', id);
    setLoading(false);

    if (err) { setError('تعذّر الحفظ'); return; }
    setDone(true);
  }

  async function handleDelete() {
    if (!confirm('هل تريد حذف هذا المنتج نهائياً؟')) return;
    setLoading(true);
    const { error: err } = await supabase.from('products').delete().eq('id', id);
    setLoading(false);
    if (err) { setError('تعذّر الحذف'); return; }
    router.push('/merchant/products');
  }

  if (fetching) {
    return <div className="ol-empty-state" style={{ padding: 80 }}><span className="em">⏳</span><p>جارٍ التحميل...</p></div>;
  }
  if (done) {
    return (
      <div className="new-prod-page">
        <div className="prod-header">
          <Link href="/merchant/products" className="prod-back">→</Link>
          <span className="prod-header-title">تم الحفظ</span>
        </div>
        <div className="new-service-success">
          <div className="chk-circle">✓</div>
          <h2>تم تحديث المنتج</h2>
          <Link href="/merchant/products" className="new-service-submit" style={{ display: 'block', textAlign: 'center', textDecoration: 'none' }}>
            عرض المنتجات
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="new-prod-page">
      <div className="prod-header">
        <Link href="/merchant/products" className="prod-back">→</Link>
        <span className="prod-header-title">تعديل المنتج</span>
      </div>
      <form className="new-prod-form" onSubmit={submit}>
        <div className="new-service-field">
          <label className="new-service-label">اسم المنتج <span className="req">*</span></label>
          <input className="new-service-input" value={f.title} onChange={(e) => update('title', e.target.value)} />
        </div>

        <div className="new-prod-row">
          <div className="new-service-field">
            <label className="new-service-label">السعر <span className="req">*</span></label>
            <input className="new-service-input" type="number" value={f.price} onChange={(e) => update('price', e.target.value)} />
          </div>
          <div className="new-service-field">
            <label className="new-service-label">الخصم %</label>
            <input className="new-service-input" type="number" min="0" max="100" value={f.discount_percent} onChange={(e) => update('discount_percent', e.target.value)} />
          </div>
        </div>

        {Number(f.discount_percent) > 0 && Number(f.price) > 0 && (
          <div className="new-prod-hint">💰 السعر النهائي: <strong>{finalPrice.toLocaleString()} {f.currency}</strong></div>
        )}

        <div className="new-prod-row">
          <div className="new-service-field">
            <label className="new-service-label">العملة</label>
            <select className="new-service-select" value={f.currency} onChange={(e) => update('currency', e.target.value)}>
              <option value="SYP">ليرة سورية</option>
              <option value="USD">دولار</option>
              <option value="TRY">ليرة تركية</option>
              <option value="EUR">يورو</option>
            </select>
          </div>
          <div className="new-service-field">
            <label className="new-service-label">الفئة</label>
            <select className="new-service-select" value={f.category} onChange={(e) => update('category', e.target.value)}>
              <option value="food">طعام</option>
              <option value="drink">شراب</option>
              <option value="grocery">بقالة</option>
              <option value="medicine">دواء</option>
              <option value="clothes">ملابس</option>
              <option value="electronics">إلكترونيات</option>
              <option value="home">منزل</option>
              <option value="other">أخرى</option>
            </select>
          </div>
        </div>

        <div className="new-prod-row">
          <div className="new-service-field">
            <label className="new-service-label">الكمية</label>
            <input className="new-service-input" type="number" value={f.stock} onChange={(e) => update('stock', e.target.value)} />
          </div>
          <div className="new-service-field">
            <label className="new-service-label">الوحدة</label>
            <select className="new-service-select" value={f.unit} onChange={(e) => update('unit', e.target.value)}>
              <option value="قطعة">قطعة</option>
              <option value="كيلو">كيلو</option>
              <option value="علبة">علبة</option>
              <option value="لتر">لتر</option>
            </select>
          </div>
        </div>

        <div className="new-service-field">
          <label className="new-service-label">رابط الصورة</label>
          <input className="new-service-input" type="url" value={f.image_url} onChange={(e) => update('image_url', e.target.value)} />
        </div>

        <div className="new-service-field">
          <label className="new-service-label">الوصف</label>
          <textarea className="new-service-textarea" value={f.description} onChange={(e) => update('description', e.target.value)} />
        </div>

        {error && <div style={{ padding: 14, background: 'rgba(220,38,38,.14)', border: '1px solid rgba(220,38,38,.35)', borderRadius: 14, color: '#dc2626', fontSize: 13, fontWeight: 600 }}>{error}</div>}

        <button className="new-service-submit" type="submit" disabled={loading}>
          {loading ? '... جارٍ الحفظ' : '✓ حفظ التعديلات'}
        </button>

        <button type="button" onClick={handleDelete} disabled={loading}
          style={{ padding: 16, borderRadius: 14, background: 'rgba(220,38,38,.1)', color: '#dc2626', border: '1px solid rgba(220,38,38,.3)', fontWeight: 800, fontSize: 14, marginTop: 8 }}>
          🗑️ حذف المنتج
        </button>
      </form>
    </div>
  );
}
