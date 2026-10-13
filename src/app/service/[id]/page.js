'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

const iconFor = (v = '') => {
  const s = String(v).toLowerCase();
  if (/food|restaurant|مطعم|طعام/.test(s)) return '🍽️';
  if (/shop|store|market|متجر|سوق/.test(s)) return '🏪';
  if (/health|clinic|صحة|طبي|عياد|صيدل|أسنان/.test(s)) return '❤️';
  if (/edu|school|تعليم|مدرس|مدرسة/.test(s)) return '🎓';
  if (/transport|car|نقل|سيار|توصيل/.test(s)) return '🚚';
  if (/home|house|منزل|كهرب|سباك|صيانة/.test(s)) return '🏠';
  if (/craft|service|حرف|مهن|نجار|باطون|لياسة/.test(s)) return '🛠️';
  if (/mosque|جامع|مسجد/.test(s)) return '🕌';
  if (/charity|خير|تبرع|جمعية/.test(s)) return '🎁';
  if (/gov|بلدية|مجلس/.test(s)) return '🏢';
  return '✦';
};

export default function ServiceDetail() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id;

  const [service, setService] = useState(null);
  const [category, setCategory] = useState(null);
  const [similar, setSimilar] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    async function load() {
      if (!supabase || !id) { if (alive) setLoading(false); return; }
      try {
        const { data } = await supabase.from('services').select('*').eq('id', id).single();
        if (!alive) return;
        if (!data) { setLoading(false); return; }
        setService(data);
        if (data.category_id) {
          const [catRes, simRes] = await Promise.all([
            supabase.from('service_categories').select('*').eq('id', data.category_id).single(),
            supabase.from('services').select('*').eq('category_id', data.category_id).neq('id', id).limit(6),
          ]);
          if (!alive) return;
          if (catRes.data) setCategory(catRes.data);
          if (Array.isArray(simRes.data)) setSimilar(simRes.data);
        }
      } catch (e) {
        console.error('Detail load error:', e);
      } finally {
        if (alive) setLoading(false);
      }
    }
    load();
    return () => { alive = false; };
  }, [id]);

  if (loading) {
    return (
      <div className="detail-page">
        <div className="detail-cover">
          <div className="sk" style={{ height: '100%', borderRadius: 0 }} />
        </div>
        <div className="detail-body">
          <div className="sk detail-sk-line" style={{ width: '60%' }} />
          <div className="sk detail-sk-line" style={{ width: '40%' }} />
          <div className="sk detail-sk-line" style={{ width: '80%' }} />
        </div>
      </div>
    );
  }

  if (!service) {
    return (
      <div className="detail-notfound">
        <span className="em">🔍</span>
        <h2>الخدمة غير موجودة</h2>
        <p>ربما تم حذفها أو الرابط غير صحيح</p>
        <Link href="/" className="back-btn">العودة للرئيسية</Link>
      </div>
    );
  }

  const catName = category?.name || 'خدمة محلية';
  const telLink = service.phone ? `tel:${service.phone}` : null;
  const waLink = service.phone
    ? `https://wa.me/${String(service.phone).replace(/[^0-9]/g, '')}?text=${encodeURIComponent('مرحباً، أتواصل معكم عبر تطبيق سند بخصوص: ' + service.title)}`
    : null;

  const handleShare = async () => {
    const shareData = {
      title: service.title,
      text: service.description || service.title,
      url: typeof window !== 'undefined' ? window.location.href : '',
    };
    if (typeof navigator !== 'undefined' && navigator.share) {
      try { await navigator.share(shareData); } catch {}
    } else if (typeof navigator !== 'undefined' && navigator.clipboard) {
      try {
        await navigator.clipboard.writeText(shareData.url);
        alert('تم نسخ الرابط');
      } catch { alert('تعذّر النسخ'); }
    }
  };

  return (
    <div className="detail-page">

      <div className="detail-cover">
        {service.image_url && <img src={service.image_url} alt={service.title} />}
        <div className="detail-topbar">
          <button className="detail-topbar-btn" onClick={() => router.back()} aria-label="رجوع">→</button>
          <button className="detail-topbar-btn" onClick={handleShare} aria-label="مشاركة">↗</button>
        </div>
      </div>

      <div className="detail-body">

        <div className="detail-provider-row">
          <div className="detail-provider-logo">
            {service.image_url ? (
              <img src={service.image_url} alt={service.title} />
            ) : (
              <span>{iconFor(service.title)}</span>
            )}
          </div>
          <div className="detail-provider-meta">
            <h1 className="detail-title">
              <span>{service.title}</span>
              <span className="verified-badge">✓</span>
            </h1>
            <div className="detail-cat-row">
              <span className="badge-cat">{catName}</span>
              {service.is_featured && <span className="badge-feat">⭐ مميز</span>}
            </div>
          </div>
        </div>

        <div className="detail-actions">
          {telLink ? (
            <a href={telLink} className="detail-action-btn primary">
              <span className="ico">📞</span>
              <span>اتصال</span>
            </a>
          ) : (
            <div className="detail-action-btn" style={{ opacity: .4 }}>
              <span className="ico">📞</span>
              <span>اتصال</span>
            </div>
          )}

          {waLink ? (
            <a href={waLink} target="_blank" rel="noopener noreferrer" className="detail-action-btn">
              <span className="ico">💬</span>
              <span>واتساب</span>
            </a>
          ) : (
            <div className="detail-action-btn" style={{ opacity: .4 }}>
              <span className="ico">💬</span>
              <span>واتساب</span>
            </div>
          )}

          <button className="detail-action-btn" onClick={handleShare} type="button">
            <span className="ico">↗</span>
            <span>مشاركة</span>
          </button>

          <a
            href={service.address ? `https://maps.google.com/?q=${encodeURIComponent(service.address)}` : '#'}
            target="_blank"
            rel="noopener noreferrer"
            className="detail-action-btn"
            style={{ opacity: service.address ? 1 : .4, pointerEvents: service.address ? 'auto' : 'none' }}
          >
            <span className="ico">📍</span>
            <span>الاتجاهات</span>
          </a>
        </div>

        {service.description && (
          <div className="detail-section">
            <h3 className="detail-section-title">الوصف</h3>
            <div className="detail-card">
              <p className="detail-description">{service.description}</p>
            </div>
          </div>
        )}

        <div className="detail-section">
          <h3 className="detail-section-title">معلومات التواصل</h3>
          <div className="detail-info-grid">
            {service.provider_name && (
              <div className="detail-info-item">
                <div className="detail-info-icon">👤</div>
                <div className="detail-info-body">
                  <div className="detail-info-label">مقدم الخدمة</div>
                  <div className="detail-info-value">{service.provider_name}</div>
                </div>
              </div>
            )}
            {service.phone && (
              <a href={`tel:${service.phone}`} className="detail-info-item">
                <div className="detail-info-icon">📞</div>
                <div className="detail-info-body">
                  <div className="detail-info-label">الهاتف</div>
                  <div className="detail-info-value" style={{ direction: 'ltr', textAlign: 'right' }}>
                    {service.phone}
                  </div>
                </div>
              </a>
            )}
            {service.address && (
              <a
                href={`https://maps.google.com/?q=${encodeURIComponent(service.address)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="detail-info-item"
              >
                <div className="detail-info-icon">📍</div>
                <div className="detail-info-body">
                  <div className="detail-info-label">العنوان</div>
                  <div className="detail-info-value">{service.address}</div>
                </div>
              </a>
            )}
          </div>
        </div>

        {similar.length > 0 && (
          <div className="detail-section">
            <h3 className="detail-section-title">خدمات مشابهة</h3>
            <div className="similar-scroll">
              {similar.map((s) => (
                <Link key={s.id} href={`/service/${s.id}`} className="similar-card">
                  <div className="similar-logo">{iconFor(s.title)}</div>
                  <div className="similar-title">{s.title}</div>
                  <div className="similar-desc">{s.description || s.address || catName}</div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="detail-sticky">
        {telLink && (
          <a href={telLink} className="detail-sticky-btn outline" aria-label="اتصال">📞</a>
        )}
        {waLink ? (
          <a href={waLink} target="_blank" rel="noopener noreferrer" className="detail-sticky-btn solid">
            💬 تواصل عبر واتساب
          </a>
        ) : telLink ? (
          <a href={telLink} className="detail-sticky-btn solid">
            📞 اتصل الآن
          </a>
        ) : (
          <div className="detail-sticky-btn solid" style={{ opacity: .5, pointerEvents: 'none' }}>
            لا يوجد رقم تواصل
          </div>
        )}
      </div>
    </div>
  );
}
