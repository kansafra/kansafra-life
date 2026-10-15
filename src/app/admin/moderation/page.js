'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

const SETTINGS_CONFIG = [
  { key: 'moderation_enabled', label: '🎛️ تفعيل نظام المراجعة', desc: 'عند التفعيل: المحتوى الجديد يحتاج موافقة', section: 'main' },
  { key: 'auto_publish_all', label: '🚀 نشر كل شي تلقائياً', desc: 'يتجاوز كل الإعدادات — كل شي ينشر', section: 'main' },
  { key: 'auto_publish_services', label: '📋 الخدمات', desc: 'نشر الخدمات تلقائياً', section: 'tables' },
  { key: 'auto_publish_products', label: '🛍️ المنتجات', desc: 'نشر المنتجات تلقائياً', section: 'tables' },
  { key: 'auto_publish_entities', label: '🏢 الكيانات', desc: 'قبول المتاجر والمؤسسات', section: 'tables' },
  { key: 'auto_publish_announcements', label: '📢 الإعلانات', desc: 'نشر الإعلانات', section: 'tables' },
];

const CONTENT_TABLES = [
  { table: 'services',              label: '📋 الخدمات' },
  { table: 'products',              label: '🛍️ المنتجات' },
  { table: 'entities',              label: '🏢 الكيانات' },
  { table: 'announcements',         label: '📢 الإعلانات' },
  { table: 'sports_venues',         label: '🏟️ الملاعب' },
  { table: 'sports_training',       label: '🏃 التدريبات' },
  { table: 'sports_news',           label: '📰 الأخبار الرياضية' },
  { table: 'library_books',         label: '📚 الكتب' },
  { table: 'job_postings',          label: '💼 الوظائف' },
  { table: 'real_estate',           label: '🏠 العقارات' },
  { table: 'tourism_places',        label: '🏛️ السياحة' },
  { table: 'memory_items',          label: '📸 الذاكرة' },
];

