'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { useCurrentUser } from '@/lib/useCurrentUser';
import { useToast } from '@/components/Toast';
import { SkeletonList } from '@/components/Skeleton';
import EmptyState from '@/components/EmptyState';

const STATUS = {
  open: { label: 'مفتوح', color: '#3b82f6', icon: '🔵' },
  in_progress: { label: 'قيد المعالجة', color: '#f59e0b', icon: '🟡' },
  resolved: { label: 'محلول', color: '#10b981', icon: '🟢' },
  closed: { label: 'مغلق', color: '#64748b', icon: '⚫' },
};

export default function SupportPage() {
  const router = useRouter();
  const { user, loading: uL, dataOwnerName } = useCurrentUser();
  const { success, error: tE } = useToast();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ subject: '', message: '', priority: 'normal' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (uL) return;
    if (!user) { router.replace('/login'); return; }
    load();
  }, [user, uL]);

  async function load() {
    if (!supabase || !dataOwnerName) { setLoading(false); return; }
    const { data } = await supabase.from('support_tickets').select('*').eq('entity_name', dataOwnerName).order('created_at', { ascending: false });
    setTickets(data || []);
    setLoading(false);
  }

  async function save() {
    if (!form.subject?.trim()) { tE('الموضوع مطلوب'); return; }
    if (!form.message?.trim()) { tE('الرسالة مطلوبة'); return; }
    setSaving(true);
    try {
      const { error } = await supabase.from('support_tickets').insert({
        entity_name: dataOwnerName, subject: form.subject.trim(), message: form.message.trim(), priority: form.priority || 'normal',
      });
      if (error) throw error;
      success('✅ تم إرسال التذكرة'); setModal(false); setForm({ subject: '', message: '', priority: 'normal' }); load();
    } catch (e) { tE('تعذّر: ' + e.message); }
    setSaving(false);
  }

  if (uL || loading) return <div style={{ padding: 16, background: '#f8fafc', minHeight: '100vh' }}><SkeletonList count={3} /></div>;

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', paddingBottom: 80 }}>
      <div style={{ position: 'sticky', top: 0, zIndex: 10, background: '#0f4d3a', padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <Link href="/merchant" style={{ color: '#fff', textDecoration: 'none', fontSize: 20, width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,.1)', borderRadius: '50%' }}>→</Link>
        <div style={{ flex: 1, color: '#fff', fontSize: 16, fontWeight: 900 }}>💬 الدعم ({tickets.length})</div>
        <button onClick={() => setModal(true)} style={{ background: '#fbbf24', color: '#0f4d3a', border: 'none', padding: '8px 14px', borderRadius: 10, fontSize: 12, fontWeight: 900, cursor: 'pointer', fontFamily: 'inherit' }}>+ تذكرة</button>
      </div>
      <div style={{ padding: 16 }}>
        {tickets.length === 0 ? <EmptyState icon="💬" title="لا توجد تذاكر" description="افتح تذكرة عند احتياجك للمساعدة" actionLabel="+ فتح تذكرة" onAction={() => setModal(true)} /> : tickets.map(t => {
          const s = STATUS[t.status] || STATUS.open;
          return (
            <div key={t.id} style={{ background: '#fff', borderRadius: 14, padding: 14, marginBottom: 10, border: '1px solid #e5e7eb' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <div style={{ fontSize: 14, fontWeight: 900, flex: 1 }}>{t.subject}</div>
                <span style={{ background: `${s.color}20`, color: s.color, padding: '3px 8px', borderRadius: 6, fontSize: 10, fontWeight: 900 }}>{s.icon} {s.label}</span>
              </div>
              <div style={{ fontSize: 12, color: '#64748b', lineHeight: 1.6, marginBottom: 8 }}>{t.message}</div>
              {t.reply && (
                <div style={{ background: 'rgba(16,185,129,.08)', border: '1px solid rgba(16,185,129,.2)', borderRadius: 8, padding: 10, marginTop: 8 }}>
                  <div style={{ fontSize: 10, fontWeight: 900, color: '#059669', marginBottom: 4 }}>👨‍💼 رد الإدارة:</div>
                  <div style={{ fontSize: 12, color: '#334155', lineHeight: 1.6 }}>{t.reply}</div>
                </div>
              )}
              <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 8 }}>{new Date(t.created_at).toLocaleString('ar-EG')}</div>
            </div>
          );
        })}
      </div>
      {modal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.6)', zIndex: 100, display: 'flex', alignItems: 'flex-end' }} onClick={() => setModal(false)}>
          <div style={{ background: '#fff', borderRadius: '24px 24px 0 0', width: '100%', maxWidth: 500, margin: '0 auto', padding: '24px 20px 30px' }} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ fontSize: 18, fontWeight: 900, marginBottom: 16 }}>تذكرة جديدة</h3>
            <input type="text" placeholder="الموضوع *" value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} style={{ width: '100%', padding: 12, border: '1px solid #e5e7eb', borderRadius: 10, fontSize: 13, marginBottom: 10, boxSizing: 'border-box', fontFamily: 'inherit' }} />
            <textarea placeholder="اشرح مشكلتك *" value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} rows={5} style={{ width: '100%', padding: 12, border: '1px solid #e5e7eb', borderRadius: 10, fontSize: 13, marginBottom: 10, boxSizing: 'border-box', fontFamily: 'inherit', resize: 'vertical' }} />
            <select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })} style={{ width: '100%', padding: 12, border: '1px solid #e5e7eb', borderRadius: 10, fontSize: 13, marginBottom: 16, boxSizing: 'border-box', fontFamily: 'inherit' }}>
              <option value="low">منخفض</option>
              <option value="normal">عادي</option>
              <option value="high">مرتفع</option>
              <option value="urgent">عاجل</option>
            </select>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setModal(false)} style={{ flex: 1, padding: 12, background: '#f1f5f9', border: 'none', borderRadius: 10, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit' }}>إلغاء</button>
              <button onClick={save} disabled={saving} style={{ flex: 1, padding: 12, background: 'linear-gradient(135deg,#10b981,#059669)', color: '#fff', border: 'none', borderRadius: 10, fontWeight: 900, cursor: saving ? 'not-allowed' : 'pointer', fontFamily: 'inherit' }}>{saving ? '...' : '✓ إرسال'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
