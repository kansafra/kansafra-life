"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabase";

const fallbackCategories = [
  { id: "all", name: "الكل", slug: "all", icon: "✳️" },
  { id: "shops", name: "متاجر", slug: "shops", icon: "🛍️" },
  { id: "food", name: "مطاعم", slug: "food", icon: "🍽️" },
  { id: "health", name: "الصحة", slug: "health", icon: "🩺" },
  { id: "crafts", name: "حِرف وخدمات", slug: "crafts", icon: "🛠️" },
  { id: "education", name: "تعليم", slug: "education", icon: "📚" },
  { id: "transport", name: "نقل", slug: "transport", icon: "🚗" },
  { id: "home", name: "للمنزل", slug: "home", icon: "🏠" },
  { id: "other", name: "خدمات أخرى", slug: "other", icon: "✨" },
];

const iconFor = (value = "") => {
  const s = String(value).toLowerCase();
  if (/food|restaurant|مطعم|طعام|مأكول/.test(s)) return "🍽️";
  if (/shop|store|market|متجر|سوق|تسوق/.test(s)) return "🛍️";
  if (/health|clinic|medical|صحة|طبي|عياد|صيدل/.test(s)) return "🩺";
  if (/education|school|تعليم|مدرس|دروس/.test(s)) return "📚";
  if (/transport|car|نقل|سيار|توصيل/.test(s)) return "🚗";
  if (/home|house|منزل|كهرب|سباك|صيانة/.test(s)) return "🏠";
  if (/craft|service|حرف|خدمات|مهن/.test(s)) return "🛠️";
  return "✨";
};

