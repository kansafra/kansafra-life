'use client';


import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

export default function NewVehicle() {
  const router = useRouter();
  const [entity, setEntity] = useState(null);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  const [f, setF] = useState({
    vehicle_type: 'taxi',
    brand: '', model: '', color: '', plate_number: '',
    capacity: '', route: '', working_hours: '',
    base_price: '', price_per_km: '', currency: 'SYP',
    image_url: '', notes: '',
  });

  useEffect(() => {
    let stored = null;
    try { stored = JSON.parse(localStorage.getItem('sanad_entity') || 'null'); } catch {}
    if (!stored) { router.replace('/login'); return; }
    setEntity(stored);
  }, [router]);

  const update = (k, v) => setF((old) => ({ ...old, [k]: v }));

  async function submit(e) {
    e.preventDefault();
    setError('');
    if (!supabase) { setError('قاعدة البيانات غير متصلة'); return; }
    setLoading(true);
    const { error: err } = await supabase.from('vehicles').insert({
      owner_name: entity.display_name,
      phone: entity.phone || '',
      vehicle_type: f.vehicle_type,
      brand: f.brand.trim() || null,
      model: f.model.trim() || null,
      color: f.color.trim() || null,
      plate_number: f.plate_number.trim() || null,
      capacity: Number(f.capacity) || null,
      route: f.route.trim() || null,
      working_hours: f.working_hours.trim() || null,
      base_price: Number(f.base_price) || 0,
      price_per_km: Number(f.price_per_km) || 0,
      currency: f.currency,
      image_url: f.image_url.trim() || null,
      notes: f.notes.trim() || null,
      is_available: true,
    });
    setLoading(false);
    if (err) { setError('تعذّر الحفظ: ' + err.message); return; }
    setDone(true);
  }

  if (!entity) return <div className="trans-empty" style={{ padding: 80 }}><span className="em">⏳</span><p>جارٍ التحميل...</p></div>;

  if (done) {
    return (
      <div className="prod-page">
        <div className="new-service-success">
          <div className="chk-circle">✓</div>
          <h2>تم إضافة المركبة</h2>
          <p>ستظهر الآن للزوار في صفحة المواصلات</p>
          <Link href="/merchant" className="new-service-submit" style={{ display: 'block', textAlign: 'center', textDecoration: 'none' }}>
            العودة للوحة
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="new-prod-page">
      <div className="prod-header">
        <Link href="/merchant" className="prod-back">→</Link>
        <span className="prod-header-title">إضافة مركبة</span>
      </div>

      <form className="new-prod-form" onSubmit={submit}>

        <div className="new-service-field">
          <label className="new-service-label">نوع المركبة <span className="req">*</span></label>
          <select className="new-service-select" value={f.vehicle_type} onChange={(e) => update('vehicle_type', e.target.value)}>
            <option value="taxi">🚕 تاكسي</option>
            <option value="bus">🚌 باص</option>
            <option value="service">🚐 سرفيس</option>
            <option value="truck">🚛 شاحنة</option>
            <option value="motorcycle">🏍️ دراجة</option>
            <option value="van">🚚 فان</option>
            <option value="other">🚙 أخرى</option>
          </select>
        </div>

        <div className="new-prod-row">
          <div className="new-service-field">
            <label className="new-service-label">الماركة</label>
            <input className="new-service-input" placeholder="كيا / هيونداي..." value={f.brand} onChange={(e) => update('brand', e.target.value)} />
          </div>
          <div className="new-service-field">
            <label className="new-service-label">الموديل</label>
            <input className="new-service-input" placeholder="2018" value={f.model} onChange={(e) => update('model', e.target.value)} />
          </div>
        </div>

        <div className="new-prod-row">
          <div className="new-service-field">
            <label className="new-service-label">اللون</label>
            <input className="new-service-input" placeholder="أبيض / أسود..." value={f.color} onChange={(e) => update('color', e.target.value)} />
          </div>
          <div className="new-service-field">
            <label className="new-service-label">رقم اللوحة</label>
            <input className="new-service-input" placeholder="123456" value={f.plate_number} onChange={(e) => update('plate_number', e.target.value)} />
          </div>
        </div>

        <div className="new-prod-row">
          <div className="new-service-field">
            <label className="new-service-label">السعة (أشخاص)</label>
            <input className="new-service-input" type="number" placeholder="4" value={f.capacity} onChange={(e) => update('capacity', e.target.value)} />
          </div>
          <div className="new-service-field">
            <label className="new-service-label">ساعات العمل</label>
            <input className="new-service-input" placeholder="24 ساعة / 6ص - 10م" value={f.working_hours} onChange={(e) => update('working_hours', e.target.value)} />
          </div>
        </div>

        <div className="new-service-field">
          <label className="new-service-label">الخط / المنطقة</label>
          <input className="new-service-input" placeholder="مثال: كنصفرة - إدلب - حارم" value={f.route} onChange={(e) => update('route', e.target.value)} />
        </div>

        <div className="new-prod-row">
          <div className="new-service-field">
            <label className="new-service-label">أجرة البداية</label>
            <input className="new-service-input" type="number" placeholder="0" value={f.base_price} onChange={(e) => update('base_price', e.target.value)} />
          </div>
          <div className="new-service-field">
            <label className="new-service-label">سعر الكيلو</label>
            <input className="new-service-input" type="number" placeholder="0" value={f.price_per_km} onChange={(e) => update('price_per_km', e.target.value)} />
          </div>
        </div>

        <div className="new-service-field">
          <label className="new-service-label">العملة</label>
          <select className="new-service-select" value={f.currency} onChange={(e) => update('currency', e.target.value)}>
            <option value="SYP">ليرة سورية</option>
            <option value="USD">دولار</option>
            <option value="TRY">ليرة تركية</option>
          </select>
        </div>

        <div className="new-service-field">
          <label className="new-service-label">صورة المركبة (رابط)</label>
          <input className="new-service-input" type="url" placeholder="https://..." value={f.image_url} onChange={(e) => update('image_url', e.target.value)} />
        </div>

        <div className="new-service-field">
          <label className="new-service-label">ملاحظات</label>
          <textarea className="new-service-textarea" placeholder="أي تفاصيل إضافية..." value={f.notes} onChange={(e) => update('notes', e.target.value)} />
        </div>

        {error && <div style={{ padding: 14, background: 'rgba(220,38,38,.14)', border: '1px solid rgba(220,38,38,.35)', borderRadius: 14, color: '#dc2626', fontSize: 13, fontWeight: 600 }}>{error}</div>}

        <button className="new-service-submit" type="submit" disabled={loading}>
          {loading ? '... جارٍ الحفظ' : '✓ إضافة المركبة'}
        </button>
      </form>
    </div>
  );
}
