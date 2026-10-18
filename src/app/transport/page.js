'use client';
import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { SkeletonList } from '@/components/Skeleton';
import EmptyState from '@/components/EmptyState';

const TYPES = {
  car: { label: 'سيارة', icon: '🚗' },
  bus: { label: 'باص', icon: '🚌' },
  van: { label: 'فان', icon: '🚐' },
  truck: { label: 'شاحنة', icon: '🚚' },
  taxi: { label: 'تاكسي', icon: '🚕' },
};

export default function TransportPage() {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');

  useEffect(() => { load(); }, []);

  async function load() {
    if (!supabase) { setLoading(false); return; }
    const { data } = await supabase.from('transport_vehicles').select('*').eq('is_active', true).order('created_at', { ascending: false });
    setVehicles(data || []);
    setLoading(false);
  }

  const filtered = useMemo(() => {
    let list = vehicles;
    if (filter !== 'all') list = list.filter(v => v.vehicle_type === filter);
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(v => 
        (v.title || '').toLowerCase().includes(q) || 
        (v.route_from || '').toLowerCase().includes(q) || 
        (v.route_to || '').toLowerCase().includes(q)
      );
    }
    return list;
  }, [vehicles, filter, search]);

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', paddingBottom: 80 }}>
      <div style={{ background: 'linear-gradient(135deg,#0d9488,#0f766e)', padding: '20px 16px', color: '#fff' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Link href="/" style={{ color: '#fff', textDecoration: 'none', fontSize: 20, width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,.15)', borderRadius: '50%' }}>→</Link>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 20, fontWeight: 900 }}>🚗 المواصلات</div>
            <div style={{ fontSize: 12, opacity: 0.85, marginTop: 2 }}>{filtered.length} مركبة متاحة</div>
          </div>
          <div style={{ fontSize: 40 }}>🚗</div>
        </div>
      </div>

      <div style={{ padding: 16 }}>
        <input type="text" placeholder="🔍 ابحث بالاسم أو المسار..." value={search} onChange={(e) => setSearch(e.target.value)}
          style={{ width: '100%', padding: '12px 14px', border: '1px solid #e5e7eb', borderRadius: 12, fontSize: 13, fontFamily: 'inherit', boxSizing: 'border-box', outline: 'none', background: '#fff', marginBottom: 10 }} />
        
        <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 4 }}>
          <button onClick={() => setFilter('all')} style={{ padding: '8px 14px', background: filter === 'all' ? '#0d9488' : '#fff', color: filter === 'all' ? '#fff' : '#64748b', border: `1px solid ${filter === 'all' ? '#0d9488' : '#e5e7eb'}`, borderRadius: 10, fontSize: 11.5, fontWeight: 800, cursor: 'pointer', whiteSpace: 'nowrap', fontFamily: 'inherit' }}>الكل</button>
          {Object.entries(TYPES).map(([k, v]) => (
            <button key={k} onClick={() => setFilter(k)} style={{ padding: '8px 14px', background: filter === k ? '#0d9488' : '#fff', color: filter === k ? '#fff' : '#64748b', border: `1px solid ${filter === k ? '#0d9488' : '#e5e7eb'}`, borderRadius: 10, fontSize: 11.5, fontWeight: 800, cursor: 'pointer', whiteSpace: 'nowrap', fontFamily: 'inherit' }}>{v.icon} {v.label}</button>
          ))}
        </div>
      </div>

      {loading ? (
        <div style={{ padding: 16 }}><SkeletonList count={3} /></div>
      ) : (
        <div style={{ padding: '0 16px' }}>
          {filtered.length === 0 ? (
            <EmptyState icon="🚗" title={search || filter !== 'all' ? 'لا توجد نتائج' : 'لا توجد مركبات'} description="ستظهر المركبات المتاحة هنا" actionLabel="← الرئيسية" actionHref="/" />
          ) : filtered.map(v => {
            const type = TYPES[v.vehicle_type] || TYPES.car;
            return (
              <div key={v.id} style={{ background: '#fff', borderRadius: 14, padding: 14, marginBottom: 10, border: '1px solid #e5e7eb' }}>
                <div style={{ display: 'flex', gap: 12, marginBottom: 10 }}>
                  {v.image_url ? (
                    <img src={v.image_url} alt="" style={{ width: 60, height: 60, borderRadius: 10, objectFit: 'cover' }} />
                  ) : (
                    <div style={{ width: 60, height: 60, borderRadius: 10, background: 'rgba(13,148,136,.1)', color: '#0d9488', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28 }}>{type.icon}</div>
                  )}
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 900, color: '#0f172a' }}>{v.title || type.label}</div>
                    <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>{type.label} {v.capacity ? `· ${v.capacity} مقاعد` : ''}</div>
                    {(v.route_from || v.route_to) && (
                      <div style={{ fontSize: 12, color: '#0d9488', fontWeight: 800, marginTop: 4 }}>📍 {v.route_from} ← {v.route_to}</div>
                    )}
                  </div>
                  {Number(v.price) > 0 && (
                    <div style={{ textAlign: 'left' }}>
                      <div style={{ fontSize: 15, fontWeight: 900, color: '#0f172a' }}>{Number(v.price).toLocaleString()}</div>
                      <div style={{ fontSize: 10, color: '#64748b' }}>{v.currency}</div>
                    </div>
                  )}
                </div>
                {v.driver_name && <div style={{ fontSize: 11, color: '#64748b', marginBottom: 8 }}>👤 السائق: {v.driver_name}</div>}
                {v.driver_phone && (
                  <div style={{ display: 'flex', gap: 8 }}>
                    <a href={`tel:${v.driver_phone}`} style={{ flex: 1, padding: 10, background: 'rgba(59,130,246,.1)', color: '#3b82f6', border: '1px solid rgba(59,130,246,.3)', borderRadius: 10, textAlign: 'center', fontSize: 12, fontWeight: 900, textDecoration: 'none' }}>📞 اتصال</a>
                    <a href={`https://wa.me/${String(v.driver_phone).replace(/\D/g, '').replace(/^0/, '963')}`} target="_blank" rel="noopener" style={{ flex: 1, padding: 10, background: 'rgba(37,211,102,.1)', color: '#059669', border: '1px solid rgba(37,211,102,.3)', borderRadius: 10, textAlign: 'center', fontSize: 12, fontWeight: 900, textDecoration: 'none' }}>📱 واتساب</a>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
