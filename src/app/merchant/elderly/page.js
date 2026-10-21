'use client';
import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { useCurrentUser } from '@/lib/useCurrentUser';
import { useToast } from '@/components/Toast';

const TYPE_LABELS = {
  companionship: '🤝 رفقة', home_care: '🏠 رعاية', medical: '⚕️ طبية',
  transportation: '🚗 مواصلات', errands: '📋 حوائج', groceries: '🛒 تسوق',
  tech_support: '📱 دعم تقني', other: '🛎️ أخرى',
};

export default function MerchantElderlyPage() {
  const router = useRouter();
  const { success } = useToast();
  const { user, loading: userLoading, dataOwnerName } = useCurrentUser();
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [deleting, setDeleting] = useState(null);

  useEffect(() => {
    if (userLoading) return;
    if (!user || !dataOwnerName) { setLoading(false); return; }
    loadServices();
  }, [user, userLoading, dataOwnerName]);

  async function loadServices() {
    if (!supabase || !dataOwnerName) return;
    try {
      const { data } = await supabase.from('elderly_services').select('*').eq('provider_name', dataOwnerName).order('created_at', { ascending: false });
      setServices(data || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }

  async function toggleActive(s) {
    const { error } = await supabase.from('elderly_services').update({ is_active: !s.is_active }).eq('id', s.id);
    if (!error) {
      success(s.is_active ? '🙈 مخفية' : '✅ نشطة');
      setServices(prev => prev.map(x => x.id === s.id ? { ...x, is_active: !x.is_active } : x));
    }
  }

  async function deleteService(s) {
    if (!confirm(`حذف الخدمة "${s.title}"؟`)) return;
    setDeleting(s.id);
    const { error } = await supabase.from('elderly_services').delete().eq('id', s.id);
    if (!error) { success('🗑️ تم الحذف'); setServices(prev => prev.filter(x => x.id !== s.id)); }
    setDeleting(null);
  }

  const stats = useMemo(() => ({ total: services.length, active: services.filter(s => s.is_active).length }), [services]);
  const filtered = useMemo(() => {
    if (!search.trim()) return services;
    const q = search.trim().toLowerCase();
    return services.filter(s => (s.title || '').toLowerCase().includes(q));
  }, [services, search]);

  if (userLoading || loading) return <div style={{ padding: 80, textAlign: 'center' }}>⏳</div>;

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', paddingBottom: 100 }}>
      <div style={{ background: '#0f4d3a', padding: '16px 20px', position: 'sticky', top: 0, zIndex: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
          <Link href="/merchant" style={{ color: '#fff', textDecoration: 'none', fontSize: 20 }}>←</Link>
          <div style={{ flex: 1 }}><h1 style={{ color: '#fff', fontSize: 18, fontWeight: 900, margin: 0 }}>👴 كبار السن</h1></div>
          <Link href="/merchant/elderly/new" style={{ background: '#fbbf24', color: '#0f4d3a', padding: '8px 14px', borderRadius: 10, fontSize: 12, fontWeight: 900, textDecoration: 'none' }}>+ جديد</Link>
        </div>
        <input type="search" placeholder="🔍 ابحث..." value={search} onChange={e => setSearch(e.target.value)} style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: 'none', fontSize: 13, outline: 'none', boxSizing: 'border-box', background: 'rgba(255,255,255,0.95)' }} />
      </div>

      <div style={{ padding: 16, maxWidth: 800, margin: '0 auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8, marginBottom: 16 }}>
          <StatBox label="الكل" value={stats.total} color="#0f4d3a" />
          <StatBox label="نشطة" value={stats.active} color="#10b981" />
        </div>

        {filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 40, background: '#fff', borderRadius: 16, color: '#64748b' }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>👴</div>
            <div style={{ fontSize: 15, fontWeight: 900, marginBottom: 8 }}>{services.length === 0 ? 'لم تنشر خدمات بعد' : 'لا نتائج'}</div>
            {services.length === 0 && <Link href="/merchant/elderly/new" style={{ display: 'inline-block', background: '#0f4d3a', color: '#fff', padding: '10px 20px', borderRadius: 10, textDecoration: 'none', fontSize: 13, fontWeight: 900 }}>+ أضف خدمة</Link>}
          </div>
        ) : filtered.map(s => (
          <div key={s.id} style={{ background: '#fff', borderRadius: 14, padding: 14, marginBottom: 10, border: '1px solid #e2e8f0', opacity: s.is_active ? 1 : 0.6, display: 'flex', gap: 12 }}>
            <div style={{ width: 70, height: 70, borderRadius: 12, overflow: 'hidden', background: '#f1f5f9', flexShrink: 0 }}>
              {s.image_url ? <img src={s.image_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28 }}>👴</div>}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 900, color: '#0f172a', marginBottom: 4 }}>{s.title}</div>
              <div style={{ fontSize: 10.5, color: '#64748b', marginBottom: 8 }}>{TYPE_LABELS[s.service_type] || s.service_type} · {s.city || '—'}</div>
              <div style={{ display: 'flex', gap: 6 }}>
                <button onClick={() => toggleActive(s)} style={btnStyle(s.is_active ? 'rgba(245,158,11,0.1)' : 'rgba(16,185,129,0.1)', s.is_active ? '#f59e0b' : '#10b981')}>{s.is_active ? '🙈' : '👁️'}</button>
                <button onClick={() => deleteService(s)} disabled={deleting === s.id} style={btnStyle('rgba(239,68,68,0.1)', '#ef4444')}>{deleting === s.id ? '⏳' : '🗑️'}</button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <Link href="/merchant/elderly/new" style={{ position: 'fixed', bottom: 20, left: 20, right: 20, background: 'linear-gradient(135deg, #10b981, #059669)', color: '#fff', padding: 16, borderRadius: 14, textAlign: 'center', textDecoration: 'none', fontSize: 15, fontWeight: 900, boxShadow: '0 10px 30px rgba(16,185,129,0.4)', zIndex: 30 }}>+ خدمة جديدة</Link>
    </div>
  );
}

function StatBox({ label, value, color }) {
  return <div style={{ background: '#fff', borderRadius: 12, padding: 12, textAlign: 'center', border: '1px solid #e2e8f0' }}><div style={{ fontSize: 18, fontWeight: 900, color, marginBottom: 2 }}>{value}</div><div style={{ fontSize: 9.5, color: '#64748b', fontWeight: 800 }}>{label}</div></div>;
}

const btnStyle = (bg, color) => ({ flex: 1, padding: 8, background: bg, color, border: 'none', borderRadius: 6, fontSize: 12, fontWeight: 900, cursor: 'pointer', fontFamily: 'inherit' });
