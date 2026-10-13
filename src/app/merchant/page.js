'use client';

// Safe date for hydration
const __safeDate = (d) => (typeof window !== 'undefined' ? __safeDate(d) : __safeDate(0));

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { getEntityConfig } from '@/lib/entityConfig';
import { useT } from '@/lib/useT';

const iconFor = (v = '') => {
  const s = String(v).toLowerCase();
  if (/food|مطعم|طعام/.test(s)) return '🍽️';
  if (/shop|store|متجر|بقالة/.test(s)) return '🏪';
  if (/health|clinic|صحة|عياد|أسنان/.test(s)) return '❤️';
  if (/pharm|دواء|صيدل/.test(s)) return '💊';
  if (/edu|school|تعليم|مدرس/.test(s)) return '🎓';
  if (/transport|نقل/.test(s)) return '🚚';
  if (/mosque|جامع|مسجد/.test(s)) return '🕌';
  if (/charity|خير|تبرع/.test(s)) return '🎁';
  return '✦';
};

// sparkline صغير
function Sparkline({ points, width = 80, height = 24 }) {
  if (!points || points.length < 2) return null;
  const max = Math.max(...points, 1);
  const min = Math.min(...points, 0);
  const range = max - min || 1;
  const step = width / (points.length - 1);
  const path = points.map((p, i) => {
    const x = i * step;
    const y = height - ((p - min) / range) * (height - 4) - 2;
    return `${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
  }).join(' ');
  const area = `${path} L ${width} ${height} L 0 ${height} Z`;
  return (
    <svg className="ol-kpi-spark" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
      <path className="area" d={area} />
      <path d={path} stroke="currentColor" />
    </svg>
  );
}

// مخطط خطي كبير
function BigChart({ points, width = 300, height = 90 }) {
  if (!points || points.length < 2) return null;
  const max = Math.max(...points, 1);
  const min = Math.min(...points, 0);
  const range = max - min || 1;
  const padX = 8, padY = 12;
  const innerW = width - padX * 2;
  const innerH = height - padY * 2;
  const step = innerW / (points.length - 1);
  const coords = points.map((p, i) => {
    const x = padX + i * step;
    const y = padY + innerH - ((p - min) / range) * innerH;
    return { x, y };
  });
  const path = coords.map((c, i) => `${i === 0 ? 'M' : 'L'} ${c.x.toFixed(1)} ${c.y.toFixed(1)}`).join(' ');
  const area = `${path} L ${coords[coords.length - 1].x} ${height} L ${coords[0].x} ${height} Z`;
  const last = coords[coords.length - 1];
  return (
    <svg className="ol-chart" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
      <path className="area" d={area} />
      <path className="line" d={path} />
      <circle className="dot" cx={last.x} cy={last.y} r="4" />
    </svg>
  );
}

const getTimeGreeting = () => {
  const h = __safeDate().getHours();
  if (h < 12) return 'صباح الخير';
  if (h < 17) return 'مساء النور';
  return 'مساء الخير';
};

export default function OlympusDashboard() {
  const router = useRouter();
  const { t } = useT();
  const [entity, setEntity] = useState(null);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [weekActivity] = useState([3, 5, 8, 6, 9, 12, 10]);
  const [trends] = useState({
    services: [1, 2, 2, 3, 4, 5, 6],
    orders:   [0, 1, 2, 2, 3, 4, 5],
    views:    [8, 12, 10, 18, 22, 20, 28],
  });

  useEffect(() => {
    let stored = null;
    try {
      const raw = localStorage.getItem('sanad_entity');
      if (raw) stored = JSON.parse(raw);
    } catch {}
    if (!stored) { router.replace('/login'); return; }
    setEntity(stored);
    loadServices(stored);
  }, [router]);

  async function loadServices(ent) {
    if (!supabase) { setLoading(false); return; }
    try {
      const { data } = await supabase
        .from('services')
        .select('*')
        .eq('provider_name', ent.display_name)
        .order('created_at', { ascending: false });
      if (Array.isArray(data)) setServices(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  function handleLogout() {
    try { localStorage.removeItem('sanad_entity'); } catch {}
    router.push('/');
  }

  if (!entity) {
    return (
      <div className="ol-page">
        <div className="ol-empty-state" style={{ padding: 80 }}>
          <span className="em">⏳</span>
          <p>جارٍ التحميل...</p>
        </div>
      </div>
    );
  }

  const cfg = getEntityConfig(entity.entity_type);
  const theme = cfg.theme;

  const statsData = {
    services: services.length,
    orders: 0,
    views: 0,
    today: 0,
    patients: 0,
    pending: 0,
    medicines: 0,
    onCall: 0,
    students: 0,
    classes: 0,
    teachers: 0,
    lessons: 0,
    circles: 0,
    donations: 0,
    announcements: 0,
    complaints: 0,
    cases: 0,
    beneficiaries: 0,
    requests: 0,
  };

  const themeStyle = {
    '--ol-from': theme.from,
    '--ol-to': theme.to,
    '--ol-accent': theme.accent,
    '--ol-soft': theme.soft,
    '--ol-glow': theme.glow,
  };

  const heroStyle = {
    ...themeStyle,
    background: `linear-gradient(160deg, ${theme.from} 0%, ${theme.to} 55%, ${theme.to} 100%)`,
  };

  return (
    <div className="ol-page" style={themeStyle}>

      <header className="ol-hero" style={heroStyle}>
        <div className="ol-hero-orb" />

        <div className="ol-toprow">
          <div className="ol-brand">
            <div className="ol-brand-mark">س</div>
            <span className="ol-brand-name">SANAD</span>
          </div>
          <div className="ol-actions-top">
            <button className="ol-icon-btn" type="button" aria-label="إشعارات">
              🔔
              <span className="dot" />
            </button>
            <button className="ol-icon-btn" type="button" onClick={handleLogout} aria-label="خروج">
              ✕
            </button>
          </div>
        </div>

        <div className="ol-greet-row">
          <div className="ol-avatar">{cfg.icon}</div>
          <div className="ol-greet-text">
            <div className="ol-greet-hi">{getTimeGreeting()}، {cfg.greeting}</div>
            <div className="ol-greet-name">{entity.display_name}</div>
            <span className="ol-role-chip">{cfg.label}</span>
          </div>
        </div>
      </header>

      <div className="ol-body">

        {/* KPI CARDS */}
        <div className="ol-kpis">
          {cfg.stats.map((s) => {
            const val = statsData[s.key] ?? 0;
            const trendArr = trends[s.key] || [1, 2, 3, 4, 5, 6, 7];
            const isUp = String(s.trend || '').startsWith('+');
            const isDown = String(s.trend || '').startsWith('-');
            const trendClass = isUp ? 'up' : isDown ? 'down' : 'flat';
            return (
              <div
                key={s.key}
                className="ol-kpi"
                style={{
                  '--kpi-from': theme.from,
                  '--kpi-to': theme.to,
                  '--kpi-soft': theme.soft,
                }}
              >
                <div className="ol-kpi-label">{s.label}</div>
                <div className="ol-kpi-value">{val}</div>
                <span className={`ol-kpi-trend ${trendClass}`}>
                  {isUp ? '↑' : isDown ? '↓' : '•'} {s.trend || '—'}
                </span>
                <Sparkline points={trendArr} width={80} height={24} />
              </div>
            );
          })}
        </div>

        {/* QUICK ACTIONS */}
        <div className="ol-quick">
          {cfg.quickActions.map((a) => (
            <Link key={a.id} href={a.href} className="ol-quick-btn" style={{ textDecoration: 'none' }}>
              <span className="ol-quick-icon">{a.icon}</span>
              <span className="ol-quick-label">{a.title}</span>
            </Link>
          ))}
        </div>

        {/* BENTO GRID */}
        <div className="ol-bento">

          <div className="ol-bento-card wide">
            <div className="ol-bento-head">
              <span className="ol-bento-title">نشاط الأسبوع</span>
              <span className="ol-bento-badge">آخر 7 أيام</span>
            </div>
            <BigChart points={weekActivity} />
          </div>

          <div className="ol-bento-card">
            <div className="ol-bento-head">
              <span className="ol-bento-title">إشعارات</span>
            </div>
            <div className="ol-empty-state" style={{ padding: '10px 0' }}>
              <span className="em">✨</span>
              <p>لا توجد إشعارات جديدة</p>
            </div>
          </div>

          <div className="ol-bento-card">
            <div className="ol-bento-head">
              <span className="ol-bento-title">حالة الحساب</span>
            </div>
            <div style={{ padding: '4px 0' }}>
              <div className="ol-feed-item" style={{ borderBottom: 'none' }}>
                <div className="ol-feed-dot">✓</div>
                <div className="ol-feed-body">
                  <div className="ol-feed-title">حساب نشط</div>
                  <div className="ol-feed-time">مفعّل</div>
                </div>
              </div>
            </div>
          </div>

          <div className="ol-bento-card wide">
            <div className="ol-bento-head">
              <span className="ol-bento-title">آخر النشاطات</span>
              <span className="ol-bento-badge">مباشر</span>
            </div>

            {loading ? (
              <div className="ol-empty-state">
                <span className="em">⏳</span>
                <p>جارٍ التحميل...</p>
              </div>
            ) : services.length === 0 ? (
              <div className="ol-empty-state">
                <span className="em">📦</span>
                <p>لم تنشر أي خدمة بعد</p>
              </div>
            ) : (
              <div className="ol-services-mini">
                {services.slice(0, 4).map((s) => (
                  <div key={s.id} className="ol-service-mini">
                    <div className="ol-service-mini-icon">{iconFor(s.title)}</div>
                    <div className="ol-service-mini-name">{s.title}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

        <Link href="/" className="ol-signout">
          → العودة للموقع الرئيسي
        </Link>
      </div>
    </div>
  );
}
