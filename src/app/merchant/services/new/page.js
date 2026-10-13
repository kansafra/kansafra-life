'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';


const catIcon = (icon, name) => {
  const k = String(icon || '').toLowerCase().trim();
  const m = {
    'shopping-bag':'🛍️','heart-pulse':'❤️','graduation-cap':'🎓',
    'landmark':'🕌','building-2':'🏢','hand-heart':'🎁',
    'newspaper':'📰','shield-alert':'🚨','store':'🏪',
    'utensils':'🍽️','car':'🚚','home':'🏠','wrench':'🛠️'
  };
  if (m[k]) return m[k];
  if (icon && icon.length <= 4) return icon;
  return '📦';
};

export default function NewServicePage() {
  const router = useRouter();
  const [entity, setEntity] = useState(null);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    title: '',
    description: '',
    category_id: '',
    phone: '',
    address: '',
    image_url: '',
    is_featured: false,
  });

  useEffect(() => {
    let stored = null;
    try {
      const raw = localStorage.getItem('sanad_entity');
      if (raw) stored = JSON.parse(raw);
    } catch {}
    if (!stored) { router.replace('/login'); return; }
    setEntity(stored);

    async function loadCats() {
      if (!supabase) return;
      const { data } = await supabase
        .from('service_categories')
        .select('id,name,icon,slug')
        .eq('is_active', true)
        .order('sort_order', { ascending: true });
      if (Array.isArray(data)) setCategories(data);
    }
    loadCats();
  }, [router]);

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    if (!form.title.trim() || form.title.trim().length < 3) {
      setError('اسم الخدمة مطلوب (3 أحرف على الأقل)');
      return;
    }
    if (!form.category_id) {
      setError('يرجى اختيار القسم');
      return;
    }
    if (!form.phone.trim()) {
      setError('رقم الهاتف مطلوب');
      return;
    }
    if (!supabase) {
      setError('قاعدة البيانات غير متصلة');
      return;
    }

    setLoading(true);
    const payload = {
      title: form.title.trim(),
      description: form.description.trim() || null,
      category_id: form.category_id,
      phone: form.phone.trim(),
      address: form.address.trim() || null,
      image_url: form.image_url.trim() || null,
      provider_name: entity.display_name,
      is_featured: form.is_featured,
    };

    const { error: insErr } = await supabase.from('services').insert(payload);
    setLoading(false);

    if (insErr) {
      console.error('Insert error:', insErr);
      setError('تعذّر حفظ الخدمة: ' + (insErr.message || 'خطأ غير معروف'));
      return;
    }
    setDone(true);
  }

  if (!entity) {
    return (
      <div className="new-service-page">
        <div style={{ padding: 60, textAlign: 'center' }}>جارٍ التحميل...</div>
      </div>
    );
  }

  if (done) {
    return (
      <div className="new-service-page">
        <div className="new-service-header">
          <Link href="/merchant" className="new-service-back">→</Link>
          <span className="new-service-title">تم بنجاح</span>
        </div>
        <div className="new-service-success">
          <div className="chk-circle">✓</div>
          <h2>تمت إضافة الخدمة</h2>
          <p>خدمتك ظاهرة الآن للزوار في الصفحة الرئيسية</p>
          <Link href="/merchant" className="new-service-submit" style={{ display: 'block', textAlign: 'center', textDecoration: 'none' }}>
            العودة للوحة التحكم
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="new-service-page">
      <div className="new-service-header">
        <Link href="/merchant" className="new-service-back">→</Link>
        <span className="new-service-title">إضافة خدمة جديدة</span>
      </div>

      <form className="new-service-form" onSubmit={handleSubmit}>

        <div className="new-service-field">
          <label className="new-service-label">
            اسم الخدمة <span className="req">*</span>
          </label>
          <input
            className="new-service-input"
            type="text"
            placeholder="مثال: متجر أبو أحمد"
            value={form.title}
            onChange={(e) => update('title', e.target.value)}
          />
        </div>

        <div className="new-service-field">
          <label className="new-service-label">
            القسم <span className="req">*</span>
          </label>
          <select
            className="new-service-select"
            value={form.category_id}
            onChange={(e) => update('category_id', e.target.value)}
          >
            <option value="">— اختر القسم —</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {catIcon(c.icon, c.name)} {c.name}
              </option>
            ))}
          </select>
        </div>

        <div className="new-service-field">
          <label className="new-service-label">
            رقم الهاتف <span className="req">*</span>
          </label>
          <input
            className="new-service-input"
            type="tel"
            inputMode="tel"
            placeholder="09XXXXXXXX"
            value={form.phone}
            onChange={(e) => update('phone', e.target.value)}
          />
        </div>

        <div className="new-service-field">
          <label className="new-service-label">الوصف</label>
          <textarea
            className="new-service-textarea"
            placeholder="صف خدمتك بإيجاز..."
            value={form.description}
            onChange={(e) => update('description', e.target.value)}
          />
        </div>

        <div className="new-service-field">
          <label className="new-service-label">العنوان</label>
          <input
            className="new-service-input"
            type="text"
            placeholder="مثال: حي المركز — كنصفرة"
            value={form.address}
            onChange={(e) => update('address', e.target.value)}
          />
        </div>

        <div className="new-service-field">
          <label className="new-service-label">رابط الصورة</label>
          <input
            className="new-service-input"
            type="url"
            placeholder="https://..."
            value={form.image_url}
            onChange={(e) => update('image_url', e.target.value)}
          />
        </div>

        <label className="new-service-checkbox">
          <input
            type="checkbox"
            checked={form.is_featured}
            onChange={(e) => update('is_featured', e.target.checked)}
          />
          <div>
            <div className="new-service-checkbox-label">⭐ خدمة مميزة</div>
            <div className="new-service-checkbox-hint">ستظهر في قسم "عروض اليوم"</div>
          </div>
        </label>

        {error && (
          <div className="login-error" style={{ color: '#fecaca', background: 'rgba(220,38,38,.14)', border: '1px solid rgba(220,38,38,.35)', padding: '14px 16px', borderRadius: '14px', fontSize: 13, fontWeight: 600 }}>
            {error}
          </div>
        )}

        <button className="new-service-submit" type="submit" disabled={loading}>
          {loading ? '... جارٍ الحفظ' : '+ إضافة الخدمة'}
        </button>
      </form>
    </div>
  );
}
