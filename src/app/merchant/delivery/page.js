'use client';
import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { useCurrentUser } from '@/lib/useCurrentUser';
import { useToast } from '@/components/Toast';

const VEHICLE_TYPES = {
  motorcycle: { label: 'دراجة نارية', icon: '🏍️' },
  car: { label: 'سيارة', icon: '🚗' },
  van: { label: 'فان', icon: '🚐' },
  truck: { label: 'شاحنة', icon: '🚚' },
  bicycle: { label: 'دراجة هوائية', icon: '🚲' },
};

export default function MerchantDeliveryPage() {
  const router = useRouter();
  const { success } = useToast();
  const { user, loading: userLoading, dataOwnerName } = useCurrentUser();
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [cityFilter, setCityFilter] = useState('all');

  useEffect(() => {
    if (userLoading) return;
    if (!user) return;
    loadDrivers();
  }, [user, userLoading]);

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

  const cities = useMemo(() => {
    const set = new Set();
    drivers.forEach(d => { if (d.city) set.add(d.city); });
    return Array.from(set).sort();
  }, [drivers]);

  const filtered = useMemo(() => {
    let list = drivers;
    if (cityFilter !== 'all') list = list.filter(d => d.city === cityFilter);
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(d => (d.full_name || '').toLowerCase().includes(q) || (d.phone || '').includes(q));
    }
    return list;
  }, [drivers, cityFilter, search]);

  if (userLoading || loading) return <div style={{ padding: 80, textAlign: 'center' }}>⏳</div>;

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', paddingBottom: 40 }}>
      <div style={{ background: '#0f4d3a', padding: '16px 20px', position: 'sticky', top: 0, zIndex: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
          <Link href="/merchant" style={{ color: '#fff', textDecoration: 'none', fontSize: 20 }}>←</Link>
          <div style={{ flex: 1 }}><h1 style={{ color: '#fff', fontSize: 18, fontWeight: 900, margin: 0 }}>🚚 سائقو التوصيل</h1></div>
        </div>
        <input type="search" placeholder="🔍 ابحث بالاسم أو الهاتف..." value={search} onChange={e => setSearch(e.target.value)} style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: 'none', fontSize: 13, outline: 'none', boxSizing: 'border-box', background: 'rgba(255,255,255,0.95)' }} />
        {cities.length > 0 && (
          <select value={cityFilter} onChange={e => setCityFilter(e.target.value)} style={{ width: '100%', marginTop: 8, padding: '8px 12px', borderRadius: 10, border: 'none', fontSize: 12, outline: 'none', background: 'rgba(255,255,255,0.95)', fontWeight: 800 }}>
            <option value="all">كل المدن ({drivers.length})</option>
            {cities.map(c => <option key={c} value={c}>{c} ({drivers.filter(d => d.city === c).length})</option>)}
          </select>
        )}
      </div>

      <div style={{ padding: 16, maxWidth: 800, margin: '0 auto' }}>
        <div style={{ background: 'linear-gradient(135deg, #0ea5e9, #0284c7)', borderRadius: 16, padding: 16, color: '#fff', marginBottom: 16, textAlign: 'center' }}>
          <div style={{ fontSize: 14, fontWeight: 900, marginBottom: 4 }}>🚚 {drivers.length} سائق متاح</div>
          <div style={{ fontSize: 11, opacity: 0.9 }}>اتصل مباشرة بأي سائق لتوصيل طلباتك</div>
        </div>

        {filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 40, background: '#fff', borderRadius: 16, color: '#64748b' }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>🚚</div>
            <div style={{ fontSize: 15, fontWeight: 900 }}>{drivers.length === 0 ? 'لا يوجد سائقون متاحون' : 'لا نتائج'}</div>
          </div>
        ) : filtered.map(d => {
          const vehicle = VEHICLE_TYPES[d.vehicle_type] || VEHICLE_TYPES.motorcycle;
          const phone = (d.phone || '').replace(/[^0-9]/g, '');
          return (
            <div key={d.id} style={{ background: '#fff', borderRadius: 14, padding: 14, marginBottom: 10, border: '1px solid #e2e8f0', display: 'flex', gap: 12 }}>
              <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'linear-gradient(135deg, #0ea5e9, #0284c7)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, fontWeight: 900, flexShrink: 0, overflow: 'hidden' }}>
                {d.image_url ? <img src={d.image_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : (d.full_name || '؟').charAt(0)}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 900, color: '#0f172a' }}>{d.full_name}</div>
                <div style={{ fontSize: 10.5, color: '#64748b', marginTop: 2 }}>{vehicle.icon} {vehicle.label} · 📍 {d.city || '—'}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 4 }}>
                  <span style={{ color: '#fbbf24', fontSize: 11 }}>{'★'.repeat(Math.round(d.rating || 5))}</span>
                  <span style={{ fontSize: 9.5, color: '#64748b' }}>({d.total_deliveries || 0} توصيلة)</span>
                </div>
                <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
                  {phone && <a href={`tel:${phone}`} style={{ flex: 1, padding: 8, background: 'rgba(16,185,129,0.1)', color: '#059669', border: '1px solid rgba(16,185,129,0.3)', borderRadius: 6, fontSize: 11, fontWeight: 900, textAlign: 'center', textDecoration: 'none' }}>📞</a>}
                  {phone && <a href={`https://wa.me/${phone}?text=${encodeURIComponent('مرحباً، أحتاج توصيل طلب')}`} target="_blank" rel="noreferrer" style={{ flex: 1, padding: 8, background: 'rgba(37,211,102,0.1)', color: '#25D366', border: '1px solid rgba(37,211,102,0.3)', borderRadius: 6, fontSize: 11, fontWeight: 900, textAlign: 'center', textDecoration: 'none' }}>💬</a>}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
