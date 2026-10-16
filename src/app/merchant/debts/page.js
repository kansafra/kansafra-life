'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { getSession } from '@/lib/auth';

export default function DebtsPage() {
  const router = useRouter();
  const [s, setS] = useState(null);
  const [debts, setDebts] = useState([]);
  const [L, setL] = useState(true);
  const [fl, setFl] = useState('active');
  const [q, setQ] = useState('');
  const [ed, setEd] = useState(null);
  const [f, setF] = useState({});
  const [reminderEnabled, setReminderEnabled] = useState(true);

  useEffect(() => {
    const x = getSession();
    if (!x) { router.replace('/login'); return; }
    setS(x); load(x);
    loadSettings();
  }, [router]);

  async function load(x) {
    if (!supabase) { setL(false); return; }
    const { data } = await supabase
      .from('debts')
      .select('*')
      .eq('entity_name', x.display_name)
      .order('created_at', { ascending: false });
    setDebts(Array.isArray(data) ? data : []);
    setL(false);
  }

  async function loadSettings() {
    if (!supabase) return;
    const { data } = await supabase
      .from('app_settings')
      .select('value')
      .eq('key', 'debt_reminder_enabled')
      .maybeSingle();
    if (data) setReminderEnabled(data.value !== 'false');
  }

  function add() {
    setEd('new');
    const d = new Date(); d.setDate(d.getDate() + 30);
    setF({
      customer_name: '',
      customer_phone: '',
      amount: '',
      paid: 0,
      currency: 'SYP',
      description: '',
      due_date: d.toISOString().slice(0, 10),
      reminder_enabled: true,
      notes: '',
    });
  }
  function edit(x) { setEd(x.id); setF({ ...x }); }

  async function save() {
    if (!f.customer_name?.trim()) { alert('اسم العميل مطلوب'); return; }
    if (!f.amount) { alert('المبلغ مطلوب'); return; }
    const p = {
      entity_name: s.display_name,
      customer_name: f.customer_name.trim(),
      customer_phone: f.customer_phone?.trim() || null,
      amount: parseFloat(f.amount) || 0,
      paid: parseFloat(f.paid) || 0,
      currency: f.currency || 'SYP',
      description: f.description?.trim() || null,
      due_date: f.due_date || null,
      reminder_enabled: f.reminder_enabled !== false,
      notes: f.notes?.trim() || null,
      status: f.status || 'active',
    };
    let err;
    if (ed === 'new') ({ error: err } = await supabase.from('debts').insert(p));
    else ({ error: err } = await supabase.from('debts').update(p).eq('id', ed));
    if (err) { alert('تعذّر: ' + err.message); return; }
    setEd(null); load(s);
  }

  async function del(x) {
    if (!confirm('حذف هذا الدين؟')) return;
    await supabase.from('debts').delete().eq('id', x.id);
    load(s);
  }

  async function addPayment(x, amt) {
    const newPaid = (Number(x.paid) || 0) + amt;
    const status = newPaid >= Number(x.amount) ? 'settled' : 'partial';
    await supabase.from('debts').update({ paid: newPaid, status }).eq('id', x.id);
    load(s);
  }

  function sendReminder(x) {
    const ph = (x.customer_phone || '').replace(/[^0-9]/g, '');
    if (!ph) { alert('لا يوجد رقم هاتف للعميل'); return; }
    const remaining = Number(x.amount) - (Number(x.paid) || 0);
    const msg = '🔔 *تذكير بدين — سند*\n\n' +
      'عزيزنا ' + x.customer_name + '،\n\n' +
      'نذكركم بأن لديكم ديناً بقيمة *' + Number(x.amount).toLocaleString() + ' ' + x.currency + '*\n' +
      '📅 تاريخ الاستحقاق: ' + (x.due_date || 'غير محدد') + '\n' +
      (Number(x.paid) > 0 ? '💰 المدفوع: ' + Number(x.paid).toLocaleString() + ' ' + x.currency + '\n' : '') +
      '⚠️ *المتبقي: ' + remaining.toLocaleString() + ' ' + x.currency + '*\n' +
      (x.description ? '\n📝 ' + x.description : '') +
      '\n\nشكراً لتعاملكم معنا — سند';
    window.open('https://wa.me/' + ph + '?text=' + encodeURIComponent(msg), '_blank');
    // نحدّث آخر تذكير
    supabase.from('debts').update({
      last_reminder_at: new Date().toISOString(),
      reminder_count: (x.reminder_count || 0) + 1,
    }).eq('id', x.id).then(() => load(s));
  }

  const list = debts.filter((x) => {
    const rem = Number(x.amount) - (Number(x.paid) || 0);
    if (fl === 'active' && rem <= 0) return false;
    if (fl === 'settled' && rem > 0) return false;
    if (fl === 'overdue') {
      if (rem <= 0) return false;
      if (!x.due_date) return false;
      if (new Date(x.due_date) >= new Date()) return false;
    }
    if (!q.trim()) return true;
    const z = q.trim().toLowerCase();
    return (x.customer_name || '').toLowerCase().includes(z) || (x.customer_phone || '').includes(z);
  });

  const totalActive = debts.reduce((sum, x) => {
    const rem = Number(x.amount) - (Number(x.paid) || 0);
    return rem > 0 ? sum + rem : sum;
  }, 0);

  return (
    <div className="sect-page" style={{ paddingBottom: 60 }}>
      <div className="inv-header">
        <Link href="/merchant" className="inv-back">→</Link>
        <span className="inv-title">📒 دفاتر الديون</span>
        <button className="mng-add-btn" onClick={add} type="button">+ دين</button>
      </div>

      {/* ملخص */}
      <div style={{ padding: 16, background: 'linear-gradient(135deg, #dc2626, #991b1b)', margin: '12px 16px', borderRadius: 16, color: '#fff' }}>
        <div style={{ fontSize: 12, opacity: .85, marginBottom: 6 }}>💰 إجمالي الديون النشطة</div>
        <div style={{ fontSize: 26, fontWeight: 900, direction: 'ltr', textAlign: 'right' }}>
          {totalActive.toLocaleString()} {debts[0]?.currency || 'SYP'}
        </div>
        <div style={{ fontSize: 11, opacity: .75, marginTop: 6 }}>{debts.filter((x) => Number(x.amount) - (Number(x.paid) || 0) > 0).length} دين نشط</div>
      </div>

      <div style={{ padding: '0 16px 12px' }}>
        <input className="new-service-input" placeholder="🔍 ابحث بالاسم أو الهاتف..." value={q} onChange={(e) => setQ(e.target.value)} />
      </div>

      <div className="chips-scroll" style={{ padding: '0 16px 12px' }}>
        <button className={'chip ' + (fl === 'active' ? 'active' : '')} onClick={() => setFl('active')} type="button">نشطة</button>
        <button className={'chip ' + (fl === 'overdue' ? 'active' : '')} onClick={() => setFl('overdue')} type="button">متأخرة</button>
        <button className={'chip ' + (fl === 'settled' ? 'active' : '')} onClick={() => setFl('settled')} type="button">مسددة</button>
        <button className={'chip ' + (fl === 'all' ? 'active' : '')} onClick={() => setFl('all')} type="button">الكل</button>
      </div>

      {L ? <div className="sect-empty"><span className="em">⏳</span></div>
       : list.length === 0 ? <div className="sect-empty"><span className="em">📒</span><p>لا توجد ديون</p></div>
       : <div style={{ padding: 16 }}>
          {list.map((x) => {
            const remaining = Number(x.amount) - (Number(x.paid) || 0);
            const overdue = x.due_date && new Date(x.due_date) < new Date() && remaining > 0;
            return (
              <div key={x.id} className="debt-card" style={{ borderRightColor: overdue ? '#dc2626' : remaining > 0 ? '#f59e0b' : '#22c55e', marginBottom: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 15, fontWeight: 900, marginBottom: 4 }}>👤 {x.customer_name}</div>
                    {x.customer_phone && <div style={{ fontSize: 12, color: 'var(--ink-500)', direction: 'ltr', textAlign: 'right' }}>📞 {x.customer_phone}</div>}
                  </div>
                  {overdue && <span className="admin-badge danger">متأخر</span>}
                  {!overdue && remaining <= 0 && <span className="admin-badge active">مسدد</span>}
                </div>

                {x.description && <div style={{ fontSize: 12, color: 'var(--ink-600)', marginBottom: 6, lineHeight: 1.6 }}>{x.description}</div>}

                <div style={{ display: 'flex', gap: 8, marginTop: 8, padding: 10, background: 'var(--ink-50)', borderRadius: 10 }}>
                  <div style={{ flex: 1, textAlign: 'center' }}>
                    <div style={{ fontSize: 10, color: 'var(--ink-500)', marginBottom: 3 }}>الإجمالي</div>
                    <div style={{ fontSize: 13, fontWeight: 900 }}>{Number(x.amount).toLocaleString()}</div>
                  </div>
                  <div style={{ flex: 1, textAlign: 'center' }}>
                    <div style={{ fontSize: 10, color: 'var(--ink-500)', marginBottom: 3 }}>المدفوع</div>
                    <div style={{ fontSize: 13, fontWeight: 900, color: '#22c55e' }}>{Number(x.paid || 0).toLocaleString()}</div>
                  </div>
                  <div style={{ flex: 1, textAlign: 'center' }}>
                    <div style={{ fontSize: 10, color: 'var(--ink-500)', marginBottom: 3 }}>المتبقي</div>
                    <div style={{ fontSize: 13, fontWeight: 900, color: remaining > 0 ? '#dc2626' : '#22c55e' }}>{remaining.toLocaleString()}</div>
                  </div>
                </div>

                {x.due_date && (
                  <div style={{ fontSize: 11, color: overdue ? '#dc2626' : 'var(--ink-500)', marginTop: 6, textAlign: 'center', fontWeight: overdue ? 900 : 600 }}>
                    📅 الاستحقاق: {x.due_date} {overdue && '⚠️ متأخر'}
                  </div>
                )}

                <div className="debt-actions">
                  {remaining > 0 && (
                    <button className="debt-action ok" onClick={() => {
                      const v = prompt('المبلغ المدفوع:', remaining);
                      if (v) addPayment(x, parseFloat(v) || 0);
                    }} type="button" title="تسجيل دفعة">💰</button>
                  )}
                  {remaining > 0 && x.customer_phone && (
                    <button className="debt-action" onClick={() => sendReminder(x)} type="button" title="إرسال تذكير واتساب">💬</button>
                  )}
                  <button className="debt-action edit" onClick={() => edit(x)} type="button">✏️</button>
                  <button className="debt-action del" onClick={() => del(x)} type="button">🗑️</button>
                </div>

                {x.last_reminder_at && (
                  <div style={{ fontSize: 10, color: 'var(--ink-400)', marginTop: 6, textAlign: 'center' }}>
                    آخر تذكير: {new Date(x.last_reminder_at).toLocaleDateString('ar-EG')}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      }

      {ed && (
        <div className="mng-modal-bg" onClick={() => setEd(null)}>
          <div className="mng-modal" onClick={(e) => e.stopPropagation()} style={{ maxHeight: '90vh', overflowY: 'auto' }}>
            <div className="mng-modal-handle" />
            <h3 className="mng-modal-title">{ed === 'new' ? '➕ دين جديد' : '✏️ تعديل'}</h3>

            <div className="new-service-field">
              <label className="new-service-label">اسم العميل *</label>
              <input className="new-service-input" value={f.customer_name || ''} onChange={(e) => setF({ ...f, customer_name: e.target.value })} />
            </div>

            <div className="new-service-field">
              <label className="new-service-label">📞 الهاتف (للتذكير)</label>
              <input className="new-service-input" type="tel" value={f.customer_phone || ''} onChange={(e) => setF({ ...f, customer_phone: e.target.value })} style={{ direction: 'ltr' }} placeholder="09XXXXXXXX" />
            </div>

            <div className="new-prod-row">
              <div className="new-service-field">
                <label className="new-service-label">المبلغ *</label>
                <input className="new-service-input" type="number" value={f.amount || ''} onChange={(e) => setF({ ...f, amount: e.target.value })} />
              </div>
              <div className="new-service-field">
                <label className="new-service-label">المدفوع</label>
                <input className="new-service-input" type="number" value={f.paid || 0} onChange={(e) => setF({ ...f, paid: e.target.value })} />
              </div>
            </div>

            <div className="new-prod-row">
              <div className="new-service-field">
                <label className="new-service-label">العملة</label>
                <select className="new-service-select" value={f.currency || 'SYP'} onChange={(e) => setF({ ...f, currency: e.target.value })}>
                  <option value="SYP">ليرة سورية</option>
                  <option value="USD">دولار</option>
                  <option value="TRY">ليرة تركية</option>
                </select>
              </div>
              <div className="new-service-field">
                <label className="new-service-label">📅 تاريخ الاستحقاق</label>
                <input className="new-service-input" type="date" value={f.due_date || ''} onChange={(e) => setF({ ...f, due_date: e.target.value })} />
              </div>
            </div>

            <div className="new-service-field">
              <label className="new-service-label">الوصف</label>
              <textarea className="new-service-textarea" value={f.description || ''} onChange={(e) => setF({ ...f, description: e.target.value })} />
            </div>

            <div className="new-service-field" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <input type="checkbox" checked={f.reminder_enabled !== false} onChange={(e) => setF({ ...f, reminder_enabled: e.target.checked })} id="rm" />
              <label htmlFor="rm" style={{ margin: 0, cursor: 'pointer', fontWeight: 800 }}>🔔 تفعيل التذكير التلقائي</label>
            </div>

            <div className="admin-form-actions">
              <button className="mng-btn ghost" onClick={() => setEd(null)} type="button">إلغاء</button>
              <button className="mng-btn primary" onClick={save} type="button">✓ حفظ</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