export default function HomePage() {
  const [categories, setCategories] = useState(fallbackCategories);
  const [services, setServices] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  const [selectedService, setSelectedService] = useState(null);
  const [activeTab, setActiveTab] = useState("home");
  const [loading, setLoading] = useState(true);
  const [dbNotice, setDbNotice] = useState(false);

  useEffect(() => {
    let alive = true;

    async function loadData() {
      if (!supabase) {
        if (alive) {
          setLoading(false);
          setDbNotice(true);
        }
        return;
      }

      const [categoryResult, serviceResult, announcementResult] = await Promise.all([
        supabase
          .from("service_categories")
          .select("id,name,slug,description,icon,sort_order,is_active")
          .eq("is_active", true)
          .order("sort_order", { ascending: true }),
        supabase
          .from("services")
          .select("id,category_id,title,description,provider_name,phone,address,image_url,status,is_featured,created_at")
          .order("created_at", { ascending: false })
          .limit(60),
        supabase
          .from("announcements")
          .select("id,title,body,type,image_url,is_published,published_at,created_at")
          .eq("is_published", true)
          .order("published_at", { ascending: false, nullsFirst: false })
          .limit(5),
      ]);

      if (!alive) return;

      if (categoryResult.data?.length) {
        setCategories([
          fallbackCategories[0],
          ...categoryResult.data.map((c) => ({
            ...c,
            icon: c.icon || iconFor(c.name),
          })),
        ]);
      }
      if (serviceResult.data) setServices(serviceResult.data);
      if (announcementResult.data) setAnnouncements(announcementResult.data);

      setDbNotice(Boolean(categoryResult.error || serviceResult.error || announcementResult.error));
      setLoading(false);
    }

    loadData();
    return () => {
      alive = false;
    };
  }, []);

  const visibleServices = useMemo(() => {
    const q = search.trim().toLocaleLowerCase("ar");
    return services.filter((service) => {
      const category = categories.find((c) => c.id === service.category_id);
      const categoryMatch =
        activeCategory === "all" ||
        service.category_id === activeCategory ||
        category?.slug === activeCategory;
      const text = [
        service.title,
        service.description,
        service.provider_name,
        service.address,
        category?.name,
      ].filter(Boolean).join(" ").toLocaleLowerCase("ar");
      return categoryMatch && (!q || text.includes(q));
    });
  }, [services, categories, search, activeCategory]);

  const featured = visibleServices.filter((item) => item.is_featured).slice(0, 4);
  const latest = visibleServices.slice(0, 8);
  const categoryName = (id) => categories.find((c) => c.id === id)?.name || "خدمة محلية";

  function goTo(id) {
    setActiveTab(id);
    const target = document.getElementById(id === "home" ? "home" : id === "news" ? "news" : "services");
    target?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <main className="app-shell" id="home">
      <header className="topbar">
        <a className="brand" href="#home" aria-label="سند - الرئيسية">
          <span className="brand-mark">س</span>
          <span className="brand-copy">
            <strong>سند</strong>
            <small>خدماتك أقرب</small>
          </span>
        </a>
        <div className="topbar-actions">
          <span className="location-pill"><span className="live-dot" /> مجتمعك، أقرب إليك</span>
          <button className="icon-button" type="button" aria-label="الإشعارات" onClick={() => goTo("news")}>♧</button>
        </div>
      </header>

      <section className="welcome-section">
        <div className="welcome-copy">
          <span className="eyebrow"><span className="eyebrow-dot" /> أهلاً بك في سند</span>
          <h1>كل ما تحتاجه،<br /><span>بمكان واحد.</span></h1>
          <p>اكتشف الخدمات والمتاجر القريبة منك بكل سهولة.</p>
        </div>
        <div className="welcome-art" aria-hidden="true">
          <div className="art-halo" />
          <div className="art-card art-card-back">✦</div>
          <div className="art-main"><span className="art-check">✓</span><strong>سند</strong><small>معك بكل خطوة</small></div>
          <span className="art-spark spark-one">✦</span>
          <span className="art-spark spark-two">✧</span>
        </div>
      </section>

      <section className="search-section" aria-label="البحث عن الخدمات">
        <label className="search-box">
          <span className="search-icon">⌕</span>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="شو عم تدور عليه؟"
            aria-label="ابحث عن خدمة أو متجر"
          />
          {search && <button type="button" className="clear-search" onClick={() => setSearch("")} aria-label="مسح البحث">×</button>}
          <span className="search-shortcut">بحث</span>
        </label>
        <div className="search-hint"><span>✦</span> اكتب اسم الخدمة أو المتجر أو نوع الخدمة</div>
      </section>

      <section className="section-block category-block" id="categories">
        <div className="section-heading">
          <div><span className="section-kicker">اكتشف</span><h2>تصفّح الأقسام</h2></div>
          <span className="section-count">{Math.max(categories.length - 1, 0)} أقسام</span>
        </div>
        <div className="category-list">
          {categories.map((category) => {
            const selected = activeCategory === category.id || (activeCategory === "all" && category.id === "all");
            return (
              <button
                key={category.id}
                type="button"
                className={`category-item ${selected ? "category-active" : ""}`}
                onClick={() => {
                  setActiveCategory(category.id === "all" ? "all" : category.id);
                  setActiveTab("services");
                }}
              >
                <span className="category-icon">{category.icon || iconFor(category.name)}</span>
                <span className="category-name">{category.name}</span>
              </button>
            );
          })}
        </div>
      </section>

      {announcements.length > 0 && (
        <section className="announcement-wrap" id="news">
          <div className="announcement-label"><span className="announcement-pulse" /> جديد مجتمعك</div>
          <div className="announcement-list">
            {announcements.slice(0, 2).map((item) => (
              <article className="announcement-card" key={item.id}>
                <span className="announcement-icon">📣</span>
                <div><strong>{item.title}</strong><p>{item.body}</p></div>
              </article>
            ))}
          </div>
        </section>
      )}

      {featured.length > 0 && !search && activeCategory === "all" && (
        <section className="section-block" id="featured">
          <div className="section-heading">
            <div><span className="section-kicker">اختيارات مميزة</span><h2>خدمات ننصحك بها</h2></div>
            <button className="text-link" onClick={() => goTo("services")} type="button">عرض الكل <span>←</span></button>
          </div>
          <div className="featured-grid">
            {featured.map((service) => (
              <ServiceCard key={service.id} service={service} category={categoryName(service.category_id)} onOpen={setSelectedService} featured />
            ))}
          </div>
        </section>
      )}

      <section className="section-block services-block" id="services">
        <div className="section-heading">
          <div><span className="section-kicker">{search ? "نتائج البحث" : "قريب منك"}</span><h2>{search ? "الخدمات المطابقة" : "أحدث الخدمات"}</h2></div>
          <span className="section-count">{visibleServices.length} نتيجة</span>
        </div>

        {loading ? (
          <div className="loading-list">
            {[1, 2, 3].map((n) => <div className="skeleton-card" key={n}><span /><div><i /><i /></div></div>)}
          </div>
        ) : latest.length ? (
          <div className="service-list">
            {latest.map((service) => (
              <ServiceCard key={service.id} service={service} category={categoryName(service.category_id)} onOpen={setSelectedService} />
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <span className="empty-icon">{search ? "⌕" : "✦"}</span>
            <h3>{search ? "ما لقينا نتائج مطابقة" : "الخدمات عم تجهز لتكون هون"}</h3>
            <p>{search ? "جرّب كلمات مختلفة أو اختَر قسماً آخر." : "لسه ما في خدمات منشورة بهذا القسم. تابعنا، رح نضيفها قريباً."}</p>
            {search && <button className="secondary-button" type="button" onClick={() => { setSearch(""); setActiveCategory("all"); }}>عرض كل الخدمات</button>}
          </div>
        )}
      </section>

      {dbNotice && (
        <p className="quiet-note">قد تكون بعض البيانات غير متاحة حالياً. جرّب تحديث الصفحة لاحقاً.</p>
      )}

      <section className="trust-strip">
        <div className="trust-icon">✓</div>
        <div><strong>سند، من مجتمعك وإلك</strong><p>منصة واحدة لتسهيل الوصول إلى الخدمات المحلية.</p></div>
        <span className="trust-decoration">✦</span>
      </section>

      <footer className="footer">
        <div className="footer-brand"><span className="brand-mark small-mark">س</span><strong>سند</strong></div>
        <p>نقرّب المسافات، ونوصل الناس بالخدمات.</p>
        <span className="copyright">© 2026 سند · جميع الحقوق محفوظة</span>
      </footer>

      <nav className="bottom-nav" aria-label="التنقل الرئيسي">
        <button className={activeTab === "home" ? "nav-active" : ""} onClick={() => goTo("home")} type="button"><span>⌂</span><small>الرئيسية</small></button>
        <button className={activeTab === "services" ? "nav-active" : ""} onClick={() => goTo("services")} type="button"><span>▦</span><small>الخدمات</small></button>
        <button className={activeTab === "news" ? "nav-active" : ""} onClick={() => goTo("news")} type="button"><span>♧</span><small>الإعلانات</small></button>
        <button onClick={() => setSelectedService({ title: "أهلاً بك في سند", description: "نعمل على تطوير حساب المستخدم والخدمات الشخصية لتكون متاحة قريباً." })} type="button"><span>☺</span><small>حسابي</small></button>
      </nav>

      {selectedService && (
        <div className="modal-backdrop" role="presentation" onClick={() => setSelectedService(null)}>
          <section className="service-modal" role="dialog" aria-modal="true" aria-label="تفاصيل الخدمة" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" type="button" onClick={() => setSelectedService(null)} aria-label="إغلاق">×</button>
            <span className="modal-symbol">{iconFor(selectedService.title)}</span>
            <span className="section-kicker">تفاصيل</span>
            <h2>{selectedService.title}</h2>
            {selectedService.provider_name && <p className="modal-provider">{selectedService.provider_name}</p>}
            <p className="modal-description">{selectedService.description || "لا يوجد وصف إضافي لهذه الخدمة حالياً."}</p>
            {selectedService.address && <p className="modal-detail">📍 {selectedService.address}</p>}
            {selectedService.phone && <a className="primary-button" href={`tel:${selectedService.phone}`}>اتصل بمقدم الخدمة <span>↗</span></a>}
            {!selectedService.phone && <p className="modal-footnote">معلومات التواصل ستظهر هنا عند إضافتها من مقدم الخدمة.</p>}
          </section>
        </div>
      )}
    </main>
  );
}

function ServiceCard({ service, category, onOpen, featured = false }) {
  return (
    <button type="button" className={`service-card ${featured ? "featured-card" : ""}`} onClick={() => onOpen(service)}>
      <span className="service-symbol">{iconFor(category || service.title)}</span>
      <span className="service-content">
        <span className="service-category">{category}</span>
        <strong>{service.title}</strong>
        <span className="service-description">{service.description || "اكتشف تفاصيل هذه الخدمة ومعلومات التواصل."}</span>
        {service.provider_name && <span className="provider-name"><span className="provider-check">✓</span> {service.provider_name}</span>}
      </span>
      <span className="service-arrow">←</span>
    </button>
  );
}
