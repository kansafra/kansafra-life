'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

export default function AdminAzkar() {
  const router = useRouter();
  const [azkar, setAzkar] = useState([]);
  const [settings, setSettings] = useState({});
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({});
  const [savingSettings, setSavingSettings] = useState(false);

  useEffect(() => {
    let stored = null;
    try { stored = JSON.parse(localStorage.getItem('sanad_admin') || 'null'); } catch {}
    if (!stored) { router.replace('/admin/login'); return; }
    load();
  }, [router]);

  async function load() {
    if (!supabase) { setLoading(false); return; }
    const [azkarRes, settingsRes] = await Promise.all([
      supabase.from('azkar').select('*').order('sort_order'),
      supabase.from('app_settings').select('*').in('key', [
        'azkar_enabled', 'azkar_interval_minutes',
        'azkar_display_seconds', 'azkar_sound_enabled'
      ]),
    ]);
    setAzkar(Array.isArray(azkarRes.data) ? azkarRes.data : []);
    const s = {};
    (settingsRes.data || []).forEach((x) => { s[x.key] = x.value; });
    setSettings(s);
    setLoading(false);
  }

  async function saveSetting(key, value) {
    setSavingSettings(true);
    const { error } = await supabase
      .from('app_settings')
      .upsert({ key, value: String(value), category: 'azkar', updated_at: new Date().toISOString() }, { onConflict: 'key' });
    if (error) { alert('خطأ: ' + error.message); }
    else {
      setSettings((prev) => ({ ...prev, [key]: String(value) }));
    }
    setSavingSettings(false);
  }

  function openNew() {
    setEditing('new');
    setForm({ text: '', source: '', category: 'تسبيح', is_active: true, sort_order: azkar.length + 1 });
  }

  function openEdit(a) {
    setEditing(a.id);
    setForm({ ...a });
  }

  async function save() {
    if (!form.text?.trim()) { alert('النص مطلوب'); return; }
    const payload = {
      text: form.text.trim(),
      source: form.source?.trim() || null,
      category: form.category || 'عام',
      repeat_count: parseInt(form.repeat_count) || 1,
      is_active: form.is_active !== false,
      sort_order: parseInt(form.sort_order) || 0,
    };
    let err;
    if (editing === 'new') {
      ({ error: err } = await supabase.from('azkar').insert(payload));
    } else {
      ({ error: err } = await supabase.from('azkar').update(payload).eq('id', editing));
    }
    if (err) { alert('تعذّر الحفظ: ' + err.message); return; }
    setEditing(null);
    load();
  }

  async function del(a) {
    if (!confirm('حذف هذا الذكر؟')) return;
    const { error } = await supabase.from('azkar').delete().eq('id', a.id);
    if (error) { alert('تعذّر الحذف'); return; }
    load();
  }

  async function toggleActive(a) {
    const { error } = await supabase.from('azkar').update({ is_active: !a.is_active }).eq('id', a.id);
    if (!error) {
      setAzkar((arr) => arr.map((x) => x.id === a.id ? { ...x, is_active: !a.is_active } : x));
    }
  }

  const activeCount = azkar.filter((a) => a.is_active).length;

  return (
    <div className="admin-page">
      <div className="admin-sub-header">
        <Link href="/admin" className="admin-sub-back">→</Link>
        <span className="admin-sub-title">إدارة الأذكار</span>
        <span className="admin-sub-count">{activeCount}/{azkar.length}</span>
      </div>

      {/* ═══ الإعدادات ═══ */}
      <div style={{ padding: 16, background: 'rgba(15,77,58,.08)', borderBottom: '1px solid rgba(15,77,58,.15)' }}>
        <div style={{ fontSize: 12, color: 'rgba(255,255,255,.7)', fontWeight: 800, marginBottom: 12 }}>
          ⚙️ الإعدادات
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
          <span style={{ flex: 1, fontSize: 13, color: '#fff' }}>تفعيل شريط الأذكار</span>
          <button
            onClick={() => saveSetting('azkar_enabled', settings.azkar_enabled === 'false' ? 'true' : 'false')}
            style={{
              background: settings.azkar_enabled !== 'false' ? '#0f4d3a' : '#444',
              color: '#fff', border: 'none', borderRadius: 999, padding: '6px 16px',
              fontSize: 12, fontWeight: 800, cursor: 'pointer'
            }}
          >
            {settings.azkar_enabled !== 'false' ? 'مُفعّل ✓' : 'معطّل ✗'}
          </button>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
          <span style={{ flex: 1, fontSize: 13, color: '#fff' }}>صوت التنبيه</span>
          <button
            onClick={() => saveSetting('azkar_sound_enabled', settings.azkar_sound_enabled === 'false' ? 'true' : 'false')}
            style={{
              background: settings.azkar_sound_enabled !== 'false' ? '#0f4d3a' : '#444',
              color: '#fff', border: 'none', borderRadius: 999, padding: '6px 16px',
              fontSize: 12, fontWeight: 800, cursor: 'pointer'
            }}
          >
            {settings.azkar_sound_enabled !== 'false' ? '🔔 مُفعّل' : '🔕 معطّل'}
          </button>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
          <span style={{ flex: 1, fontSize: 13, color: '#fff' }}>كل كم دقيقة يظهر؟</span>
          <input
            type="number"
            min="1"
            max="120"
            value={settings.azkar_interval_minutes || 15}
            onChange={(e) => setSettings((s) => ({ ...s, azkar_interval_minutes: e.target.value }))}
            onBlur={(e) => saveSetting('azkar_interval_minutes', e.target.value)}
            style={{
              width: 80, padding: '6px 10px', borderRadius: 8, border: '1px solid rgba(255,255,255,.2)',
              background: 'rgba(0,0,0,.2)', color: '#fff', fontSize: 13, textAlign: 'center'
            }}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ flex: 1, fontSize: 13, color: '#fff' }}>مدة الظهور (ثانية)</span>
          <input
            type="number"
            min="3"
            max="60"
            value={settings.azkar_display_seconds || 12}
            onChange={(e) => setSettings((s) => ({ ...s, azkar_display_seconds: e.target.value }))}
            onBlur={(e) => saveSetting('azkar_display_seconds', e.target.value)}
            style={{
              width: 80, padding: '6px 10px', borderRadius: 8, border: '1px solid rgba(255,255,255,.2)',
              background: 'rgba(0,0,0,.2)', color: '#fff', fontSize: 13, textAlign: 'center'
            }}
          />
        </div>
      </div>

      {/* ═══ الأزرار ═══ */}
      <div style={{ padding: 16 }}>
        <button className="mng-btn primary" onClick={openNew} type="button" style={{ width: '100%' }}>
          + إضافة ذكر جديد
        </button>
      </div>

      {/* ═══ القائمة ═══ */}
      {loading ? (
        <div className="sect-empty"><span className="em">⏳</span><p>جارٍ التحميل...</p></div>
      ) : azkar.length === 0 ? (
        <div className="sect-empty"><span className="em">📿</span><p>لا توجد أذكار</p></div>
      ) : (
        <div className="admin-items">
          {azkar.map((a) => (
            <div key={a.id} className="admin-item" style={{ opacity: a.is_active ? 1 : 0.5 }}>
              <div className="admin-item-icon" style={{ background: 'rgba(15,77,58,.15)', color: '#4ade80', fontSize: 18 }}>📿</div>
              <div className="admin-item-body">
                <div className="admin-item-title" style={{ fontSize: 13, lineHeight: 1.5 }}>{a.text}</div>
                <div className="admin-item-meta">
                  {a.source && <span>{a.source}</span>}
                  <span>{a.category}</span>
                  {!a.is_active && <span className="admin-badge info">معطّل</span>}
                </div>
              </div>
              <div className="admin-item-actions" style={{ flexDirection: 'column', gap: 4 }}>
                <button
                  className="admin-act-btn"
                  onClick={() => toggleActive(a)}
                  type="button"
                  title={a.is_active ? 'إخفاء' : 'إظهار'}
                >
                  {a.is_active ? '👁️' : '🚫'}
                </button>
                <button className="admin-act-btn" onClick={() => openEdit(a)} type="button" title="تعديل">✏️</button>
                <button className="admin-act-btn del" onClick={() => del(a)} type="button" title="حذف">🗑️</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ═══ نافذة تعديل/إضافة ═══ */}
      {editing && (
        <div className="mng-modal-bg" onClick={() => setEditing(null)}>
          <div className="mng-modal" onClick={(e) => e.stopPropagation()}>
            <div className="mng-modal-handle" />
            <h3 className="mng-modal-title">{editing === 'new' ? '➕ ذكر جديد' : '✏️ تعديل'}</h3>

            <div className="new-service-field">
              <label className="new-service-label">نص الذكر *</label>
              <textarea
                className="new-service-input"
                style={{ minHeight: 80, fontFamily: 'inherit' }}
                value={form.text || ''}
                onChange={(e) => setForm({ ...form, text: e.target.value })}
                placeholder="مثال: سُبْحَانَ اللَّهِ وَبِحَمْدِهِ"
              />
            </div>

            <div className="new-service-field">
              <label className="new-service-label">المصدر</label>
              <input
                className="new-service-input"
                value={form.source || ''}
                onChange={(e) => setForm({ ...form, source: e.target.value })}
                placeholder="مثال: رواه مسلم"
              />
            </div>

            <div className="new-prod-row">
              <div className="new-service-field">
                <label className="new-service-label">التصنيف</label>
                <input
                  className="new-service-input"
                  value={form.category || ''}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  placeholder="تسبيح"
                />
              </div>
              <div className="new-service-field">
                <label className="new-service-label">الترتيب</label>
                <input
                  className="new-service-input"
                  type="number"
                  value={form.sort_order || 0}
                  onChange={(e) => setForm({ ...form, sort_order: e.target.value })}
                />
              </div>
            </div>

            <div className="new-service-field" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <input
                type="checkbox"
                checked={form.is_active !== false}
                onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
                id="azk_act"
              />
              <label htmlFor="azk_act" style={{ margin: 0, cursor: 'pointer' }}>مُفعّل</label>
            </div>

            <div className="admin-form-actions">
              <button className="mng-btn ghost" onClick={() => setEditing(null)} type="button">إلغاء</button>
              <button className="mng-btn primary" onClick={save} type="button">✓ حفظ</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
