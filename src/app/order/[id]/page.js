'use client';
import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

const STATUS_MAP = {
  pending: { label: 'قيد المراجعة', color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' },
  confirmed: { label: 'تم القبول', color: '#3b82f6', bg: 'rgba(59,130,246,0.1)' },
  preparing: { label: 'قيد التجهيز', color: '#8b5cf6', bg: 'rgba(139,92,246,0.1)' },
  shipped: { label: 'في الطريق', color: '#0ea5e9', bg: 'rgba(14,165,233,0.1)' },
  delivered: { label: 'تم التوصيل', color: '#10b981', bg: 'rgba(16,185,129,0.1)' },
  cancelled: { label: 'ملغي', color: '#ef4444', bg: 'rgba(239,68,68,0.1)' },
};

export default function OrderDetailsPage() {
  const { id } = useParams();
  const router = useRouter();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadOrder() {
      if (!supabase || !id) return;
      try {
        const { data, error } = await supabase
          .from('orders')
          .select('*')
          .eq('master_order_id', id)
          .order('created_at', { ascending: false });

        if (error) throw error;
        setOrders(data || []);
      } catch (err) {
        console.error('Error loading order:', err);
      } finally {
        setLoading(false);
      }
    }
    loadOrder();
  }, [id]);

  if (loading) {
    return <div style={{ padding: 80, textAlign: 'center', fontWeight: 900 }}>⏳ جارٍ تحميل تفاصيل الطلب...</div>;
  }

  if (orders.length === 0) {
    return (
      <div style={{ padding: 40, textAlign: 'center' }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>🤔</div>
        <h2 style={{ fontSize: 18, fontWeight: 900 }}>لم يتم العثور على الطلب</h2>
        <p style={{ color: '#64748b', fontSize: 14 }}>تأكد من الرابط أو تواصل مع الدعم.</p>
        <Link href="/" style={{ display: 'inline-block', marginTop: 20, padding: '12px 24px', background: '#0f4d3a', color: '#fff', borderRadius: 10, textDecoration: 'none', fontWeight: 900 }}>العودة للرئيسية</Link>
      </div>
    );
  }

  const grandTotal = orders.reduce((sum, order) => sum + (Number(order.total) || 0), 0);
  const currency = orders[0]?.currency || 'SYP';

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', paddingBottom: 40 }}>
      
      {/* رسالة النجاح */}
      <div style={{ background: 'linear-gradient(135deg, #10b981, #059669)', padding: '40px 20px 60px', textAlign: 'center', color: '#fff', borderBottomLeftRadius: 30, borderBottomRightRadius: 30, position: 'relative' }}>
        <div style={{ width: 80, height: 80, background: 'rgba(255,255,255,0.2)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', fontSize: 40 }}>🎉</div>
        <h1 style={{ fontSize: 24, fontWeight: 900, marginBottom: 8 }}>شكراً لك!</h1>
        <p style={{ fontSize: 14, opacity: 0.9 }}>تم استلام طلبك بنجاح وسيتم التواصل معك قريباً.</p>
        <div style={{ marginTop: 16, background: 'rgba(0,0,0,0.2)', display: 'inline-block', padding: '8px 16px', borderRadius: 20, fontSize: 12, fontWeight: 800 }}>
          رقم الفاتورة: {id.slice(0, 8)}...
        </div>
      </div>

      <div style={{ padding: 16, marginTop: -30 }}>
        
        {/* ملخص سريع */}
        <div style={{ background: '#fff', borderRadius: 20, padding: 20, boxShadow: '0 4px 20px rgba(0,0,0,0.05)', marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: 12, color: '#64748b', fontWeight: 800 }}>الإجمالي المدفوع</div>
            <div style={{ fontSize: 20, color: '#0f4d3a', fontWeight: 900 }}>{grandTotal.toLocaleString()} {currency}</div>
          </div>
          <div style={{ textAlign: 'left' }}>
            <div style={{ fontSize: 12, color: '#64748b', fontWeight: 800 }}>عدد المتاجر</div>
            <div style={{ fontSize: 16, color: '#0f172a', fontWeight: 900 }}>{orders.length} متجر</div>
          </div>
        </div>

        {/* تفاصيل الطلبات لكل متجر */}
        {orders.map((order) => {
          const status = STATUS_MAP[order.status] || STATUS_MAP.pending;
          const items = Array.isArray(order.items) ? order.items : [];
          
          const waLink = order.provider_phone 
            ? `https://wa.me/${order.provider_phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(`مرحباً، بخصوص طلبي رقم ${order.order_code} من منصة سند.`)}`
            : null;

          return (
            <div key={order.id} style={{ background: '#fff', borderRadius: 20, padding: 16, marginBottom: 16, border: '1px solid #e2e8f0' }}>
              
              {/* هيدر المتجر والحالة */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, paddingBottom: 12, borderBottom: '1px solid #f1f5f9' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  {order.provider_logo ? (
                    <img src={order.provider_logo} alt="" style={{ width: 32, height: 32, borderRadius: 8, objectFit: 'cover' }} />
                  ) : (
                    <div style={{ width: 32, height: 32, borderRadius: 8, background: '#0f4d3a', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>🏪</div>
                  )}
                  <div style={{ fontSize: 14, fontWeight: 900, color: '#0f172a' }}>{order.provider_name}</div>
                </div>
                <div style={{ background: status.bg, color: status.color, padding: '4px 10px', borderRadius: 10, fontSize: 11, fontWeight: 900 }}>
                  {status.label}
                </div>
              </div>

              {/* المنتجات */}
              <div style={{ marginBottom: 16 }}>
                {items.map((item, idx) => (
                  <div key={idx} style={{ display: 'flex', gap: 10, marginBottom: 10 }}>
                    {item.image ? (
                      <img src={item.image} alt="" style={{ width: 48, height: 48, borderRadius: 8, objectFit: 'cover', border: '1px solid #e2e8f0' }} />
                    ) : (
                      <div style={{ width: 48, height: 48, borderRadius: 8, background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>📦</div>
                    )}
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 800, color: '#1e293b' }}>{item.title}</div>
                      <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>{item.qty} × {item.price.toLocaleString()} {order.currency}</div>
                    </div>
                  </div>
                ))}
              </div>

              {/* خريطة التتبع الحي */}
              {order.status === 'shipped' && order.driver_lat && order.driver_lng && (
                <div style={{ marginBottom: 16, borderRadius: 16, overflow: 'hidden', border: '1px solid #e2e8f0' }}>
                  <div style={{ background: '#0ea5e9', color: '#fff', padding: '10px 14px', fontSize: 12, fontWeight: 900, display: 'flex', alignItems: 'center', gap: 6 }}>
                    🚚 السائق {order.driver_name || 'في الطريق'} متجه إليك الآن
                  </div>
                  <LiveMap lat={order.driver_lat} lng={order.driver_lng} />
                </div>
              )}

              {/* المجاميع */}
              <div style={{ background: '#f8fafc', borderRadius: 10, padding: 12, marginBottom: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4, color: '#64748b' }}>
                  <span>المجموع الفرعي</span>
                  <span>{Number(order.subtotal).toLocaleString()} {order.currency}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#64748b' }}>
                  <span>التوصيل</span>
                  <span>{Number(order.delivery_fee || 0).toLocaleString()} {order.currency}</span>
                </div>
              </div>

              {/* زر التواصل */}
              {waLink && (
                <a href={waLink} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, width: '100%', padding: '12px', background: 'rgba(37,211,102,0.1)', color: '#25D366', border: '1px solid rgba(37,211,102,0.3)', borderRadius: 10, textDecoration: 'none', fontSize: 13, fontWeight: 900 }}>
                  💬 تواصل مع المتجر عبر واتساب
                </a>
              )}
            </div>
          );
        })}

        {/* زر العودة للتسوق */}
        <Link href="/" style={{ display: 'block', width: '100%', padding: 16, background: '#0f4d3a', color: '#fff', textAlign: 'center', borderRadius: 14, textDecoration: 'none', fontWeight: 900, fontSize: 15, marginTop: 16 }}>
          مواصلة التسوق
        </Link>
      </div>
    </div>
  );
}

// ─── مكوّن الخريطة ────────────────────────────────────────────────────────────
function LiveMap({ lat, lng }) {
  const mapRef = useRef(null);
  const mapInstance = useRef(null);

  useEffect(() => {
    if (typeof window === 'undefined' || !mapRef.current || mapInstance.current) return;

    // استيراد Leaflet ديناميكياً
    import('leaflet').then((L) => {
      // إصلاح أيقونة Leaflet (مشكلة شهيرة في Next.js)
      delete L.Icon.Default.prototype._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      });

      const map = L.map(mapRef.current).setView([lat, lng], 15);
      mapInstance.current = map;

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap',
        maxZoom: 19,
      }).addTo(map);

      L.marker([lat, lng]).addTo(map)
        .bindPopup('موقع السائق الحالي')
        .openPopup();
    });

    return () => {
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
      }
    };
  }, [lat, lng]);

  return (
    <div ref={mapRef} style={{ height: 250, width: '100%', zIndex: 1 }}></div>
  );
}
