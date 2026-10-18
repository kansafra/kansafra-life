'use client';
import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { useCurrentUser } from '@/lib/useCurrentUser';
import { useToast } from '@/components/Toast';
import { SkeletonList } from '@/components/Skeleton';
import EmptyState from '@/components/EmptyState';
import ImageUploader from '@/components/ImageUploader';

const TYPES = { car: 'سيارة', bus: 'باص', van: 'فان', truck: 'شاحنة', taxi: 'تاكسي' };

export default function VehiclesPage() {
  const router = useRouter();
  const { user, loading: uL, dataOwnerName } = useCurrentUser();
  const { success, error: tE } = useToast();
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (uL) return;
    if (!user) { router.replace('/login'); return; }
    load();
  }, [user, uL]);

  async function load() {
    if (!supabase || !dataOwnerName) { setLoading(false); return; }
    const { data } = await supabase.from('transport_vehicles').select('*').eq('entity_name', dataOwnerName).order('created_at', { ascending: false });
    setVehicles(data || []);
    setLoading(false);
  }

  const filtered = useMemo(() => {
    if (!search.trim()) return vehicles;
    const q = search.trim().toLowerCase();
    return vehicles.filter(v => (v.title || '').toLowerCase().includes(q) || (v.plate_number || '').includes(q));
  }, [vehicles, search]);

  function openAdd() {
    setForm({ title: '', vehicle_type: 'car', plate_number: '', capacity: 4, route_from: '', route_to: '', price: 0, currency: 'SYP', driver_name: '', driver_phone: '', image_url: '', is_active: true, notes: '' });
    setModal('add');
  }

  function openEdit(v) { setForm({ ...v }); setModal('edit'); }

  async function save() {
    if (!form.title?.trim()) { tE('عنوان المركبة مطلوب'); return; }
    setSaving(true);
    try {
      const payload = {
        entity_name: dataOwnerName,
        title: form.title.trim(),
        vehicle_type: form.vehicle_type || 'car',
        plate_number: form.plate_number?.trim() || null,
        capacity: Number(form.capacity) || 4,
        route_from: form.route_from?.trim() || null,
        route_to: form.route_to?.trim() || null,
        price: Number(form.price) || 0,
        currency: form.currency || 'SYP',
        driver_name: form.driver_name?.trim() || null,
        driver_phone: form.driver_phone?.trim() || null,
        image_url: form.image_url || null,
        is_active: form.is_active !== false,
        notes: form.notes?.trim() || null,
      };
      let err;
      if (modal === 'edit') ({ error: err } = await supabase.from('transport_vehicles').update(payload).eq('id', form.id));
      else ({ error: err } = await supabase.from('transport_vehicles').insert(payload));
      if (err) throw err;
      success(modal === 'edit' ? '✅ تم التعديل' : '✅ تمت الإضافة');
      setModal(null); load();
    } catch (e) { tE('تعذّر: ' + e.message); }
    setSaving(false);
  }

  async function del(v) {
    if (!confirm('حذف هذه المركبة؟')) return;
    await supabase.from('transport_vehicles').delete().eq('id', v.id);
    success('✅ تم'); load();
  }

  async function toggle(v) {
    await supabase.from('transport_vehicles').update({ is_active: !v.is_active }).eq('id', v.id);
    load();
  }

  if (uL || loading) return <div style={{ padding: 16, background: '#f8fafc', minHeight: '100vh' }}><SkeletonList count={3} /></div>;

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', paddingBottom: 80 }}>
      <div style={{ position: 'sticky', top: 0, zIndex: 10, background: '#0d9488', padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <Link href="/merchant" style={{ color: '#fff', textDecoration: 'none', fontSize: 20, width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,.15)', borderRadius: '50%' }}>→</Link>
        <div style={{ flex: 1 }}>
          <div style={{ color: '#fff', fontSize: 16, fontWeight: 900 }}>🚗 إدارة المركبات</div>
          <div style={{ color: 'rgba(255,255,255,.8)', fontSize: 11, marginTop: 2 }}>{vehicles.length} مركبة</div>
        </div>
        <button onClick={openAdd} style={{ background: '#fff', color: '#0d9488', border: 'none', padding: '8px 14px', borderRadius: 10, fontSize: 12, fontWeight: 900, cursor: 'pointer', fontFamily: 'inherit' }}>+ مركبة</button>
      </div>

      <div style={{ padding: 16 }}>
        <input type="text" placeholder="🔍 ابحث بالاسم أو اللوحة..." value={search} onChange={(e) => setSearch(e.target.value)}
          style={{ width: '100%', padding: '12px 14px', border: '1px solid #e5e7eb', borderRadius: 12, fontSize: 13, fontFamily: 'inherit', boxSizing: 'border-box', outline: 'none', background: '#fff' }} />
      </div>

      <div style={{ padding: '0 16px' }}>
        {filtered.length === 0 ? (
          <EmptyState icon="🚗" title="لا توجد مركبات" description="أضف مركباتك ليتمكن العملاء من رؤيتها" actionLabel="+ إضافة" onAction={openAdd} />
        ) : filtered.map(v => (
          <div key={v.id} style={{ background: '#fff', borderRadius: 14, padding: 14, marginBottom: 10, border: '1px solid #e5e7eb', opacity: v.is_active ? 1 : 0.6 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 900, color: '#0f172a' }}>{TYPES[v.vehicle_type] || 'سيارة'} · {v.title}</div>
                <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>{v.plate_number ? `لوحة: ${v.plate_number} · ` : ''}{v.capacity} مقاعد</div>
                {(v.route_from || v.route_to) && <div style={{ fontSize: 11, color: '#0d9488', fontWeight: 800, marginTop: 2 }}>📍 {v.route_from} ← {v.route_to}</div>}
              </div>
              <span style={{ background: v.is_active ? 'rgba(16,185,129,.15)' : '#f1f5f9', color: v.is_active ? '#10b981' : '#64748b', padding: '3px 10px', borderRadius: 6, fontSize: 9.5, fontWeight: 900, height: 'fit-content' }}>{v.is_active ? '● نشط' : '○ معطل'}</span>
            </div>
            <div style={{ display: 'flex', gap: 6, paddingTop: 10, borderTop: '1px solid #f1f5f9' }}>
              <button onClick={() => openEdit(v)} style={{ flex: 1, padding: 8, background: '#f1f5f9', border: 'none', borderRadius: 8, fontSize: 11, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit' }}>✏️ تعديل</button>
              <button onClick={() => toggle(v)} style={{ flex: 1, padding: 8, background: v.is_active ? 'rgba(251,191,36,.1)' : 'rgba(16,185,129,.1)', color: v.is_active ? '#92400e' : '#10b981', border: 'none', borderRadius: 8, fontSize: 11, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit' }}>{v.is_active ? '⏸ إيقاف' : '▶ تفعيل'}</button>
              <button onClick={() => del(v)} style={{ padding: 8, background: 'rgba(220,38,38,.1)', color: '#dc2626', border: 'none', borderRadius: 8, fontSize: 11, cursor: 'pointer', fontFamily: 'inherit' }}>🗑️</button>
            </div>
          </div>
        ))}
      </div>

      {modal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.6)', zIndex: 100, display: 'flex', alignItems: 'flex-end' }} onClick={() => setModal(null)}>
          <div style={{ background: '#fff', borderRadius: '24px 24px 0 0', width: '100%', maxWidth: 500, margin: '0 auto', padding: '24px 20px 30px', maxHeight: '90vh', overflowY: 'auto' }} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ fontSize: 18, fontWeight: 900, marginBottom: 16 }}>{modal === 'edit' ? 'تعديل مركبة' : 'مركبة جديدة'}</h3>

            <input type="text" placeholder="عنوان المركبة * (مثال: باص إدلب - حلب)" value={form.title || ''} onChange={(e) => setForm({ ...form, title: e.target.value })} style={{ width: '100%', padding: 12, border: '1px solid #e5e7eb', borderRadius: 10, fontSize: 13, marginBottom: 10, boxSizing: 'border-box', fontFamily: 'inherit' }} />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 10 }}>
              <select value={form.vehicle_type || 'car'} onChange={(e) => setForm({ ...form, vehicle_type: e.target.value })} style={{ padding: 12, border: '1px solid #e5e7eb', borderRadius: 10, fontSize: 13, boxSizing: 'border-box', fontFamily: 'inherit' }}>
                {Object.entries(TYPES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
              <input type="text" placeholder="رقم اللوحة" value={form.plate_number || ''} onChange={(e) => setForm({ ...form, plate_number: e.target.value })} style={{ padding: 12, border: '1px solid #e5e7eb', borderRadius: 10, fontSize: 13, boxSizing: 'border-box', fontFamily: 'inherit' }} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 10 }}>
              <input type="number" placeholder="عدد المقاعد" value={form.capacity || 4} onChange={(e) => setForm({ ...form, capacity: e.target.value })} style={{ padding: 12, border: '1px solid #e5e7eb', borderRadius: 10, fontSize: 13, boxSizing: 'border-box', fontFamily: 'inherit' }} />
              <input type="number" placeholder="السعر" value={form.price || 0} onChange={(e) => setForm({ ...form, price: e.target.value })} style={{ padding: 12, border: '1px solid #e5e7eb', borderRadius: 10, fontSize: 13, boxSizing: 'border-box', fontFamily: 'inherit' }} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 10 }}>
              <input type="text" placeholder="من (نقطة الانطلاق)" value={form.route_from || ''} onChange={(e) => setForm({ ...form, route_from: e.target.value })} style={{ padding: 12, border: '1px solid #e5e7eb', borderRadius: 10, fontSize: 13, boxSizing: 'border-box', fontFamily: 'inherit' }} />
              <input type="text" placeholder="إلى (الوجهة)" value={form.route_to || ''} onChange={(e) => setForm({ ...form, route_to: e.target.value })} style={{ padding: 12, border: '1px solid #e5e7eb', borderRadius: 10, fontSize: 13, boxSizing: 'border-box', fontFamily: 'inherit' }} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 10 }}>
              <input type="text" placeholder="اسم السائق" value={form.driver_name || ''} onChange={(e) => setForm({ ...form, driver_name: e.target.value })} style={{ padding: 12, border: '1px solid #e5e7eb', borderRadius: 10, fontSize: 13, boxSizing: 'border-box', fontFamily: 'inherit' }} />
              <input type="tel" placeholder="هاتف السائق" value={form.driver_phone || ''} onChange={(e) => setForm({ ...form, driver_phone: e.target.value })} style={{ padding: 12, border: '1px solid #e5e7eb', borderRadius: 10, fontSize: 13, boxSizing: 'border-box', fontFamily: 'inherit', direction: 'ltr', textAlign: 'right' }} />
            </div>
            <div style={{ marginBottom: 10 }}>
              <ImageUploader label="📸 صورة المركبة" folder="vehicles" value={form.image_url || ''} onUpload={(url) => setForm({ ...form, image_url: url })} />
            </div>
            <textarea placeholder="ملاحظات" value={form.notes || ''} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} style={{ width: '100%', padding: 12, border: '1px solid #e5e7eb', borderRadius: 10, fontSize: 13, marginBottom: 10, boxSizing: 'border-box', fontFamily: 'inherit', resize: 'vertical' }} />
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, padding: 10, background: '#f0fdf4', borderRadius: 8, marginBottom: 16, cursor: 'pointer' }}>
              <input type="checkbox" checked={form.is_active !== false} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} />
              <span style={{ fontSize: 12, fontWeight: 800, color: '#065f46' }}>متاحة للعملاء</span>
            </label>

            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setModal(null)} style={{ flex: 1, padding: 12, background: '#f1f5f9', border: 'none', borderRadius: 10, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit' }}>إلغاء</button>
              <button onClick={save} disabled={saving} style={{ flex: 1, padding: 12, background: 'linear-gradient(135deg,#0d9488,#0f766e)', color: '#fff', border: 'none', borderRadius: 10, fontWeight: 900, cursor: saving ? 'not-allowed' : 'pointer', fontFamily: 'inherit' }}>{saving ? '...' : '✓ حفظ'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
