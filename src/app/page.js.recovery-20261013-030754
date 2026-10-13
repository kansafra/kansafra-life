"use client";

import { useMemo, useState } from "react";

const services = [
  { icon: "🛍️", title: "المتاجر", desc: "تسوّق من متاجر منطقتك", color: "mint" },
  { icon: "🩺", title: "الصحة", desc: "العيادات والخدمات الطبية", color: "blue" },
  { icon: "🎓", title: "التعليم", desc: "المدارس والدورات", color: "gold" },
  { icon: "🕌", title: "المساجد", desc: "مواعيد وأنشطة المساجد", color: "mint" },
  { icon: "🏛️", title: "البلدية", desc: "الخدمات والإعلانات", color: "blue" },
  { icon: "🤝", title: "الجمعيات", desc: "المبادرات والمساعدات", color: "gold" },
  { icon: "📰", title: "الأخبار", desc: "آخر أخبار المنطقة", color: "blue" },
  { icon: "🚨", title: "الطوارئ", desc: "معلومات وأرقام الطوارئ", color: "red" },
];


const normalizeSearch = (value = "") =>
  String(value)
    .normalize("NFKD")
    .replace(/[\u064B-\u065F\u0670\u0640]/g, "")
    .replace(/[أإآٱ]/g, "ا")
    .replace(/ى/g, "ي")
    .replace(/ة/g, "ه")
    .replace(/ؤ/g, "و")
    .replace(/ئ/g, "ي")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim();

const aliases = {
  "المتاجر": "متجر محلات تسوق بقالة دكان",
  "الصحة": "صحه طبيب دكتور عياده مستشفى دواء",
  "التعليم": "مدرسه تعليم معلم طالب جامعة",
  "المساجد": "مسجد جامع صلاة امام",
  "البلدية": "بلديه خدمات بلدية",
  "الجمعيات": "جمعيه خيريه مساعدات تبرعات",
  "الأخبار": "اخبار خبر مستجدات",
  "الطوارئ": "اسعاف نجده حريق شرطة حادث"
};

const editDistance = (a, b) => {
  if (Math.abs(a.length - b.length) > 1) return 2;
  let prev = Array.from({length: b.length + 1}, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    const cur = [i];
    for (let j = 1; j <= b.length; j++) {
      cur[j] = Math.min(
        cur[j - 1] + 1,
        prev[j] + 1,
        prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)
      );
    }
    prev = cur;
  }
  return prev[b.length];
};

const smartMatch = (service, query) => {
  const q = normalizeSearch(query);
  if (!q) return true;

  const title = service.title || "";
  const desc = service.desc || "";
  const text = normalizeSearch(
    title + " " + desc + " " + (aliases[title] || "")
  );

  if (text.includes(q)) return true;

  const words = text.split(/\s+/).filter(Boolean);
  return q.split(/\s+/).filter(Boolean).every(part =>
    words.some(word =>
      word.includes(part) ||
      (part.length >= 4 && editDistance(word, part) <= 1)
    )
  );
};

export default function Home() {
  const [search, setSearch] = useState("");

  const filteredServices = useMemo(
    () => services.filter((service) => smartMatch(service, search)), [search]);

  return (
    <main className="sanad" dir="rtl">
      <header className="topbar">
        <a className="brand" href="#" aria-label="سند الرئيسية">
          <span className="brand-mark">س</span>
          <span>
            <strong>سند</strong>
            <small>SANAD</small>
          </span>
        </a>
        <span className="location"><span>●</span> كنصفرة، ريف إدلب</span>
        <button className="account-button" onClick={() => alert("سيتم تجهيز تسجيل الدخول في المرحلة التالية")}>
          حسابي <span>↗</span>
        </button>
      </header>

      <section className="hero">
        <div className="hero-content">
          <div className="eyebrow"><span /> منصتك المحلية المتكاملة</div>
          <h1>كل ما تحتاجه،<br /><span>أصبح أقرب إليك.</span></h1>
          <p>سند يجمع الخدمات والمتاجر والجهات المحلية في تجربة واحدة سهلة وآمنة.</p>
          <label className="searchbox">
            <span className="search-icon">⌕</span>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="ما الخدمة التي تبحث عنها؟"
              aria-label="ابحث عن خدمة"
            />
            <span className="search-hint">بحث</span>
          </label>
          <div className="hero-note"><span>✓</span> خدمات منطقتك في مكان واحد</div>
        </div>
        <div className="hero-art" aria-hidden="true">
          <div className="art-orbit orbit-one" />
          <div className="art-orbit orbit-two" />
          <div className="art-card art-card-top"><span>✦</span><div><b>أقرب إليك</b><small>خدمات محلية</small></div></div>
          <div className="art-symbol">س</div>
          <div className="art-card art-card-bottom"><span className="status-dot" /><div><b>سند SANAD</b><small>معك في كل يوم</small></div></div>
        </div>
      </section>

      <section className="content-section">
        <div className="section-heading">
          <div><span className="section-kicker">اكتشف سند</span><h2>خدماتك اليومية</h2></div>
          <span className="section-count">{filteredServices.length} خدمات</span>
        </div>

        {filteredServices.length ? (
          <div className="service-grid">
            {filteredServices.map((service, i) => (
              <button
                className="service-card"
                key={service.title}
                onClick={() => alert(`قسم ${service.title} قيد التجهيز`)}
                style={{ "--delay": `${i * 45}ms` }}
              >
                <span className={`service-icon ${service.color}`}>{service.icon}</span>
                <span className="service-copy"><strong>{service.title}</strong><small>{service.desc}</small></span>
                <span className="service-arrow">↙</span>
              </button>
            ))}
          </div>
        ) : (
          <div className="empty-state">ما لقينا خدمة بهذا الاسم. جرّب كلمة ثانية.</div>
        )}
      </section>

      <section className="welcome-banner">
        <div className="welcome-icon">✳</div>
        <div><span>معاً نبني مجتمعاً مترابطاً</span><h2>سند أقرب، وخدمات أسهل.</h2><p>تجربة محلية تتطور لتلبي احتياجات الناس والجهات.</p></div>
        <span className="banner-decoration">س</span>
      </section>

      <footer className="footer">
        <a className="footer-brand" href="#">سند <span>SANAD</span></a>
        <p>منطقتك، خدماتك، مجتمعك.</p>
        <small>© 2026 سند SANAD — النسخة التأسيسية</small>
      </footer>
    </main>
  );
}
