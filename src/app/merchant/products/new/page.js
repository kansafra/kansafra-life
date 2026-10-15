'use client';


import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

async function getModerationStatus(supabase, entity) {
  try {
    const { data: settings } = await supabase
      .from('app_settings')
      .select('key, value')
      .in('key', ['moderation_enabled', 'auto_publish_all', 'auto_publish_products']);
    const s = {};
    (settings || []).forEach((x) => { s[x.key] = x.value; });
    if (s.moderation_enabled === 'false' || s.moderation_enabled === undefined) {
      return { status: 'approved' };
    }
    if (s.auto_publish_all === 'true' || s.auto_publish_products === 'true') {
      return { status: 'approved' };
    }
    const { data: ent } = await supabase
      .from('entities')
      .select('is_trusted')
      .eq('id', entity.id)
      .maybeSingle();
    if (ent?.is_trusted) return { status: 'auto' };
    return { status: 'pending' };
  } catch (e) {
    return { status: 'approved' };
  }
}


export default function NewProduct() {
  const router = useRouter();
  const [entity, setEntity] = useState(null);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  const [f, setF] = useState({
    title: '',
    description: '',
    price: '',
    discount_percent: '0',
    currency: 'SYP',
    image_url: '',
    category: 'other',
    stock: '1',
    unit: 'قطعة',
  });

  useEffect(() => {
    let stored = null;
    try {
      const raw = localStorage.getItem('sanad_entity');
      if (raw) stored = JSON.parse(raw);
    } catch {}
    if (!stored) { router.replace('/login'); return; }
    setEntity(stored);
  }, [router]);

  const update = (k, v) => setF((old) => ({ ...old, [k]: v }));
  const finalPrice = Math.round(
    (Number(f.price) || 0) - ((Number(f.price) || 0) * (Number(f.discount_percent) || 0) / 100)
  );

  async function submit(e) {
    e.preventDefault();
    setError('');
    if (!f.title.trim()) { setError('اسم المنتج مطلوب'); return; }
    if (!f.price || Number(f.price) <= 0) { setError('السعر مطلوب'); return; }
    if (!supabase) { setError('قاعدة البيانات غير متصلة'); return; }

    setLoading(true);
    const payload = {
      provider_name: entity.display_name,
      title: f.title.trim(),
      description: f.description.trim() || null,
      price: Number(f.price),
      discount_percent: Number(f.discount_percent) || 0,
      currency: f.currency,
      image_url: f.image_url.trim() || null,
      category: f.category,
      stock: Number(f.stock) || 0,
      unit: f.unit,
    };
    const moderation = await getModerationStatus(supabase, entity);
    const payloadWithStatus = { ...payload, moderation_status: moderation.status };
    const { error: err } = await supabase.from('products').insert({ ...payloadWithStatus, moderation_status: moderation.status });
    setLoading(false);

    if (err) {
      console.error(err);
      setError('تعذّر الحفظ: ' + (err.message || 'خطأ'));
      return;
    }
    setDone(true);
  }

  if (!entity) {
    return (
      <div className="new-prod-page">
        <div className="ol-empty-state" style={{ padding: 60 }}>
          <span className="em">⏳</span>
          <p>جارٍ التحميل...</p>
        </div>
      </div>
    );
  }

  if (done) {
    return (
      <div className="new-prod-page">
        <div className="prod-header">
          <Link href="/merchant/products" className="prod-back">→</Link>
          <span className="prod-header-title">تمت الإضافة</span>
        </div>
        <div className="new-service-success">
          <div className="chk-circle">✓</div>
          <h2>تم إضافة المنتج</h2>
          <p>منتجك ظاهر الآن في قائمة منتجاتك</p>
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
        <span className="prod-header-title">منتج جديد</span>
      </div>

      <form className="new-prod-form" onSubmit={submit}>

        {f.image_url && (
          <div className="new-prod-preview">
            <div className="new-prod-preview-img">
              <img src={f.image_url} alt="preview" onError={(e) => { e.target.style.display = 'none'; }} />
            </div>
            <div className="new-prod-preview-info">
              <div className="new-prod-preview-name">{f.title || 'اسم المنتج'}</div>
              <div className="new-prod-preview-price">
                {finalPrice.toLocaleString()}
                {Number(f.discount_percent) > 0 && (
                  <span className="old">{Number(f.price).toLocaleString()}</span>
                )}
                <span className="prod-currency">{f.currency}</span>
              </div>
            </div>
          </div>
        )}

        <div className="new-service-field">
          <label className="new-service-label">اسم المنتج <span className="req">*</span></label>
          <input
            className="new-service-input"
            type="text"
            placeholder="مثال: ماء معدني 1.5L"
            value={f.title}
            onChange={(e) => update('title', e.target.value)}
          />
        </div>

        <div className="new-prod-row">
          <div className="new-service-field">
            <label className="new-service-label">السعر <span className="req">*</span></label>
            <input
              className="new-service-input"
              type="number"
              inputMode="decimal"
              placeholder="0"
              value={f.price}
              onChange={(e) => update('price', e.target.value)}
            />
          </div>
          <div className="new-service-field">
            <label className="new-service-label">الخصم %</label>
            <input
              className="new-service-input"
              type="number"
              inputMode="numeric"
              min="0" max="100"
              placeholder="0"
              value={f.discount_percent}
              onChange={(e) => update('discount_percent', e.target.value)}
            />
          </div>
        </div>

        {Number(f.discount_percent) > 0 && Number(f.price) > 0 && (
          <div className="new-prod-hint">
            💰 السعر بعد الخصم: <strong style={{ color: 'var(--f-700)' }}>{finalPrice.toLocaleString()} {f.currency}</strong>
          </div>
        )}

        <div className="new-prod-row">
          <div className="new-service-field">
            <label className="new-service-label">العملة</label>
            <select className="new-service-select" value={f.currency} onChange={(e) => update('currency', e.target.value)}>
              <option value="SYP">ليرة سورية (SYP)</option>
              <option value="USD">دولار (USD)</option>
              <option value="TRY">ليرة تركية (TRY)</option>
              <option value="EUR">يورو (EUR)</option>
              <option value="SAR">ريال سعودي (SAR)</option>
              <option value="AED">درهم إماراتي (AED)</option>
            </select>
          </div>
          <div className="new-service-field">
            <label className="new-service-label">الفئة</label>
            <select className="new-service-select" value={f.category} onChange={(e) => update('category', e.target.value)}>
              <option value="food">🍽️ طعام</option>
              <option value="drink">🥤 شراب</option>
              <option value="grocery">🛒 بقالة</option>
              <option value="medicine">💊 دواء</option>
              <option value="clothes">👕 ملابس</option>
              <option value="electronics">📱 إلكترونيات</option>
              <option value="home">🏠 منزل</option>
              <option value="beauty">💄 تجميل</option>
              <option value="stationery">📚 قرطاسية</option>
              <option value="other">📦 أخرى</option>
            </select>
          </div>
        </div>

        <div className="new-prod-row">
          <div className="new-service-field">
            <label className="new-service-label">الكمية</label>
            <input
              className="new-service-input"
              type="number"
              inputMode="numeric"
              placeholder="1"
              value={f.stock}
              onChange={(e) => update('stock', e.target.value)}
            />
          </div>
          <div className="new-service-field">
            <label className="new-service-label">الوحدة</label>
            <select className="new-service-select" value={f.unit} onChange={(e) => update('unit', e.target.value)}>
              <option value="قطعة">قطعة</option>
              <option value="كيلو">كيلو</option>
              <option value="علبة">علبة</option>
              <option value="حزمة">حزمة</option>
              <option value="لتر">لتر</option>
            </select>
          </div>
        </div>

        <div className="new-service-field">
          <label className="new-service-label">رابط الصورة</label>
          <input
            className="new-service-input"
            type="url"
            placeholder="https://..."
            value={f.image_url}
            onChange={(e) => update('image_url', e.target.value)}
          />
          <div className="new-prod-hint">
            الصق رابط صورة من الإنترنت (سيتم عرضها بحجم مربع)
          </div>
        </div>

        <div className="new-service-field">
          <label className="new-service-label">الوصف</label>
          <textarea
            className="new-service-textarea"
            placeholder="وصف مختصر..."
            value={f.description}
            onChange={(e) => update('description', e.target.value)}
          />
        </div>

        {error && (
          <div style={{ padding: '14px 16px', background: 'rgba(220,38,38,.14)', border: '1px solid rgba(220,38,38,.35)', borderRadius: 14, color: '#dc2626', fontSize: 13, fontWeight: 600 }}>
            {error}
          </div>
        )}

        <button className="new-service-submit" type="submit" disabled={loading}>
          {loading ? '... جارٍ الحفظ' : '+ إضافة المنتج'}
        </button>
      </form>
    </div>
  );
}
