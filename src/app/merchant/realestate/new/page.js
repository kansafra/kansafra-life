'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { useCurrentUser } from '@/lib/useCurrentUser';
import { useToast } from '@/components/Toast';
import ImageUploader from '@/components/ImageUploader';

const TYPES = ['شقة', 'منزل', 'أرض', 'محل تجاري', 'مكتب', 'مخزن', 'فيلا', 'مزرعة'];

export default function NewRealEstate() {
  const router = useRouter();
  const { dataOwnerName, user } = useCurrentUser();
  const { success, error: tE } = useToast();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    title: '', description: '', property_type: 'شقة', deal_type: 'للبيع',
    rooms: '', bathrooms: '', area_m2: '', price: '', currency: 'SYP',
    location_text: '', owner_phone: user?.phone || '', image: '', lat: '', lng: '',
  });

  function u(k, v) { setForm(f => ({ ...f, [k]: v })); }

  async function save() {
    if (form.title.trim().length < 5) { tE('العنوان مطلوب (5 أحرف+)'); return; }
    if (!form.price || Number(form.price) <= 0) { tE('السعر مطلوب'); return; }
    if (!form.location_text.trim()) { tE('الموقع مطلوب'); return; }

    setSaving(true);
    try {
      const { error } = await supabase.from('real_estate').insert({
        owner_name: dataOwnerName,
        owner_phone: form.owner_phone,
        phone: form.owner_phone,
        title: form.title.trim(),
        description: form.description.trim() || null,
        property_type: form.property_type,
        deal_type: form.deal_type,
        rooms: form.rooms ? Number(form.rooms) : null,
        bathrooms: form.bathrooms ? Number(form.bathrooms) : null,
        area_m2: form.area_m2 ? Number(form.area_m2) : null,
        price: Number(form.price),
        currency: form.currency,
        location_text: form.location_text.trim(),
        images: form.image ? [form.image] : null,
        lat: form.lat ? Number(form.lat) : null,
        lng: form.lng ? Number(form.lng) : null,
      });
      if (error) throw error;
      success('✅ تم نشر العقار');
      router.push('/merchant/realestate');
    } catch (e) { tE('تعذّر: ' + e.message); }
    setSaving(false);
  }

  function getMyLocation() {
    if (!navigator.geolocation) { tE('GPS غير مدعوم'); return; }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        u('lat', pos.coords.latitude.toFixed(6));
        u('lng', pos.coords.longitude.toFixed(6));
        success('✅ تم تحديد موقعك');
      },
      () => tE('تعذّر تحديد الموقع')
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', paddingBottom: 100 }}>
      <div style={{ position: 'sticky', top: 0, zIndex: 10, background: '#ea580c', padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <Link href="/merchant/realestate" style={{ color: '#fff', textDecoration: 'none', fontSize: 20, width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,.15)', borderRadius: '50%' }}>←</Link>
        <div style={{ color: '#fff', fontSize: 16, fontWeight: 900 }}>🏠 عقار جديد</div>
      </div>

      <div style={{ padding: 16 }}>
        {/* المعلومات */}
        <div style={{ background: '#fff', borderRadius: 16, padding: 16, marginBottom: 12, border: '1px solid #e5e7eb' }}>
          <div style={{ fontSize: 13, fontWeight: 900, color: '#ea580c', marginBottom: 12 }}>📝 المعلومات</div>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 800, color: '#334155', marginBottom: 6 }}>العنوان *</label>
          <input type="text" value={form.title} onChange={(e) => u('title', e.target.value)} placeholder="شقة 3 غرف في وسط كنصفرة" style={{ width: '100%', padding: 12, border: '1px solid #e5e7eb', borderRadius: 10, fontSize: 13, marginBottom: 12, boxSizing: 'border-box', fontFamily: 'inherit', outline: 'none' }} />

          <label style={{ display: 'block', fontSize: 12, fontWeight: 800, color: '#334155', marginBottom: 6 }}>الوصف</label>
          <textarea value={form.description} onChange={(e) => u('description', e.target.value)} rows={3} style={{ width: '100%', padding: 12, border: '1px solid #e5e7eb', borderRadius: 10, fontSize: 13, marginBottom: 12, boxSizing: 'border-box', fontFamily: 'inherit', outline: 'none', resize: 'vertical' }} />

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <select value={form.property_type} onChange={(e) => u('property_type', e.target.value)} style={{ padding: 12, border: '1px solid #e5e7eb', borderRadius: 10, fontSize: 13, fontFamily: 'inherit', boxSizing: 'border-box' }}>
              {TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
            <select value={form.deal_type} onChange={(e) => u('deal_type', e.target.value)} style={{ padding: 12, border: '1px solid #e5e7eb', borderRadius: 10, fontSize: 13, fontFamily: 'inherit', boxSizing: 'border-box' }}>
              <option>للبيع</option><option>للإيجار</option>
            </select>
          </div>
        </div>

        {/* المواصفات */}
        <div style={{ background: '#fff', borderRadius: 16, padding: 16, marginBottom: 12, border: '1px solid #e5e7eb' }}>
          <div style={{ fontSize: 13, fontWeight: 900, color: '#ea580c', marginBottom: 12 }}>📐 المواصفات</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
            <input type="number" value={form.rooms} onChange={(e) => u('rooms', e.target.value)} placeholder="غرف" style={{ padding: 10, border: '1px solid #e5e7eb', borderRadius: 8, fontSize: 13, boxSizing: 'border-box', fontFamily: 'inherit', outline: 'none', textAlign: 'center' }} />
            <input type="number" value={form.bathrooms} onChange={(e) => u('bathrooms', e.target.value)} placeholder="حمام" style={{ padding: 10, border: '1px solid #e5e7eb', borderRadius: 8, fontSize: 13, boxSizing: 'border-box', fontFamily: 'inherit', outline: 'none', textAlign: 'center' }} />
            <input type="number" value={form.area_m2} onChange={(e) => u('area_m2', e.target.value)} placeholder="م²" style={{ padding: 10, border: '1px solid #e5e7eb', borderRadius: 8, fontSize: 13, boxSizing: 'border-box', fontFamily: 'inherit', outline: 'none', textAlign: 'center' }} />
          </div>
        </div>

        {/* السعر والموقع */}
        <div style={{ background: '#fff', borderRadius: 16, padding: 16, marginBottom: 12, border: '1px solid #e5e7eb' }}>
          <div style={{ fontSize: 13, fontWeight: 900, color: '#ea580c', marginBottom: 12 }}>💰 السعر والموقع</div>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 8, marginBottom: 12 }}>
            <input type="number" value={form.price} onChange={(e) => u('price', e.target.value)} placeholder="السعر *" style={{ padding: 12, border: '1px solid #e5e7eb', borderRadius: 10, fontSize: 14, boxSizing: 'border-box', fontFamily: 'inherit', outline: 'none', fontWeight: 900 }} />
            <select value={form.currency} onChange={(e) => u('currency', e.target.value)} style={{ padding: 12, border: '1px solid #e5e7eb', borderRadius: 10, fontSize: 13, fontFamily: 'inherit', boxSizing: 'border-box' }}>
              <option>SYP</option><option>USD</option><option>TRY</option>
            </select>
          </div>
          <input type="text" value={form.location_text} onChange={(e) => u('location_text', e.target.value)} placeholder="الموقع *" style={{ width: '100%', padding: 12, border: '1px solid #e5e7eb', borderRadius: 10, fontSize: 13, marginBottom: 12, boxSizing: 'border-box', fontFamily: 'inherit', outline: 'none' }} />
          <input type="tel" value={form.owner_phone} onChange={(e) => u('owner_phone', e.target.value)} placeholder="رقم التواصل *" style={{ width: '100%', padding: 12, border: '1px solid #e5e7eb', borderRadius: 10, fontSize: 13, boxSizing: 'border-box', fontFamily: 'inherit', outline: 'none', direction: 'ltr', textAlign: 'right' }} />
        </div>

        {/* الموقع على الخريطة */}
        <div style={{ background: '#fff', borderRadius: 16, padding: 16, marginBottom: 12, border: '1px solid #e5e7eb' }}>
          <div style={{ fontSize: 13, fontWeight: 900, color: '#ea580c', marginBottom: 12 }}>📍 الموقع على الخريطة</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 12 }}>
            <input type="number" step="0.0001" value={form.lat} onChange={(e) => u('lat', e.target.value)} placeholder="Latitude" style={{ padding: 12, border: '1px solid #e5e7eb', borderRadius: 10, fontSize: 13, boxSizing: 'border-box', fontFamily: 'monospace', direction: 'ltr', textAlign: 'right' }} />
            <input type="number" step="0.0001" value={form.lng} onChange={(e) => u('lng', e.target.value)} placeholder="Longitude" style={{ padding: 12, border: '1px solid #e5e7eb', borderRadius: 10, fontSize: 13, boxSizing: 'border-box', fontFamily: 'monospace', direction: 'ltr', textAlign: 'right' }} />
          </div>
          <button type="button" onClick={getMyLocation} style={{ width: '100%', padding: 10, background: 'rgba(234,88,12,.1)', color: '#ea580c', border: '1px solid rgba(234,88,12,.3)', borderRadius: 10, fontSize: 12, fontWeight: 900, cursor: 'pointer', fontFamily: 'inherit' }}>📍 استخدام موقعي الحالي</button>
        </div>

        {/* الصورة */}
        <div style={{ background: '#fff', borderRadius: 16, padding: 16, border: '1px solid #e5e7eb' }}>
          <ImageUploader label="📸 صورة العقار" folder="realestate" value={form.image} onUpload={(url) => u('image', url)} />
        </div>
      </div>

      <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, padding: 12, background: '#fff', borderTop: '1px solid #e5e7eb' }}>
        <button onClick={save} disabled={saving} style={{ width: '100%', padding: 16, background: saving ? '#94a3b8' : 'linear-gradient(135deg,#ea580c,#c2410c)', color: '#fff', border: 'none', borderRadius: 12, fontSize: 15, fontWeight: 900, cursor: saving ? 'not-allowed' : 'pointer', fontFamily: 'inherit' }}>
          {saving ? '... جارٍ النشر' : '✓ نشر العقار'}
        </button>
      </div>
    </div>
  );
}
