'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

const FALLBACK_CATEGORIES = [
  { id: 'c1', name: 'المتاجر',           icon: '🏪' },
  { id: 'c2', name: 'الصحة',             icon: '❤️' },
  { id: 'c3', name: 'المساجد',           icon: '🕌' },
  { id: 'c4', name: 'المدارس والتعليم',  icon: '🎓' },
  { id: 'c5', name: 'النقل',             icon: '🚚' },
  { id: 'c6', name: 'الجمعيات الخيرية',  icon: '🎁' },
  { id: 'c7', name: 'الخدمات العامة',    icon: '🏢' },
];

export default function HomePage() {
  const [categories, setCategories]       = useState(FALLBACK_CATEGORIES);
  const [services, setServices]           = useState([]);
  const [featured, setFeatured]           = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [search, setSearch]               = useState('');
  const [activeTab, setActiveTab]         = useState('home');
  const [selected, setSelected]           = useState(null);
  const [loading, setLoading]             = useState(true);

  useEffect(() => {
    let mounted = true;

    async function load() {
      try {
        const [catRes, servRes, featRes, annRes] = await Promise.all([
          supabase.from('service_categories').select('*').eq('is_active', true).order('sort_order', { ascending: true }),
          supabase.from('services').select('*').order('created_at', { ascending: false }).limit(60),
          supabase.from('services').select('*').eq('is_featured', true).limit(8),
          supabase.from('announcements').select('*').order('created_at', { ascending: false }).limit(5),
        ]);

        if (!mounted) return;

        if (Array.isArray(catRes.data) && catRes.data.length > 0) {
          setCategories(catRes.data);
        }
        if (Array.isArray(servRes.data)) setServices(servRes.data);
        if (Array.isArray(featRes.data)) setFeatured(featRes.data);
        if (Array.isArray(annRes.data))  setAnnouncements(annRes.data);
      } catch (err) {
        console.error('Sanad load error:', err);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    load();
    return () => { mounted = false; };
  }, []);

  const filtered = services.filter((s) => {
    if (!search.trim()) return true;
    const q = search.trim().toLowerCase();
    return (
      (s.title || '').toLowerCase().includes(q) ||
      (s.description || '').toLowerCase().includes(q) ||
      (s.provider_name || '').toLowerCase().includes(q) ||
      (s.address || '').toLowerCase().includes(q) ||
      (s.category || '').toLowerCase().includes(q)
    );
  });

  const firstAnnouncement = announcements[0];

  return (
    <div className="container-main">

      {/* شريط الإعلان العلوي */}
      {firstAnnouncement && (
        <div className="alert-banner">
          📢 {firstAnnouncement.title || 'قيد التطوير، نراكم قريباً'}
        </div>
      )}

      {/* رأس الصفحة */}
      <header className="hero">
        <div className="location-pill">
          <span>📍</span>
          <span>كنصفرة — ريف إدلب</span>
        </div>

        <h1 className="hero-title">سند</h1>
        <p className="hero-sub">نضع جميع الخدمات بين يديك</p>

        <div className="hero-actions">
          <button
            className="btn-gold"
            onClick={() => document.getElementById('cats')?.scrollIntoView({ behavior: 'smooth' })}
          >
            🧭 تصفح الأقسام
          </button>
          <button
            className="btn-sos-hero"
            onClick={() => alert('خدمة الطوارئ قيد التطوير')}
          >
            🚨 طوارئ
          </button>
        </div>
      </header>

      {/* الأقسام */}
      <div className="cats-grid" id="cats">
        {categories.slice(0, 7).map((c) => (
          <button
            key={c.id}
            className="cat-card"
            onClick={() => {
              setSearch(c.name);
              document.getElementById('entities')?.scrollIntoView({ behavior: 'smooth' });
            }}
          >
            <span className="cat-icon">{c.icon || '📦'}</span>
            <span>{c.name}</span>
          </button>
        ))}
      </div>

      {/* البحث */}
      <div className="search-wrap">
        <input
          className="search-input"
          type="text"
          placeholder="ابحث عن خدمة أو متجر..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* عروض اليوم */}
      {(featured.length > 0 || services.length > 0) && (
        <section className="section">
          <div className="section-head">
            <span className="icon">🏷️</span>
            <span>عروض اليوم</span>
          </div>
          <div className="deals-row">
            {(featured.length > 0 ? featured : services.slice(0, 5)).map((s) => (
              <div
                key={s.id}
                className="deal-card"
                onClick={() => setSelected(s)}
              >
                <span className="tag">عرض</span>
                <div style={{ fontWeight: 800, fontSize: 14, marginBottom: 6 }}>
                  {s.title}
                </div>
                <div style={{ fontSize: 12, opacity: 0.85 }}>
                  {s.provider_name || s.category || ''}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* الجهات والمتاجر */}
      <section className="section" id="entities">
        <div className="section-head">
          <span>🏪</span>
          <span>الجهات والمتاجر</span>
        </div>

        {loading && <div className="empty">جارٍ التحميل...</div>}

        {!loading && filtered.length === 0 && (
          <div className="empty">لا توجد نتائج حالياً</div>
        )}

        {!loading && filtered.map((s) => (
          <div
            key={s.id}
            className="entity-card"
            onClick={() => setSelected(s)}
          >
            <div className="entity-logo">
              {s.image_url ? (
                <img src={s.image_url} alt={s.title || ''} />
              ) : (
                (s.title || '؟').trim().charAt(0)
              )}
            </div>
            <div className="entity-info">
              <div className="entity-name">
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {s.title}
                </span>
                <span className="verified">✓</span>
              </div>
              <div className="entity-desc">
                {s.description || s.address || s.category || ''}
              </div>
            </div>
          </div>
        ))}
      </section>

      {/* الأخبار */}
      {announcements.length > 0 && (
        <section className="section">
          <div className="section-head">
            <span>📰</span>
            <span>أخبار المنطقة</span>
          </div>
          <div className="news-card">
            <div className="news-title">{announcements[0].title}</div>
            <div className="news-body">
              {announcements[0].body || announcements[0].content || announcements[0].description || ''}
            </div>
          </div>
        </section>
      )}

      {/* تواصل مع الإدارة */}
      <div className="contact-admin" onClick={() => alert('سيتم فتح نموذج التواصل قريباً')}>
        <span>📞</span>
        <span>تواصل مع الإدارة</span>
      </div>

      {/* زر SOS العائم */}
      <button
        className="sos-float"
        onClick={() => alert('خدمة SOS قيد التطوير')}
        aria-label="طوارئ"
      >
        SOS
      </button>

      {/* شريط التنقل السفلي */}
      <nav className="bottom-nav">
        <button
          className={`nav-item ${activeTab === 'home' ? 'active' : ''}`}
          onClick={() => setActiveTab('home')}
        >
          <span className="nav-icon">🏠</span>
          <span>الرئيسية</span>
        </button>
        <button
          className={`nav-item ${activeTab === 'cats' ? 'active' : ''}`}
          onClick={() => {
            setActiveTab('cats');
            document.getElementById('cats')?.scrollIntoView({ behavior: 'smooth' });
          }}
        >
          <span className="nav-icon">▦</span>
          <span>الأقسام</span>
        </button>
        <button
          className={`nav-item ${activeTab === 'cart' ? 'active' : ''}`}
          onClick={() => setActiveTab('cart')}
        >
          <span className="nav-icon">🛒</span>
          <span>السلة</span>
        </button>
        <button
          className={`nav-item ${activeTab === 'orders' ? 'active' : ''}`}
          onClick={() => setActiveTab('orders')}
        >
          <span className="nav-icon">📋</span>
          <span>طلباتي</span>
        </button>
        <button
          className={`nav-item ${activeTab === 'account' ? 'active' : ''}`}
          onClick={() => setActiveTab('account')}
        >
          <span className="nav-icon">⚙️</span>
          <span>لوحتي</span>
        </button>
      </nav>

      {/* نافذة تفاصيل الخدمة */}
      {selected && (
        <div className="modal-overlay" onClick={() => setSelected(null)}>
          <div className="modal-sheet" onClick={(e) => e.stopPropagation()}>
            <div className="modal-title">{selected.title}</div>
            {selected.provider_name && (
              <div className="modal-meta">مقدم الخدمة: {selected.provider_name}</div>
            )}
            {selected.address && (
              <div className="modal-meta">العنوان: {selected.address}</div>
            )}
            {selected.description && (
              <div className="modal-desc">{selected.description}</div>
            )}
            {selected.phone && (
              <a href={`tel:${selected.phone}`} className="modal-call">
                📞 اتصال
              </a>
            )}
            <button className="modal-close" onClick={() => setSelected(null)}>
              إغلاق
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
