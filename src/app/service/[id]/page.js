'use client';
import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/components/Toast';
import Reviews from '@/components/Reviews';

export default function ServiceDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { success, error: tE } = useToast();
  const [service, setService] = useState(null);
  const [store, setStore] = useState(null);
  const [similar, setSimilar] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (params?.id) load(params.id);
  }, [params?.id]);

  async function load(id) {
    if (!supabase) { setLoading(false); return; }
    try {
      const { data } = await supabase.from('services').select('*').eq('id', id).maybeSingle();
      if (!data) { setLoading(false); return; }
      setService(data);

      const { data: ent } = await supabase.from('entities').select('id, display_name, logo_url, phone, whatsapp, city, is_verified, bio').eq('display_name', data.provider_name).maybeSingle();
      setStore(ent);

      if (data.category_id) {
        const { data: sim } = await supabase.from('services').select('*').eq('category_id', data.category_id).eq('status', 'published').neq('id', id).limit(6);
        setSimilar(sim || []);
      }
    } catch (e) { console.error(e); }
    setLoading(false);
  }

  function call() {
    if (!service?.phone) return;
    window.location.href = `tel:${service.phone}`;
  }

  function whatsapp() {
    if (!service?.phone) return;
    const clean = String(service.phone).replace(/\D/g, '');
    const phone = clean.startsWith('0') ? '963' + clean.slice(1) : clean;
    const msg = `مرحباً، أستفسر عن خدمة "${service.title}"`;
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`, '_blank');
    success('جارٍ فتح واتساب');
  }

  if (loading) return <div style={{ padding: 80, textAlign: 'center' }}>⏳</div>;

  if (!service) {
    return (
      <div style={{ minHeight: '100vh', background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
        <div style={{ background: '#fff', borderRadius: 16, padding: 40, textAlign: 'center', maxWidth: 400 }}>
          <div style={{ fontSize: 56, marginBottom: 16 }}>🔍</div>
          <div style={{ fontSize: 18, fontWeight: 900, marginBottom: 8 }}>الخدمة غير موجودة</div>
          <Link href="/" style={{ display: 'inline-block', background: '#0f4d3a', color: '#fff', padding: '10px 20px', borderRadius: 10, textDecoration: 'none', fontWeight: 800, marginTop: 16 }}>← الرئيسية</Link>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', paddingBottom: 100 }}>
      {/* Header */}
      <div style={{ position: 'sticky', top: 0, zIndex: 10, background: '#fff', borderBottom: '1px solid #e5e7eb', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <button onClick={() => router.back()} style={{ background: '#f1f5f9', border: 'none', width: 40, height: 40, borderRadius: '50%', fontSize: 18, cursor: 'pointer', fontFamily: 'inherit' }}>→</button>
        <div style={{ flex: 1, fontSize: 15, fontWeight: 900, color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{service.title}</div>
      </div>

      {/* Image */}
      {service.image_url ? (
        <img src={service.image_url} alt={service.title} style={{ width: '100%', maxHeight: 280, objectFit: 'cover', background: '#f1f5f9' }} />
      ) : (
        <div style={{ height: 200, background: 'linear-gradient(135deg,#0f4d3a,#075640)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 72 }}>🛠️</div>
      )}

      {/* Info */}
      <div style={{ background: '#fff', padding: 16, marginBottom: 8 }}>
        <h1 style={{ fontSize: 20, fontWeight: 900, color: '#0f172a', marginBottom: 12, lineHeight: 1.4 }}>{service.title}</h1>

        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
          {service.is_featured && <span style={{ background: 'rgba(251,191,36,.15)', color: '#92400e', padding: '4px 10px', borderRadius: 6, fontSize: 11, fontWeight: 900 }}>⭐ مميزة</span>}
          <span style={{ background: 'rgba(16,185,129,.15)', color: '#10b981', padding: '4px 10px', borderRadius: 6, fontSize: 11, fontWeight: 800 }}>✓ منشورة</span>
        </div>

        {service.description && (
          <div style={{ padding: 12, background: '#f8fafc', borderRadius: 10, marginBottom: 12 }}>
            <div style={{ fontSize: 13, fontWeight: 900, color: '#0f172a', marginBottom: 6 }}>📝 التفاصيل</div>
            <p style={{ fontSize: 13, color: '#334155', lineHeight: 1.7, margin: 0 }}>{service.description}</p>
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {service.phone && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: 10, background: '#f8fafc', borderRadius: 10 }}>
              <span style={{ fontSize: 18 }}>📞</span>
              <span style={{ fontSize: 13, fontWeight: 800, direction: 'ltr', color: '#0f172a' }}>{service.phone}</span>
            </div>
          )}
          {service.address && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: 10, background: '#f8fafc', borderRadius: 10 }}>
              <span style={{ fontSize: 18 }}>📍</span>
              <span style={{ fontSize: 13, color: '#334155' }}>{service.address}</span>
            </div>
          )}
          {service.file_url && (
            <a href={service.file_url} target="_blank" rel="noopener" style={{ display: 'flex', alignItems: 'center', gap: 10, padding: 10, background: 'rgba(59,130,246,.1)', borderRadius: 10, textDecoration: 'none', color: '#3b82f6' }}>
              <span style={{ fontSize: 18 }}>📎</span>
              <span style={{ fontSize: 13, fontWeight: 800 }}>تحميل الملف المرفق</span>
            </a>
          )}
        </div>
      </div>

      {/* Store Card */}
      {store && (
        <Link href={`/store/${encodeURIComponent(store.display_name)}`} style={{ display: 'block', background: '#fff', padding: 16, marginBottom: 8, textDecoration: 'none', color: 'inherit' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {store.logo_url ? (
              <img src={store.logo_url} alt="" style={{ width: 56, height: 56, borderRadius: 12, objectFit: 'cover' }} />
            ) : (
              <div style={{ width: 56, height: 56, borderRadius: 12, background: 'linear-gradient(135deg,#0f4d3a,#075640)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26 }}>🏪</div>
            )}
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <span style={{ fontSize: 14, fontWeight: 900 }}>{store.display_name}</span>
                {store.is_verified && <span style={{ fontSize: 12 }}>✅</span>}
              </div>
              {store.city && <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>📍 {store.city}</div>}
            </div>
            <div style={{ fontSize: 12, color: '#10b981', fontWeight: 900 }}>زيارة ←</div>
          </div>
        </Link>
      )}

      {/* Reviews */}
      <div style={{ background: '#fff', padding: 16, marginBottom: 8 }}>
        <Reviews targetType="service" targetId={service.id} targetName={service.title} />
      </div>

      {/* Similar Services */}
      {similar.length > 0 && (
        <div style={{ background: '#fff', padding: 16 }}>
          <div style={{ fontSize: 15, fontWeight: 900, marginBottom: 12 }}>🛠️ خدمات مشابهة</div>
          <div style={{ display: 'flex', gap: 10, overflowX: 'auto', paddingBottom: 4 }}>
            {similar.map(s => (
              <Link key={s.id} href={`/service/${s.id}`} style={{ flexShrink: 0, width: 160, background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, overflow: 'hidden', textDecoration: 'none', color: 'inherit' }}>
                {s.image_url ? <img src={s.image_url} alt="" style={{ width: '100%', height: 100, objectFit: 'cover' }} /> : <div style={{ height: 100, background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32 }}>🛠️</div>}
                <div style={{ padding: 8 }}>
                  <div style={{ fontSize: 12, fontWeight: 900, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: 4 }}>{s.title}</div>
                  <div style={{ fontSize: 10, color: '#64748b' }}>🏪 {s.provider_name}</div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: '#fff', borderTop: '1px solid #e5e7eb', padding: 12, display: 'flex', gap: 10, boxShadow: '0 -4px 12px rgba(0,0,0,.05)' }}>
        <button onClick={call} disabled={!service.phone} style={{ flex: 1, padding: 14, background: 'rgba(59,130,246,.1)', color: '#3b82f6', border: '1px solid rgba(59,130,246,.3)', borderRadius: 12, fontSize: 13, fontWeight: 900, cursor: service.phone ? 'pointer' : 'not-allowed', fontFamily: 'inherit', opacity: service.phone ? 1 : 0.4 }}>📞 اتصال</button>
        <button onClick={whatsapp} disabled={!service.phone} style={{ flex: 1, padding: 14, background: 'linear-gradient(135deg,#25d366,#128c7e)', color: '#fff', border: 'none', borderRadius: 12, fontSize: 13, fontWeight: 900, cursor: service.phone ? 'pointer' : 'not-allowed', fontFamily: 'inherit', opacity: service.phone ? 1 : 0.4 }}>📱 واتساب</button>
      </div>
    </div>
  );
}