export default function AdminModeration() {
  const router = useRouter();
  const [settings, setSettings] = useState({});
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('settings');
  const [pending, setPending] = useState({});
  const [pendingLoading, setPendingLoading] = useState(false);
  const [selectedTable, setSelectedTable] = useState('services');

  useEffect(() => {
    let stored = null;
    try { stored = JSON.parse(localStorage.getItem('sanad_admin') || 'null'); } catch {}
    if (!stored) { router.replace('/admin/login'); return; }
    loadSettings();
  }, [router]);

  async function loadSettings() {
    if (!supabase) { setLoading(false); return; }
    const { data } = await supabase
      .from('app_settings')
      .select('*')
      .eq('category', 'moderation');
    const s = {};
    (data || []).forEach((x) => { s[x.key] = x.value; });
    setSettings(s);
    setLoading(false);
  }

  async function saveSetting(key, value) {
    const { error } = await supabase
      .from('app_settings')
      .upsert(
        { key, value: String(value), category: 'moderation', updated_at: new Date().toISOString() },
        { onConflict: 'key' }
      );
    if (!error) {
      setSettings((prev) => ({ ...prev, [key]: String(value) }));
    } else {
      alert('خطأ: ' + error.message);
    }
  }

  async function loadPending(table) {
    setPendingLoading(true);
    if (!supabase) { setPendingLoading(false); return; }
    const { data } = await supabase
      .from(table)
      .select('*')
      .eq('moderation_status', 'pending')
      .order('created_at', { ascending: false })
      .limit(50);
    setPending((prev) => ({ ...prev, [table]: data || [] }));
    setPendingLoading(false);
  }

  async function approve(table, id) {
    const { error } = await supabase
      .from(table)
      .update({
        moderation_status: 'approved',
        moderated_at: new Date().toISOString(),
      })
      .eq('id', id);
    if (!error) {
      setPending((prev) => ({
        ...prev,
        [table]: (prev[table] || []).filter((x) => x.id !== id),
      }));
    }
  }

  async function reject(table, id) {
    const notes = prompt('سبب الرفض (اختياري):') || null;
    const { error } = await supabase
      .from(table)
      .update({
        moderation_status: 'rejected',
        moderated_at: new Date().toISOString(),
        moderation_notes: notes,
      })
      .eq('id', id);
    if (!error) {
      setPending((prev) => ({
        ...prev,
        [table]: (prev[table] || []).filter((x) => x.id !== id),
      }));
    }
  }

  useEffect(() => {
    if (tab === 'pending') loadPending(selectedTable);
  }, [tab, selectedTable]);

  const isAutoAll = settings.auto_publish_all === 'true';
  const isModEnabled = settings.moderation_enabled === 'true';

  return (
    <div className="admin-page">
      <div className="admin-sub-header">
        <Link href="/admin" className="admin-sub-back">→</Link>
        <span className="admin-sub-title">نظام المراجعة</span>
        <span className="admin-sub-count">
          {isModEnabled ? '🟡 مفعّل' : '🟢 موقّف'}
        </span>
      </div>

      {/* حالة النظام */}
      <div style={{ padding: 16, background: isModEnabled ? 'rgba(251,191,36,.08)' : 'rgba(34,197,94,.08)', borderBottom: '1px solid rgba(255,255,255,.05)' }}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <div style={{ fontSize: 32 }}>{isModEnabled ? '🟡' : '🟢'}</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14, fontWeight: 900, color: '#fff', marginBottom: 4 }}>
              {isModEnabled ? 'نظام المراجعة مفعّل' : 'نشر تلقائي — لا مراجعة'}
            </div>
            <div style={{ fontSize: 11.5, color: 'rgba(255,255,255,.6)', lineHeight: 1.6 }}>
              {isModEnabled
                ? 'المحتوى الجديد يحتاج موافقة قبل النشر'
                : 'كل المحتوى الجديد يُنشر مباشرة'}
            </div>
          </div>
        </div>
      </div>

      {/* التابات */}
      <div className="chips-scroll" style={{ padding: '12px 16px' }}>
        <button
          className={`chip ${tab === 'settings' ? 'active' : ''}`}
          onClick={() => setTab('settings')}
          type="button"
        >
          ⚙️ الإعدادات
        </button>
        <button
          className={`chip ${tab === 'pending' ? 'active' : ''}`}
          onClick={() => setTab('pending')}
          type="button"
        >
          ⏳ قيد المراجعة
        </button>
      </div>

      {tab === 'settings' && (
        <div style={{ padding: 16 }}>
          {/* الرئيسي */}
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,.4)', fontWeight: 900, marginBottom: 10, textTransform: 'uppercase' }}>
            الإعدادات الرئيسية
          </div>

          {SETTINGS_CONFIG.filter((s) => s.section === 'main').map((s) => (
            <SettingRow
              key={s.key}
              setting={s}
              value={settings[s.key] === 'true'}
              onToggle={() => saveSetting(s.key, settings[s.key] === 'true' ? 'false' : 'true')}
            />
          ))}

          <div style={{ fontSize: 11, color: 'rgba(255,255,255,.4)', fontWeight: 900, margin: '24px 0 10px', textTransform: 'uppercase' }}>
            نشر تلقائي حسب النوع
          </div>

          {SETTINGS_CONFIG.filter((s) => s.section === 'tables').map((s) => (
            <SettingRow
              key={s.key}
              setting={s}
              value={settings[s.key] === 'true'}
              onToggle={() => saveSetting(s.key, settings[s.key] === 'true' ? 'false' : 'true')}
              disabled={isAutoAll}
            />
          ))}
        </div>
      )}

      {tab === 'pending' && (
        <>
          <div className="chips-scroll" style={{ padding: '0 16px 12px' }}>
            {CONTENT_TABLES.map((t) => (
              <button
                key={t.table}
                className={`chip ${selectedTable === t.table ? 'active' : ''}`}
                onClick={() => setSelectedTable(t.table)}
                type="button"
              >
                {t.label}
              </button>
            ))}
          </div>

          {pendingLoading ? (
            <div className="sect-empty"><span className="em">⏳</span><p>جارٍ التحميل...</p></div>
          ) : !pending[selectedTable] || pending[selectedTable].length === 0 ? (
            <div className="sect-empty">
              <span className="em">✅</span>
              <p>لا يوجد محتوى قيد المراجعة</p>
            </div>
          ) : (
            <div className="admin-items">
              {pending[selectedTable].map((item) => (
                <div key={item.id} className="admin-item" style={{ flexDirection: 'column', alignItems: 'stretch', gap: 10 }}>
                  <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                    <div className="admin-item-icon">📋</div>
                    <div className="admin-item-body" style={{ flex: 1 }}>
                      <div className="admin-item-title">
                        {item.title || item.name || item.display_name || 'بدون عنوان'}
                      </div>
                      <div className="admin-item-meta">
                        <span>@{item.provider_name || item.username || 'غير محدد'}</span>
                        {item.phone && <span>{item.phone}</span>}
                      </div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button
                      onClick={() => approve(selectedTable, item.id)}
                      className="admin-act-btn ok"
                      style={{ flex: 1, padding: 10, fontSize: 13, fontWeight: 900 }}
                      type="button"
                    >
                      ✅ موافقة
                    </button>
                    <button
                      onClick={() => reject(selectedTable, item.id)}
                      className="admin-act-btn del"
                      style={{ flex: 1, padding: 10, fontSize: 13, fontWeight: 900 }}
                      type="button"
                    >
                      ❌ رفض
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

function SettingRow({ setting, value, onToggle, disabled }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: 14,
        background: value ? 'rgba(34,197,94,.08)' : 'rgba(255,255,255,.03)',
        borderRadius: 12,
        marginBottom: 8,
        opacity: disabled ? 0.5 : 1,
      }}
    >
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 13.5, fontWeight: 900, color: '#fff', marginBottom: 3 }}>
          {setting.label}
        </div>
        <div style={{ fontSize: 10.5, color: 'rgba(255,255,255,.5)', lineHeight: 1.5 }}>
          {setting.desc}
        </div>
      </div>
      <button
        onClick={onToggle}
        disabled={disabled}
        type="button"
        style={{
          background: value ? '#22c55e' : '#555',
          color: '#fff',
          border: 'none',
          borderRadius: 999,
          padding: '8px 16px',
          fontSize: 11.5,
          fontWeight: 900,
          cursor: disabled ? 'not-allowed' : 'pointer',
          minWidth: 70,
          whiteSpace: 'nowrap',
        }}
      >
        {value ? '✓ مفعّل' : '✗ معطّل'}
      </button>
    </div>
  );
}
