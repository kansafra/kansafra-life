"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabase";

const fallbackCategories = [
  { id: "shops", name: "المتاجر", description: "اكتشف المتاجر القريبة منك", icon: "🛍️", slug: "shops" },
  { id: "health", name: "الصحة", description: "العيادات والخدمات الصحية", icon: "🩺", slug: "health" },
  { id: "education", name: "التعليم", description: "المدارس والدورات التعليمية", icon: "🎓", slug: "education" },
  { id: "mosques", name: "المساجد", description: "المساجد والأنشطة الدينية", icon: "🕌", slug: "mosques" },
  { id: "municipality", name: "البلدية", description: "الخدمات والإعلانات المحلية", icon: "🏛️", slug: "municipality" },
  { id: "charities", name: "الجمعيات", description: "المبادرات والمساعدات", icon: "🤝", slug: "charities" },
  { id: "crafts", name: "الحرف والخدمات", description: "أصحاب المهن والخبرات", icon: "🧰", slug: "crafts" },
  { id: "emergency", name: "الطوارئ", description: "الوصول السريع للمساعدة", icon: "🚨", slug: "emergency" },
];

const clean = (value = "") =>
  String(value)
    .toLowerCase()
    .replace(/[أإآ]/g, "ا")
    .replace(/ى/g, "ي")
    .replace(/ة/g, "ه")
    .replace(/[ًٌٍَُِّْـ]/g, "")
    .trim();

function SectionTitle({ eyebrow, title, description, action }) {
  return (
    <div className="section-heading">
      <div>
        <span className="eyebrow">{eyebrow}</span>
        <h2>{title}</h2>
        {description && <p>{description}</p>}
      </div>
      {action}
    </div>
  );
}

