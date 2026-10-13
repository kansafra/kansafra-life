'use client';

// Safe date for hydration
const __safeDate = (d) => (typeof window !== 'undefined' ? __safeDate(d) : __safeDate(0));

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

export default function SupportPage() {
  const router = useRouter();
  const [entity, setEntity] = useState(null);
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState(false);
  const [form, setForm] = useState({ subject: '', message: '', category: 'general', priority: 'normal' });

  useEffect(() => {
    let stored = null;
    try { stored = JSON.parse(localStorage.getItem('sanad_entity') || 'null'); } catch {}
    if (!stored) { router.replace('/login'); return; }
    setEntity(stored);
    load(stored);
  }, [router]);

  async function load(ent) {
    if (!supabase) { setLoading(false); return; }
    const { data } = await supabase.from('support_tickets').select('*').eq('user_name', ent.display_name).order('created_at', { ascending: false });
    setTickets(Array.isArray(data) ? data : []);
    setLoading(false);
  }

  async function send() {
    if (!form.subject.trim() || !form.message.trim()) { alert('الموضوع والرسالة مطلوبان'); return; }
    await supabase.from('support_tickets').insert({
      user_name: entity.display_name,
      user_phone: entity.phone,
      user_email: entity.email,
      subject: form.subject,
      message: form.message,
      category: form.category,
      priority: form.priority,
      status: 'open',
    });
    alert('✅ تم إرسال تذكرتك');
    setMode(false);
    setForm({ subject: '', message: '', category: 'general', priority: 'normal' });
    load(entity);
  }

  if (!entity) return <div className="sect-empty" style={{ padding: 80 }}><span className="em">⏳</span></div>;

  return (
    <div className="ent-page">
      <div className="inv-header">
        <Link href="/merchant" className="inv-back">→</Link>
        <span className="inv-title">💬 الدعم الفني</span>
        <button className="mng-add-btn" onClick={() => setMode(true)} type="button">+ تذكرة</button>
      </div>

      {loading ? (
        <div className="sect-empty"><span className="em">⏳</span></div>
      ) : tickets.length === 0 ? (
        <div className="sect-empty"><span className="em">💬</span><p>لا توجد تذاكر</p></div>
      ) : (
        <div className="ticket-list">
          {tickets.map((t) => (
            <div key={t.id} className={`ticket-card priority-${t.priority}`}>
              <div className="ticket-head">
                <div className="ticket-subject">{t.subject}</div>
                <span className={`ticket-status ${t.status}`}>
                  {t.status === 'open' ? 'مفتوحة' : t.status === 'in_progress' ? 'قيد المعالجة' : 'محلولة'}
                </span>
              </div>
              <div className="ticket-user">
                {__safeDate(t.created_at).toLocaleString('ar-EG', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
              </div>
              <div className="ticket-message">{t.message}</div>
              {t.reply && (
                <div className="ticket-reply">
                  <strong>رد الدعم:</strong> {t.reply}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {mode && (
        <div className="mng-modal-bg" onClick={() => setMode(false)}>
          <div className="mng-modal" onClick={(e) => e.stopPropagation()}>
            <div className="mng-modal-handle" />
            <h3 className="mng-modal-title">💬 تذكرة دعم جديدة</h3>
            <div className="new-service-field">
              <label className="new-service-label">الموضوع</label>
              <input className="new-service-input" value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} placeholder="مثال: مشكلة في رفع المنتجات" />
            </div>
            <div className="new-prod-row">
              <div className="new-service-field">
                <label className="new-service-label">التصنيف</label>
                <select className="new-service-select" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                  <option value="general">عام</option>
                  <option value="technical">تقني</option>
                  <option value="billing">الفواتير</option>
                  <option value="feature">طلب ميزة</option>
                  <option value="bug">مشكلة</option>
                </select>
              </div>
              <div className="new-service-field">
                <label className="new-service-label">الأهمية</label>
                <select className="new-service-select" value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}>
                  <option value="low">منخفضة</option>
                  <option value="normal">عادية</option>
                  <option value="high">عالية</option>
                  <option value="urgent">عاجلة</option>
                </select>
              </div>
            </div>
            <div className="new-service-field">
              <label className="new-service-label">الرسالة</label>
              <textarea className="new-service-textarea" value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} placeholder="اشرح مشكلتك بالتفصيل..." />
            </div>
            <div className="admin-form-actions">
              <button className="mng-btn ghost" onClick={() => setMode(false)} type="button">إلغاء</button>
              <button className="mng-btn primary" onClick={send} type="button">✓ إرسال</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
