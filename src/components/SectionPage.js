'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { getSectionConfig } from '@/lib/sectionConfigs';

const ICON_MAP = {
  'معلم أثري': '🏛️', 'طبيعة': '🌲', 'مطعم': '🍽️', 'فندق': '🏨', 'متحف': '🏛️',
  'مساعدة منزلية': '🏠', 'مرافق للمستشفى': '🏥', 'توصيل أدوية': '💊', 'قراءة وثائق': '📄', 'دعم نفسي': '💚',
  'دفع فاتورة': '💳', 'توصيل هدية': '🎁', 'دفع رسوم مدارس': '🎓', 'دعم مشروع': '💼',
  'شقة': '🏢', 'منزل': '🏠', 'أرض': '🌍', 'محل تجاري': '🏪', 'مكتب': '💼', 'مخزن': '📦',
  'مفقود': '🔍', 'وجدته': '✋',
  'دوام كامل': '⏰', 'دوام جزئي': '🕐', 'عن بعد': '💻', 'مؤقت': '⏳', 'تدريب': '🎓',
};

export default function SectionPage({ sectionKey }) {
  const cfg = getSectionConfig(sectionKey);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (!cfg) return;
    async function load() {
      if (!supabase) { setLoading(false); return; }
      const { data } = await supabase.from(cfg.table).select('*').order('created_at', { ascending: false }).limit(100);
      setItems(Array.isArray(data) ? data : []);
      setLoading(false);
    }
    load();
  }, [cfg]);

  if (!cfg) return <div className="sect-empty"><span className="em">❌</span><p>القسم غير موجود</p></div>;

  const filtered = items.filter((it) => {
    if (!search.trim()) return true;
    const q = search.trim().toLowerCase();
    return Object.values(it).some((v) => String(v || '').toLowerCase().includes(q));
  });

  const iconFor = (it) => {
    const v = it[cfg.iconField] || '';
    return ICON_MAP[v] || cfg.icon;
  };

  return (
    <div className="sect-page">
      <header className="sect-hero" style={{ background: cfg.heroBg }}>
        <div className="sect-hero-inner">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
            <Link href="/" style={{ color: '#fff', fontSize: 22, textDecoration: 'none' }}>→</Link>
            <span style={{ letterSpacing: 3, fontSize: 11, fontWeight: 800, opacity: .7 }}>{sectionKey.toUpperCase()}</span>
          </div>
          <h1 className="sect-title">{cfg.icon} {cfg.title}</h1>
          <p className="sect-sub">{cfg.subtitle} · {items.length} عنصر</p>
        </div>
      </header>

      <div style={{ padding: '18px 20px 0' }}>
        <input
          className="new-service-input"
          type="text"
          placeholder="ابحث..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {loading ? (
        <div className="sect-empty"><span className="em">⏳</span><p>جارٍ التحميل...</p></div>
      ) : filtered.length === 0 ? (
        <div className="sect-empty">
          <span className="em">{cfg.icon}</span>
          <p>{search ? 'لا توجد نتائج مطابقة' : 'لا توجد عناصر بعد'}</p>
        </div>
      ) : (
        <div className="sect-list">
          {filtered.map((it) => {
            const img = it.image_url || it.cover_url || (Array.isArray(it.images) ? it.images[0] : null);
            const price = it.price || it.current_price || it.entry_price;
            const currency = it.currency || 'SYP';
            return (
              <div key={it.id} className="sect-card">
                <div className="sect-card-img">
                  {img ? <img src={img} alt="" /> : <span>{iconFor(it)}</span>}
                </div>
                <div className="sect-card-body">
                  <div className="sect-card-title">{it.title || it.place_name || it.service_type || it.property_type}</div>
                  {it.description && <div className="sect-card-desc">{it.description}</div>}
                  <div className="sect-card-meta">
                    {it.author && <span>✍️ {it.author}</span>}
                    {it.location_text && <span>📍 {it.location_text}</span>}
                    {it.category && <span>📁 {it.category}</span>}
                    {it.rooms && <span>🛏️ {it.rooms} غرف</span>}
                    {it.area_m2 && <span>📏 {it.area_m2} م²</span>}
                    {it.year && <span>📅 {it.year}</span>}
                    {it.employer_name && <span>🏢 {it.employer_name}</span>}
                    {it.reporter_name && <span>👤 {it.reporter_name}</span>}
                    {it.status && <span>📊 {it.status}</span>}
                  </div>
                  {price > 0 && (
                    <div className="sect-card-price">{Number(price).toLocaleString()} {currency}</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Link href={`/merchant/${sectionKey}/new`} className="sect-add-fab" aria-label="إضافة">+</Link>
    </div>
  );
}
