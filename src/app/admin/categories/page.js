'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

// تحويل أيقونات Lucide إلى إيموجي
const LUCIDE_TO_EMOJI = {
  "landmark":"🕌","graduation-cap":"🎓","heart-pulse":"❤️",
  "shopping-bag":"🛍️","store":"🏪","shield-alert":"🚨",
  "siren":"🚨","newspaper":"📰","hand-heart":"🎁",
  "building-2":"🏢","building":"🏢","utensils":"🍽️",
  "utensils-crossed":"🍽️","car":"🚚","truck":"🚚",
  "home":"🏠","wrench":"🛠️","hammer":"🛠️",
  "heart":"❤️","stethoscope":"🩺","pill":"💊",
  "school":"🎓","book-open":"📚","book":"📚",
  "users":"👥","user":"👤","phone":"📞",
  "map-pin":"📍","star":"⭐","tag":"🏷️",
  "gift":"🎁","award":"🏆","briefcase":"💼",
  "shopping-cart":"🛒","receipt":"🧾","banknote":"💱",
  "coins":"💰","dollar-sign":"💵","trophy":"🏆",
  "bus":"🚌","plane":"✈️","hotel":"🏨","bed":"🛏️",
  "baby":"👶","person-standing":"🧍","users-round":"👴",
  "globe":"🌍","globe-2":"🌐","plane-takeoff":"✈️",
  "radio":"📻","tv":"📺","camera":"📷","image":"🖼️",
  "music":"🎵","mic":"🎤","gamepad-2":"🎮","dumbbell":"🏋️",
  "trees":"🌳","leaf":"🌿","flower":"🌸","sun":"☀️",
  "cloud":"☁️","droplet":"💧","flame":"🔥","zap":"⚡",
  "search":"🔍","megaphone":"📢","bell":"🔔","mail":"📧",
  "message-circle":"💬","at-sign":"📧","send":"📤",
  "settings":"⚙️","sliders":"🎛️","layout-grid":"▦",
  "list":"📋","grid-2x2":"▦","folder":"📁","file-text":"📄",
  "clipboard":"📋","package":"📦","truck-delivery":"🚚",
  "credit-card":"💳","wallet":"👛","piggy-bank":"🐷",
  "percent":"٪","calculator":"🧮","scale":"⚖️",
  "crown":"👑","gem":"💎","sparkles":"✨","flame-kindling":"🔥",
};

const resolveIcon = (iconOrName, fallbackName) => {
  if (!iconOrName) return '📁';
  const k = String(iconOrName).toLowerCase().trim();
  if (LUCIDE_TO_EMOJI[k]) return LUCIDE_TO_EMOJI[k];
  // إذا كان إيموجي مباشر (قصير)
  if (typeof iconOrName === 'string' && iconOrName.length > 0 && iconOrName.length <= 4) {
    return iconOrName;
  }
  return '📁';
};


export default function AdminCategories() {
  const router = useRouter();
  const [cats, setCats] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let stored = null;
    try { stored = JSON.parse(localStorage.getItem('sanad_admin') || 'null'); } catch {}
    if (!stored) { router.replace('/admin/login'); return; }
    load();
  }, [router]);

  async function load() {
    if (!supabase) { setLoading(false); return; }
    const { data } = await supabase.from('service_categories').select('*').order('sort_order');
    setCats(Array.isArray(data) ? data : []);
    setLoading(false);
  }

  async function toggle(id, field, current) {
    const { error } = await supabase.from('service_categories').update({ [field]: !current }).eq('id', id);
    if (!error) {
      setCats((arr) => arr.map((c) => c.id === id ? { ...c, [field]: !current } : c));
    }
  }

  return (
    <div className="admin-page">
      <div className="admin-sub-header">
        <Link href="/admin" className="admin-sub-back">→</Link>
        <span className="admin-sub-title">إدارة الأقسام</span>
        <span className="admin-sub-count">{cats.length}</span>
      </div>

      {loading ? (
        <div className="sect-empty"><span className="em">⏳</span><p>جارٍ التحميل...</p></div>
      ) : cats.length === 0 ? (
        <div className="sect-empty"><span className="em">📁</span><p>لا توجد أقسام</p></div>
      ) : (
        <div className="admin-items">
          {cats.map((c) => (
            <div key={c.id} className="admin-item">
              <div className="admin-item-icon" style={{ background: 'rgba(15,77,58,.15)', color: '#0f4d3a' }}>
                {resolveIcon(c.icon, c.name)}
              </div>
              <div className="admin-item-body">
                <div className="admin-item-title">{c.name}</div>
                <div className="admin-item-meta">
                  <span>ترتيب: {c.sort_order || 0}</span>
                  {!c.is_visible && <span className="admin-badge warn">مخفي</span>}
                  {!c.is_active && <span className="admin-badge danger">معطّل</span>}
                </div>
              </div>
              <div className="admin-item-actions" style={{ flexDirection: 'column', gap: 4 }}>
                <button
                  className={`admin-act-btn ${c.is_visible !== false ? 'ok' : ''}`}
                  onClick={() => toggle(c.id, 'is_visible', c.is_visible !== false)}
                  type="button"
                  title={c.is_visible !== false ? 'إخفاء' : 'إظهار'}
                >
                  {c.is_visible !== false ? '👁️' : '🚫'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
