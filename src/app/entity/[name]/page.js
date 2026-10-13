'use client';

// Safe date for hydration
const __safeDate = (d) => (typeof window !== 'undefined' ? __safeDate(d) : __safeDate(0));

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import Reviews from '@/components/Reviews';
import { startThread, getCustomerName } from '@/lib/chat';
import { useRouter } from 'next/navigation';

const TYPE_LABELS = {
  merchant: { icon:'🏪', label:'متجر', path:'' },
  restaurant: { icon:'🍽️', label:'مطعم', path:'' },
  doctor: { icon:'👨‍⚕️', label:'طبيب', path:'' },
  pharmacy: { icon:'💊', label:'صيدلية', path:'' },
  school: { icon:'🏫', label:'مدرسة', path:'/school' },
  mosque: { icon:'🕌', label:'جامع', path:'/mosque' },
  council: { icon:'🏛️', label:'مجلس', path:'' },
  municipality: { icon:'🏢', label:'بلدية', path:'' },
  charity: { icon:'🤝', label:'جمعية', path:'' },
  sports: { icon:'⚽', label:'نادي', path:'/club' },
  memory: { icon:'📸', label:'ذاكرة', path:'/memory' },
  office: { icon:'📁', label:'مكتب', path:'' },
  transport: { icon:'🚗', label:'مواصلات', path:'' },
};

export default function EntityPage() {
  const params = useParams();
  const router = useRouter();
  const name = decodeURIComponent(params?.name || '');
  const [entity, setEntity] = useState(null);
  const [services, setServices] = useState([]);
  const [products, setProducts] = useState([]);
  const [tab, setTab] = useState('services');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!name) return;
    async function load() {
      if (!supabase) { setLoading(false); return; }
      const [e, s, p] = await Promise.all([
        supabase.from('entities').select('*').eq('display_name', name).maybeSingle(),
        supabase.from('services').select('*').eq('provider_name', name),
        supabase.from('products').select('*').eq('provider_name', name),
      ]);
      setEntity(e.data);
      setServices(Array.isArray(s.data) ? s.data : []);
      setProducts(Array.isArray(p.data) ? p.data : []);
      setLoading(false);
    }
    load();
  }, [name]);

  if (loading) return <div className="sect-empty" style={{ padding: 80 }}><span className="em">⏳</span></div>;
  if (!entity) return (
    <div className="sect-empty" style={{ padding: 80 }}>
      <span className="em">🔍</span>
      <p>الكيان غير موجود</p>
      <Link href="/" className="merchant-empty-btn" style={{ marginTop: 16 }}>الرئيسية</Link>
    </div>
  );

  const cfg = TYPE_LABELS[entity.entity_type] || TYPE_LABELS.merchant;

  return (
    <div className="ent-page">
      <header className="ent-hero">
        <div className="ent-hero-inner">
          <div className="ent-topbar">
            <Link href="/" className="ent-back">→</Link>
            <span style={{ letterSpacing: 3, fontSize: 11, fontWeight: 800, opacity: .6 }}>ENTITY</span>
          </div>
          <div className="ent-identity">
            <div className="ent-logo">
              {entity.logo_url ? <img src={entity.logo_url} alt="" /> : cfg.icon}
            </div>
            <div>
              <h1 className="ent-name">{entity.display_name}</h1>
              <span className="ent-type-chip">{cfg.icon} {cfg.label}</span>
            </div>
          </div>
          {entity.bio && (
            <p style={{ marginTop: 14, fontSize: 13, color: 'rgba(255,255,255,.7)', lineHeight: 1.7, fontWeight: 500 }}>
              {entity.bio}
            </p>
          )}
        </div>
      </header>

      <div className="ent-contact">
        {entity.phone && (
          <a href={`tel:${entity.phone}`} className="ent-contact-btn">
            <span className="ent-contact-icon">📞</span>
            <span>اتصال</span>
          </a>
        )}
        {entity.phone && (
          <a href={`https://wa.me/${String(entity.phone).replace(/[^0-9]/g, '')}`} target="_blank" rel="noopener noreferrer" className="ent-contact-btn">
            <span className="ent-contact-icon">💬</span>
            <span>واتساب</span>
          </a>
        )}
        <button
          className="ent-contact-btn"
          onClick={() => {
            const url = window.location.href;
            if (navigator.share) navigator.share({ title: entity.display_name, url });
            else { navigator.clipboard?.writeText(url); alert('تم نسخ الرابط'); }
          }}
          type="button"
        >
          <span className="ent-contact-icon">↗</span>
          <span>مشاركة</span>
        </button>
      </div>

      <div className="ent-tabs">
        {services.length > 0 && (
          <button className={`ent-tab ${tab === 'services' ? 'active' : ''}`} onClick={() => setTab('services')} type="button">
            🛠️ الخدمات ({services.length})
          </button>
        )}
        {products.length > 0 && (
          <button className={`ent-tab ${tab === 'products' ? 'active' : ''}`} onClick={() => setTab('products')} type="button">
            📦 المنتجات ({products.length})
          </button>
        )}
        <button className={`ent-tab ${tab === 'reviews' ? 'active' : ''}`} onClick={() => setTab('reviews')} type="button">
          ⭐ التقييمات
        </button>
      </div>

      <div style={{ padding: '0 20px 40px' }}>
        {tab === 'services' && (
          services.length === 0 ? (
            <div className="sect-empty"><span className="em">🛠️</span><p>لا توجد خدمات</p></div>
          ) : (
            services.map((s) => (
              <Link key={s.id} href={`/service/${s.id}`} className="entity entity-card" style={{ marginBottom: 10, display: 'flex', textDecoration: 'none' }}>
                <div className="entity-logo">
                  {s.image_url ? <img src={s.image_url} alt="" /> : '🛠️'}
                </div>
                <div className="entity-info">
                  <div className="entity-name"><span className="txt">{s.title}</span></div>
                  <div className="entity-desc">{s.description || s.address || ''}</div>
                </div>
              </Link>
            ))
          )
        )}

        {tab === 'products' && (
          <div className="store-grid">
            {products.map((p) => {
              const price = Number(p.price) || 0;
              const disc = Number(p.discount_percent) || 0;
              const finalPrice = Math.round(price - (price * disc / 100));
              return (
                <div key={p.id} className="store-card">
                  <div className="store-card-img">
                    {disc > 0 && <span className="prod-discount-badge">-{disc}%</span>}
                    {p.image_url ? <img src={p.image_url} alt="" /> : <div className="store-card-ph">📦</div>}
                  </div>
                  <div className="store-card-body">
                    <div className="store-card-name">{p.title}</div>
                    <div className="store-card-price">
                      <span className="final">{finalPrice.toLocaleString()}</span>
                      {disc > 0 && <span className="old">{price.toLocaleString()}</span>}
                      <span className="cur">{p.currency || 'SYP'}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {tab === 'reviews' && (
          <Reviews targetType="entity" targetId={entity.id} targetName={entity.display_name} />
        )}
      </div>
    </div>
  );
}
