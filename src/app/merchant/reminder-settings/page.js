'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { getSession } from '@/lib/auth';

export default function ReminderSettings() {
  const router = useRouter();
  const [s, setS] = useState(null);
  const [L, setL] = useState(true);
  const [saving, setSaving] = useState(false);
  const [f, setF] = useState({
    enabled: true,
    days: 3,
    message: '',
  });

  useEffect(() => {
    const x = getSession();
    if (!x) { router.replace('/login'); return; }
    setS(x); load();
  }, [router]);

  async function load() {
    if (!supabase) { setL(false); return; }
    const { data } = await supabase
      .from('app_settings')
      .select('key, value')
      .in('key', ['debt_reminder_enabled', 'debt_reminder_days', 'debt_reminder_message']);
    const cfg = {};
    (data || []).forEach((x) => { cfg[x.key] = x.value; });
    setF({
      enabled: cfg.debt_reminder_enabled !== 'false',
      days: parseInt(cfg.debt_reminder_days) || 3,
      message: cfg.debt_reminder_message || '',
    });
    setL(false);
  }

  async function save() {
    setSaving(true);
    const updates = [
      { key: 'debt_reminder_enabled', value: String(f.enabled) },
      { key: 'debt_reminder_days', value: String(f.days) },
      { key: 'debt_reminder_message', value: f.message },
    ];
    for (const u of updates) {
      await supabase.from('app_settings').upsert(
        { ...u, category: 'debts', updated_at: new Date().toISOString() },
        { onConflict: 'key' }
      );
    }
    setSaving(false);
    alert('✅ تم حفظ الإعدادات');
  }

  if (L) return <div className="sect-empty" style={{ padding: 80 }}><span className="em">⏳</span></div>;

  return (
    <div className="sect-page" style={{ paddingBottom: 60 }}>
      <div className="inv-header">
        <Link href="/merchant" className="inv-back">→</Link>
        <span className="inv-title">🔔 إعدادات التذكير</span>
        <span style={{ width: 40 }} />
      </div>

      <div style={{ padding: 16 }}>
        <div style={{ padding: 16, background: 'rgba(245,158,11,.08)', border: '1px solid rgba(245,158,11,.3)', borderRadius: 16, marginBottom: 20 }}>
          <div style={{ fontSize: 32, textAlign: 'center', marginBottom: 8 }}>🔔</div>
          <div style={{ fontSize: 14, fontWeight: 900, textAlign: 'center', color: '#f59e0b' }}>
            تذكير تلقائي بالديون
          </div>
          <div style={{ fontSize: 12, color: 'var(--ink-500)', textAlign: 'center', marginTop: 6, lineHeight: 1.7 }}>
            يُرسل إشعار للتاجر عند اقتراب استحقاق دين
          </div>
        </div>

        <div className="new-service-field" style={{ marginBottom: 12 }}>
          <label className="new-service-label">تفعيل التذكير</label>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              type="button"
              onClick={() => setF({ ...f, enabled: true })}
              style={{
                flex: 1, padding: 12,
                background: f.enabled ? '#22c55e' : '#f1f5f4',
                color: f.enabled ? '#fff' : 'var(--ink-600)',
                border: 'none', borderRadius: 10,
                fontSize: 13, fontWeight: 900, cursor: 'pointer',
              }}
            >
              ✓ مُفعّل
            </button>
            <button
              type="button"
              onClick={() => setF({ ...f, enabled: false })}
              style={{
                flex: 1, padding: 12,
                background: !f.enabled ? '#dc2626' : '#f1f5f4',
                color: !f.enabled ? '#fff' : 'var(--ink-600)',
                border: 'none', borderRadius: 10,
                fontSize: 13, fontWeight: 900, cursor: 'pointer',
              }}
            >
              ✗ معطّل
            </button>
          </div>
        </div>

        <div className="new-service-field" style={{ marginBottom: 12 }}>
          <label className="new-service-label">⏰ التذكير قبل الاستحقاق بـ (أيام)</label>
          <input
            className="new-service-input"
            type="number"
            min="1"
            max="30"
            value={f.days}
            onChange={(e) => setF({ ...f, days: parseInt(e.target.value) || 3 })}
          />
          <div style={{ fontSize: 11, color: 'var(--ink-500)', marginTop: 4 }}>
            مثال: 3 = تذكير قبل 3 أيام
          </div>
        </div>

        <div className="new-service-field" style={{ marginBottom: 20 }}>
          <label className="new-service-label">📝 قالب رسالة الواتساب</label>
          <textarea
            className="new-service-textarea"
            style={{ minHeight: 140, fontFamily: 'inherit' }}
            value={f.message}
            onChange={(e) => setF({ ...f, message: e.target.value })}
            placeholder="استخدم {customer} للاسم، {amount} للمبلغ، {currency} للعملة، {due_date} للتاريخ"
          />
          <div style={{ fontSize: 11, color: 'var(--ink-500)', marginTop: 4, lineHeight: 1.6 }}>
            المتغيرات: <code>{'{customer}'}</code> · <code>{'{amount}'}</code> · <code>{'{currency}'}</code> · <code>{'{due_date}'}</code>
          </div>
        </div>

        <button className="new-service-submit" onClick={save} disabled={saving} type="button">
          {saving ? '... جارٍ الحفظ' : '✓ حفظ الإعدادات'}
        </button>
      </div>
    </div>
  );
}