export default function Home() {
  const [categories, setCategories] = useState(fallbackCategories);
  const [services, setServices] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  const [loading, setLoading] = useState(true);
  const [connection, setConnection] = useState("loading");
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    let alive = true;

    async function loadData() {
      if (!supabase) {
        if (alive) {
          setConnection("offline");
          setLoading(false);
        }
        return;
      }

      const results = await Promise.allSettled([
        supabase
          .from("service_categories")
          .select("id,name,slug,description,icon,sort_order,is_active")
          .eq("is_active", true)
          .order("sort_order", { ascending: true }),
        supabase
          .from("services")
          .select("id,category_id,title,description,provider_name,phone,address,image_url,status,is_featured,created_at")
          .order("created_at", { ascending: false })
          .limit(30),
        supabase
          .from("announcements")
          .select("id,title,body,type,image_url,is_published,published_at,created_at")
          .eq("is_published", true)
          .order("published_at", { ascending: false })
          .limit(6),
      ]);

      if (!alive) return;

      const [categoryResult, serviceResult, announcementResult] = results;
      let anySuccess = false;

      if (categoryResult.status === "fulfilled" && !categoryResult.value.error) {
        anySuccess = true;
        const rows = categoryResult.value.data || [];
        if (rows.length) setCategories(rows);
      }

      if (serviceResult.status === "fulfilled" && !serviceResult.value.error) {
        anySuccess = true;
        setServices(serviceResult.value.data || []);
      }

      if (announcementResult.status === "fulfilled" && !announcementResult.value.error) {
        anySuccess = true;
        setAnnouncements(announcementResult.value.data || []);
      }

      setConnection(anySuccess ? "connected" : "error");
      setLoading(false);
    }

    loadData();
    return () => {
      alive = false;
    };
  }, []);

  const filteredCategories = useMemo(() => {
    const q = clean(search);
    return categories.filter((item) => {
      const matchesSearch =
        !q ||
        clean(item.name).includes(q) ||
        clean(item.description).includes(q) ||
        clean(item.slug).includes(q);
      return matchesSearch;
    });
  }, [categories, search]);

  const filteredServices = useMemo(() => {
    const q = clean(search);
    return services.filter((item) => {
      const matchesSearch =
        !q ||
        clean(item.title).includes(q) ||
        clean(item.description).includes(q) ||
        clean(item.provider_name).includes(q) ||
        clean(item.address).includes(q);
      const matchesCategory =
        activeCategory === "all" ||
        String(item.category_id || "") === String(activeCategory);
      return matchesSearch && matchesCategory;
    });
  }, [services, search, activeCategory]);

  const featuredServices = useMemo(
    () => filteredServices.filter((item) => item.is_featured),
    [filteredServices]
  );

  function chooseCategory(category) {
    setActiveCategory(category.id);
    setSearch("");
    document.getElementById("services-list")?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }

  function showAllServices() {
    setActiveCategory("all");
    document.getElementById("services-list")?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }

  return (
    <main>
      <header className="topbar">
        <a className="brand" href="#" aria-label="سند الصفحة الرئيسية">
          <span className="brand-mark"><span>س</span></span>
          <span className="brand-copy">
            <strong>سند</strong>
            <small>SANAD</small>
          </span>
        </a>

        <button
          className="menu-toggle"
          type="button"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="فتح القائمة"
          aria-expanded={menuOpen}
        >
          ☰
        </button>

        <nav className={menuOpen ? "nav-links nav-open" : "nav-links"}>
          <a className="nav-active" href="#">الرئيسية</a>
          <a href="#categories">الأقسام</a>
          <a href="#services-list">الخدمات</a>
          <a href="#announcements">الإعلانات</a>
        </nav>

        <a className="header-action" href="#categories">
          اكتشف سند <span>←</span>
        </a>
      </header>

      <section className="hero">
        <div className="hero-pattern" aria-hidden="true" />
        <div className="hero-content">
          <div className="hero-pill">
            <span className="live-dot" />
            منصتك الخدمية في مكان واحد
          </div>
          <h1>
            كل ما تحتاجه،
            <br />
            <span>أقرب إليك.</span>
          </h1>
          <p className="hero-description">
            خدمات محلية، متاجر، معلومات وإعلانات مهمة.
            <br className="desktop-break" />
            ابحث عن احتياجك، واتخذ خطوتك التالية بسهولة.
          </p>

          <form
            className="search-box"
            onSubmit={(event) => {
              event.preventDefault();
              showAllServices();
            }}
          >
            <span className="search-icon" aria-hidden="true">⌕</span>
            <input
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setActiveCategory("all");
              }}
              placeholder="شو عم تدور عليه اليوم؟"
              aria-label="ابحث عن خدمة أو قسم"
            />
            {search && (
              <button
                type="button"
                className="clear-search"
                onClick={() => setSearch("")}
                aria-label="مسح البحث"
              >
                ×
              </button>
            )}
            <button className="search-submit" type="submit">ابحث الآن</button>
          </form>

          <div className="hero-meta">
            <span><span className="meta-check">✓</span> سهل الاستخدام</span>
            <span><span className="meta-check">✓</span> أقسام متنوعة</span>
            <span><span className="meta-check">✓</span> من مكان واحد</span>
          </div>
        </div>

        <div className="hero-art" aria-hidden="true">
          <div className="orbit orbit-one" />
          <div className="orbit orbit-two" />
          <div className="hero-glow" />
          <div className="app-tile tile-main">
            <span className="tile-symbol">س</span>
            <span className="tile-name">سند</span>
            <span className="tile-caption">معك بكل خطوة</span>
          </div>
          <div className="floating-tile tile-shop"><span>🛍️</span><small>تسوّق</small></div>
          <div className="floating-tile tile-health"><span>🩺</span><small>صحة</small></div>
          <div className="floating-tile tile-home"><span>⌂</span><small>خدمات</small></div>
          <div className="floating-tile tile-safe"><span>✓</span><small>بكل سهولة</small></div>
        </div>
        <div className="hero-bottom-shape" />
      </section>

      <section className="trust-strip" aria-label="مميزات سند">
        <div className="trust-item"><span className="trust-icon">⌕</span><div><strong>ابحث بسهولة</strong><small>اعثر على ما تحتاجه</small></div></div>
        <div className="trust-divider" />
        <div className="trust-item"><span className="trust-icon">▦</span><div><strong>أقسام متنوعة</strong><small>خدمات من مجالات مختلفة</small></div></div>
        <div className="trust-divider" />
        <div className="trust-item"><span className="trust-icon">♡</span><div><strong>مصمم للناس</strong><small>تجربة عربية بسيطة</small></div></div>
      </section>

      <section className="content-section categories-section" id="categories">
        <SectionTitle
          eyebrow="اكتشف المنصة"
          title="شو بتحتاج اليوم؟"
          description="اختار القسم المناسب وابدأ رحلتك."
          action={<span className="section-count">{categories.length} أقسام</span>}
        />

        {search && (
          <div className="search-status">
            نتائج البحث عن «{search}»
            <button type="button" onClick={() => setSearch("")}>مسح البحث</button>
          </div>
        )}

        <div className="category-grid">
          {filteredCategories.map((category, index) => (
            <button
              className={`category-card category-${index % 4}`}
              key={category.id}
              type="button"
              onClick={() => chooseCategory(category)}
            >
              <span className="category-icon">{category.icon || "✦"}</span>
              <span className="category-text">
                <strong>{category.name}</strong>
                <small>{category.description || "اكتشف الخدمات المتاحة في هذا القسم"}</small>
              </span>
              <span className="category-arrow">↙</span>
            </button>
          ))}
        </div>

        {!filteredCategories.length && (
          <div className="empty-state">
            <span>⌕</span>
            <strong>ما لقينا أقسام مطابقة</strong>
            <p>جرّب كلمة بحث ثانية.</p>
          </div>
        )}
      </section>

      <section className="content-section services-section" id="services-list">
        <SectionTitle
          eyebrow="دليل الخدمات"
          title={activeCategory === "all" ? "خدمات متاحة عبر سند" : `خدمات القسم المختار`}
          description="تعرّف على الخدمات المسجلة في المنصة وتفاصيل التواصل المتاحة."
          action={
            activeCategory !== "all" ? (
              <button className="text-action" type="button" onClick={showAllServices}>
                عرض الكل ←
              </button>
            ) : null
          }
        />

        {loading ? (
          <div className="loading-state"><span className="spinner" /> عم نحمل الخدمات...</div>
        ) : filteredServices.length ? (
          <div className="service-grid">
            {filteredServices.map((service) => (
              <article className="service-card" key={service.id}>
                {service.image_url ? (
                  <img className="service-image" src={service.image_url} alt="" loading="lazy" />
                ) : (
                  <div className="service-image service-image-placeholder">
                    <span>{service.is_featured ? "✦" : "◈"}</span>
                  </div>
                )}
                <div className="service-card-content">
                  {service.is_featured && <span className="featured-label">خدمة مميزة</span>}
                  <h3>{service.title}</h3>
                  <p>{service.description || "للمزيد من المعلومات، تواصل مع مقدم الخدمة."}</p>
                  {service.provider_name && <div className="service-provider">♙ {service.provider_name}</div>}
                  {service.address && <div className="service-address">⌖ {service.address}</div>}
                  {service.phone ? (
                    <a className="service-contact" href={`tel:${String(service.phone).replace(/[^\d+]/g, "")}`}>
                      اتصل بمقدم الخدمة <span>←</span>
                    </a>
                  ) : (
                    <span className="service-contact unavailable">معلومات التواصل غير متاحة</span>
                  )}
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <span>◇</span>
            <strong>{search ? "ما لقينا خدمات مطابقة" : "الخدمات قيد الإضافة"}</strong>
            <p>
              {search
                ? "جرّب البحث بكلمات مختلفة أو اعرض كل الخدمات."
                : "ستظهر هنا الخدمات التي يتم تسجيلها ونشرها في قاعدة البيانات."}
            </p>
            {search && <button className="secondary-button" onClick={() => { setSearch(""); setActiveCategory("all"); }} type="button">عرض كل الخدمات</button>}
          </div>
        )}
      </section>

      {featuredServices.length > 0 && (
        <section className="featured-band">
          <div>
            <span className="eyebrow">اختيارات مميزة</span>
            <h2>خدمات تستحق اكتشافها</h2>
            <p>خدمات مميزة مسجلة على منصة سند.</p>
          </div>
          <button type="button" onClick={showAllServices}>استكشف الخدمات <span>←</span></button>
        </section>
      )}

      <section className="content-section announcements-section" id="announcements">
        <SectionTitle
          eyebrow="ابقَ على اطلاع"
          title="آخر الإعلانات"
          description="تابع الأخبار والتنبيهات المنشورة على المنصة."
          action={<span className="section-count">{announcements.length} إعلانات</span>}
        />

        {announcements.length ? (
          <div className="announcement-list">
            {announcements.map((item) => (
              <article className="announcement-card" key={item.id}>
                <div className="announcement-icon">{item.type === "urgent" ? "!" : "◉"}</div>
                <div className="announcement-copy">
                  <div className="announcement-meta">
                    <span className={item.type === "urgent" ? "announcement-tag urgent-tag" : "announcement-tag"}>
                      {item.type === "urgent" ? "تنبيه مهم" : item.type || "إعلان"}
                    </span>
                    {item.published_at && (
                      <time dateTime={item.published_at}>
                        {new Date(item.published_at).toLocaleDateString("ar-SY")}
                      </time>
                    )}
                  </div>
                  <h3>{item.title}</h3>
                  <p>{item.body}</p>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="announcement-empty">
            <span>▤</span>
            <div><strong>ما في إعلانات منشورة حاليًا</strong><p>ستظهر الإعلانات الجديدة هون عند نشرها.</p></div>
          </div>
        )}
      </section>

      <section className="help-banner">
        <div className="help-decoration" aria-hidden="true">س</div>
        <div className="help-copy">
          <span>سند معك</span>
          <h2>كل خدمة بتحتاجها، أقرب مما بتتخيّل.</h2>
          <p>ابدأ من الأقسام أو ابحث مباشرة عن الخدمة التي تريدها.</p>
        </div>
        <a href="#categories">اكتشف الأقسام <span>←</span></a>
      </section>

      <footer className="footer">
        <div className="footer-main">
          <a className="brand footer-brand" href="#">
            <span className="brand-mark"><span>س</span></span>
            <span className="brand-copy"><strong>سند</strong><small>SANAD</small></span>
          </a>
          <p>منصة خدمية تجمع احتياجاتك اليومية في مكان واحد.</p>
          <a href="#categories" className="footer-top">العودة للأعلى ↑</a>
        </div>
        <div className="footer-bottom">
          <span>© {new Date().getFullYear()} سند SANAD. جميع الحقوق محفوظة.</span>
          <span className={`connection-status connection-${connection}`}>
            <i />
            {connection === "connected" ? "اتصال قاعدة البيانات نشط" :
              connection === "loading" ? "جارٍ الاتصال..." :
              connection === "offline" ? "بانتظار إعداد الاتصال" :
              "تعذّر تحميل بعض البيانات"}
          </span>
        </div>
      </footer>
    </main>
  );
}
