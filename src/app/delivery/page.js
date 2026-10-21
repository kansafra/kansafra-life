'use client';
import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

const VEHICLE_TYPES = {
  motorcycle: { label: 'دراجة نارية', icon: '🏍️' },
  car: { label: 'سيارة', icon: '🚗' },
  van: { label: 'فان / شاحنة صغيرة', icon: '🚐' },
  truck: { label: 'شاحنة', icon: '🚚' },
  bicycle: { label: 'دراجة هوائية', icon: '🚲' },
};

export default function DeliveryPage() {
  const router = useRouter();
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [vehicleFilter, setVehicleFilter] = useState('all');

  useEffect(() => { loadDrivers(); }, []);

  async function loadDrivers() {
    if (!supabase) return;
    setLoading(true);
    try {
      const { data } = await supabase
        .from('delivery_drivers')
        .select('*')
        .eq('is_available', true)
        .eq('is_approved', true)
        .order('rating', { ascending: false });
      setDrivers(data || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }

  const filtered = useMemo(() => {
    let list = drivers;
    if (vehicleFilter !== 'all') list = list.filter(d => d.vehicle_type === vehicleFilter);
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(d =>
        (d.full_name || '').toLowerCase().includes(q) ||
        (d.city || '').toLowerCase().includes(q) ||
        (d.area || '').toLowerCase().includes(q)
      );
    }
    return list;
  }, [drivers, vehicleFilter, search]);

  const stats = useMemo(() => ({
    total: drivers.length,
    byVehicle: drivers.reduce((acc, d) => {
      acc[d.vehicle_type] = (acc[d.vehicle_type] || 0) + 1;
      return acc;
    }, {}),
  }), [drivers]);

  if (loading) return <div style={{ padding: 80, textAlign: 'center' }}>⏳</div>;

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', paddingBottom: 40 }}>
      <div style={{ background: 'linear-gradient(135deg, #0f4d3a, #075640)', padding: '20px', color: '#fff', borderBottomLeftRadius: 24, borderBottomRightRadius: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
          <button onClick={() => router.back()} style={{ color: '#fff', background: 'rgba(255,255,255,.15)', border: 'none', width: 40, height: 40, borderRadius: '50%', fontSize: 18, cursor: 'pointer' }}>←</button>
          <div style={{ flex: 1 }}>
            <h1 style={{ fontSize: 20, fontWeight: 900, margin: 0 }}>🚚 التوصيل</h1>
            <div style={{ fontSize: 12, opacity: 0.8, marginTop: 2 }}>{stats.total} سائق متاح الآن</div>
          </div>
          <Link href="/delivery/register" style={{ background: '#fbbf24', color: '#0f4d3a', padding: '8px 14px', borderRadius: 10, fontSize: 12, fontWeight: 900, textDecoration: 'none' }}>+ انضم</Link>
        </div>
        <input type="search" placeholder="🔍 ابحث باسم السائق أو المدينة..." value={search} onChange={e => setSearch(e.target.value)} style={{ width: '100%', padding: '12px 16px', borderRadius: 12, border: 'none', fontSize: 14, outline: 'none', boxSizing: 'border-box', background: 'rgba(255,255,255,0.95)', fontFamily: 'inherit' }} />
      </div>

      <div style={{ padding: 16, maxWidth: 800, margin: '0 auto' }}>
        <div style={{ display: 'flex', gap: 6, marginBottom: 16, overflowX: 'auto', paddingBottom: 4 }}>
          <button onClick={() => setVehicleFilter('all')} style={chip(vehicleFilter === 'all')}>الكل</button>
          {Object.entries(VEHICLE_TYPES).map(([k, v]) => (
            <button key={k} onClick={() => setVehicleFilter(k)} style={chip(vehicleFilter === k)}>{v.icon} {v.label} {stats.byVehicle[k] > 0 && `(${stats.byVehicle[k]})`}</button>
          ))}
        </div>

        {filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 60, background: '#fff', borderRadius: 16, color: '#64748b' }}>
            <div style={{ fontSize: 60, marginBottom: 12 }}>🚚</div>
            <div style={{ fontSize: 15, fontWeight: 900, marginBottom: 8 }}>
              {drivers.length === 0 ? 'لا يوجد سائقون متاحون الآن' : 'لا نتائج'}
            </div>
            <div style={{ fontSize: 12, marginBottom: 16 }}>
              {drivers.length === 0 ? 'هل أنت سائق؟ انضم إلينا الآن' : 'جرّب تغيير الفلتر'}
            </div>
            <Link href="/delivery/register" style={{ display: 'inline-block', background: '#0f4d3a', color: '#fff', padding: '10px 20px', borderRadius: 10, textDecoration: 'none', fontSize: 13, fontWeight: 900 }}>
              + سجل كسائق
            </Link>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 12 }}>
            {filtered.map(d => {
              const vehicle = VEHICLE_TYPES[d.vehicle_type] || VEHICLE_TYPES.motorcycle;
              const phone = (d.phone || '').replace(/[^0-9]/g, '');
              return (
                <div key={d.id} style={{ background: '#fff', borderRadius: 16, padding: 16, border: '1px solid #e2e8f0' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                    <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'linear-gradient(135deg, #0ea5e9, #0284c7)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, fontWeight: 900, flexShrink: 0, overflow: 'hidden' }}>
                      {d.image_url ? <img src={d.image_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : (d.full_name || '؟').charAt(0)}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 14, fontWeight: 900, color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{d.full_name}</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 4 }}>
                        <span style={{ color: '#fbbf24', fontSize: 12 }}>{'★'.repeat(Math.round(d.rating || 5))}</span>
                        <span style={{ fontSize: 10, color: '#64748b' }}>({d.total_deliveries || 0})</span>
                      </div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
                    <span style={{ background: 'rgba(14,165,233,0.1)', color: '#0284c7', padding: '3px 8px', borderRadius: 6, fontSize: 10, fontWeight: 900 }}>{vehicle.icon} {vehicle.label}</span>
                    {d.city && <span style={{ background: 'rgba(16,185,129,0.1)', color: '#059669', padding: '3px 8px', borderRadius: 6, fontSize: 10, fontWeight: 900 }}>📍 {d.city}</span>}
                  </div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    {phone && <a href={`tel:${phone}`} style={{ flex: 1, padding: 10, background: 'rgba(16,185,129,0.1)', color: '#059669', border: '1px solid rgba(16,185,129,0.3)', borderRadius: 8, fontSize: 12, fontWeight: 900, textAlign: 'center', textDecoration: 'none' }}>📞 اتصل</a>}
                    {phone && <a href={`https://wa.me/${phone}?text=${encodeURIComponent('مرحباً، أحتاج خدمة توصيل')}`} target="_blank" rel="noreferrer" style={{ flex: 1, padding: 10, background: 'rgba(37,211,102,0.1)', color: '#25D366', border: '1px solid rgba(37,211,102,0.3)', borderRadius: 8, fontSize: 12, fontWeight: 900, textAlign: 'center', textDecoration: 'none' }}>💬 واتساب</a>}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function chip(active) {
  return { background: active ? '#0f4d3a' : '#fff', color: active ? '#fff' : '#64748b', border: active ? '1px solid #0f4d3a' : '1px solid #e2e8f0', padding: '8px 14px', borderRadius: 20, fontSize: 12, fontWeight: 900, cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap' };
}
