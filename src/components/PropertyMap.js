'use client';
import { useEffect, useRef } from 'react';

export default function PropertyMap({ properties = [], height = 400 }) {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!mapRef.current) return;

    // تحميل CSS لـ Leaflet
    if (!document.getElementById('leaflet-css')) {
      const link = document.createElement('link');
      link.id = 'leaflet-css';
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(link);
    }

    // تحميل JS لـ Leaflet
    const loadLeaflet = () => {
      if (window.L) {
        initMap();
        return;
      }
      const script = document.createElement('script');
      script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
      script.onload = () => initMap();
      document.head.appendChild(script);
    };

    function initMap() {
      if (mapInstanceRef.current) return;

      // إنشاء الخريطة
      const map = window.L.map(mapRef.current).setView([36.157, 36.528], 12); // إدلب تقريباً

      // طبقة OpenStreetMap
      window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 19,
      }).addTo(map);

      mapInstanceRef.current = map;

      // إضافة العلامات (markers)
      const validProps = properties.filter(p => p.lat && p.lng);
      
      if (validProps.length > 0) {
        validProps.forEach(p => {
          const marker = window.L.marker([Number(p.lat), Number(p.lng)]).addTo(map);
          
          const price = Number(p.price || 0).toLocaleString();
          const img = p.images?.[0] || null;
          const imgHtml = img ? `<img src="${img}" style="width:100%;height:80px;object-fit:cover;border-radius:6px;margin-bottom:6px" />` : '';
          
          marker.bindPopup(`
            <div style="font-family: inherit; min-width: 180px; text-align: right; direction: rtl;">
              ${imgHtml}
              <div style="font-size: 13px; font-weight: 900; color: #0f172a; margin-bottom: 4px;">${p.title}</div>
              <div style="font-size: 11px; color: #64748b; margin-bottom: 4px;">${p.property_type} · ${p.deal_type}</div>
              <div style="font-size: 13px; font-weight: 900; color: #ea580c;">${price} ${p.currency || 'SYP'}</div>
              <a href="/realestate/${p.id}" style="display: block; margin-top: 8px; padding: 6px; background: #ea580c; color: #fff; text-align: center; text-decoration: none; border-radius: 6px; font-size: 11px; font-weight: 800;">عرض التفاصيل ←</a>
            </div>
          `);
        });

        // ضبط الخريطة لتشمل كل العلامات
        const bounds = validProps.map(p => [Number(p.lat), Number(p.lng)]);
        map.fitBounds(bounds, { padding: [30, 30], maxZoom: 14 });
      }
    }

    loadLeaflet();

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [properties]);

  return (
    <div style={{
      position: 'relative',
      height,
      borderRadius: 16,
      overflow: 'hidden',
      border: '1px solid #e5e7eb',
      background: '#f1f5f9',
    }}>
      <div ref={mapRef} style={{ width: '100%', height: '100%' }} />
      {properties.filter(p => p.lat && p.lng).length === 0 && (
        <div style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'rgba(255,255,255,.9)',
          fontSize: 13,
          color: '#64748b',
          fontWeight: 700,
          pointerEvents: 'none',
        }}>
          🗺️ لا توجد عقارات بمواقع محددة
        </div>
      )}
    </div>
  );
}
