'use client';
import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/components/Toast';

const TABS = [
  { key: 'reviews', label: '⭐ التقييمات', table: 'reviews' },
  { key: 'announcements', label: '📢 الإعلانات', table: 'announcements' },
  { key: 'sos', label: '🚨 طلبات الطوارئ', table: 'sos_requests' },
];

export default function AdminModerationPage() {
  const router = useRouter();
  const { success, error: toastError } = useToast();

  const [tab, setTab] = useState('reviews');
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(null);
  const [expandedId, setExpandedId] = useState(null);

  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem('sanad_admin') || 'null');
    if (!stored) { router.replace('/admin/login'); return; }
  }, [router]);

  useEffect(() => {
    loadItems();
  }, [tab]);

  async function loadItems() {
    if (!supabase) return;
    setLoading(true);
    setExpandedId(null);
    try {
      const currentTab = TABS.find(t => t.key === tab);
      const { data, error } = await supabase.from(currentTab.table).select('*').order('created_at', { ascending: false }).limit(200);
      if (error) {
        // قد لا يوجد عمود created_at في بعض الجداول
        const { data: d2, error: e2 } = await supabase.from(currentTab.table).select('*').limit(200);
        if (e2) throw e2;
        setItems(d2 || []);
      } else {
        setItems(data || []);
      }
    } catch (e) {
      console.error(e);
      setItems([]);
    } finally { setLoading(false); }
  }

  // استخراج حالة المراقبة من السجل
  function getModerationStatus(item) {
    if (item.moderation_status) return item.moderation_status;
    if (item.status) return item.status;
    if (item.is_active === false) return 'rejected';
    return 'pending';
  }

  async function updateStatus(item, newStatus) {
    setWorking(item.id);
    const currentTab = TABS.find(t => t.key === tab);
    const hasModerationField = item.moderation_status !== undefined;
    const hasStatusField = item.status !== undefined;

    let updates = {};
    if (hasModerationField) updates.moderation_status = newStatus;
    else if (hasStatusField) updates.status = newStatus;
    else updates.moderation_status = newStatus;

    // تحديث الحقول الإضافية إن وجدت
    if (item.moderation_status !== undefined) {
      updates.moderated_at = new Date().toISOString();
    }
    if (newStatus === 'rejected') updates.is_active = false;
    if (newStatus === 'approved') updates.is_active = true;

    const { error } = await supabase.from(currentTab.table).update(updates).eq('id', item.id);
    if (error) {
      toastError('فشل التحديث: ' + error.message);
    } else {
      success(newStatus === 'approved' ? '✅ تم القبول' : newStatus === 'rejected' ? '❌ تم الرفض' : '✅ تم التحديث');
      setItems(prev => prev.map(i => i.id === item.id ? { ...i, ...updates } : i));
    }
    setWorking(null);
  }

  async function deleteItem(item) {
    if (!confirm('حذف هذا السجل نهائياً؟')) return;
    setWorking(item.id);
    const currentTab = TABS.find(t => t.key === tab);
    const { error } = await supabase.from(currentTab.table).delete().eq('id', item.id);
    if (error) toastError('فشل الحذف');
    else { success('🗑️ تم الحذف'); setItems(prev => prev.filter(i => i.id !== item.id)); }
    setWorking(null);
  }

  function getTitle(item) {
    return item.title || item.customer_name || item.name || item.full_name || item.entity_name || `سجل #${item.id?.slice(0, 8) || ''}`;
  }

  function getBody(item) {
    return item.comment || item.content || item.body || item.description || item.message || item.reason || '';
  }

  function getRating(item) {
    return item.rating || item.stars || null;
  }

  const stats = useMemo(() => {
    const pending = items.filter(i => getModerationStatus(i) === 'pending').length;
    const approved = items.filter(i => getModerationStatus(i) === 'approved').length;
    const rejected = items.filter(i => ['rejected', 'hidden'].includes(getModerationStatus(i))).length;
    return { total: items.length, pending, approved, rejected };
  }, [items]);

  if (loading) return <div style={{ padding: 80, textAlign: 'center' }}>⏳</div>;

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', paddingBottom: 40 }}>
      <div style={{ background: '#0f172a', padding: '16px 20px', position: 'sticky', top: 0, zIndex: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
          <Link href="/admin" style={{ color: '#fff', textDecoration: 'none', fontSize: 20 }}>→</Link>
          <h1 style={{ color: '#fff', fontSize: 18, fontWeight: 900, margin: 0, flex: 1 }}>🛡️ المراقبة والمحتوى</h1>
          {stats.pending > 0 && (
            <div style={{ background: '#f59e0b', color: '#fff', padding: '4px 10px', borderRadius: 8, fontSize: 11, fontWeight: 900 }}>
              {stats.pending} بانتظار المراجعة
            </div>
          )}
        </div>
        <div style={{ display: 'flex', gap: 6, overflowX: 'auto' }}>
          {TABS.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)} style={{ background: tab === t.key ? '#fff' : 'rgba(255,255,255,0.1)', color: tab === t.key ? '#0f172a' : '#fff', border: 'none', padding: '8px 16px', borderRadius: 20, fontSize: 12, fontWeight: 900, cursor: 'pointer', whiteSpace: 'nowrap', fontFamily: 'inherit' }}>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div style={{ padding: 16 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginBottom: 16 }}>
          <StatBox label="الكل" value={stats.total} color="#0f172a" />
          <StatBox label="معلق" value={stats.pending} color="#f59e0b" />
          <StatBox label="مقبول" value={stats.approved} color="#10b981" />
          <StatBox label="مرفوض" value={stats.rejected} color="#ef4444" />
        </div>

        {items.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 40, background: '#fff', borderRadius: 16, color: '#64748b' }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>📭</div>
            <div style={{ fontSize: 15, fontWeight: 900 }}>لا توجد سجلات في هذا القسم</div>
          </div>
        ) : (
          items.map(item => {
            const status = getModerationStatus(item);
            const isExpanded = expandedId === item.id;
            const isWorking = working === item.id;
            const rating = getRating(item);
            const body = getBody(item);

            const statusMap = {
              pending: { bg: 'rgba(245,158,11,0.1)', color: '#f59e0b', label: '⏳ قيد المراجعة' },
              approved: { bg: 'rgba(16,185,129,0.1)', color: '#10b981', label: '✅ مقبول' },
              rejected: { bg: 'rgba(239,68,68,0.1)', color: '#ef4444', label: '❌ مرفوض' },
              hidden: { bg: 'rgba(148,163,184,0.15)', color: '#64748b', label: '🙈 مخفي' },
            };
            const st = statusMap[status] || statusMap.pending;

            return (
              <div key={item.id} style={{ background: '#fff', borderRadius: 16, marginBottom: 12, border: '1px solid #e2e8f0', overflow: 'hidden', opacity: isWorking ? 0.6 : 1 }}>
                <div style={{ padding: 14, cursor: 'pointer' }} onClick={() => setExpandedId(isExpanded ? null : item.id)}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8, gap: 10 }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 900, color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {getTitle(item)}
                      </div>
                      {rating && (
                        <div style={{ fontSize: 12, color: '#fbbf24', marginTop: 2, letterSpacing: 1 }}>
                          {'★'.repeat(rating)}{'☆'.repeat(5 - rating)}
                        </div>
                      )}
                    </div>
                    <div style={{ background: st.bg, color: st.color, padding: '4px 10px', borderRadius: 8, fontSize: 10, fontWeight: 900, whiteSpace: 'nowrap' }}>
                      {st.label}
                    </div>
                  </div>
                  {body && (
                    <div style={{ fontSize: 12, color: '#64748b', marginTop: 4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      {body}
                    </div>
                  )}
                  <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 6 }}>
                    {item.created_at ? new Date(item.created_at).toLocaleString('ar-SY') : '—'}
                  </div>
                </div>

                {isExpanded && (
                  <div style={{ padding: '0 14px 14px', borderTop: '1px solid #f1f5f9', paddingTop: 12 }}>
                    {body && (
                      <div style={{ background: '#f8fafc', padding: 12, borderRadius: 10, fontSize: 12, color: '#475569', lineHeight: 1.6, marginBottom: 12, whiteSpace: 'pre-wrap' }}>
                        {body}
                      </div>
                    )}

                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      {status !== 'approved' && (
                        <button onClick={() => updateStatus(item, 'approved')} disabled={isWorking} style={btnStyle('#10b981', '#fff')}>✓ قبول</button>
                      )}
                      {status !== 'rejected' && (
                        <button onClick={() => updateStatus(item, 'rejected')} disabled={isWorking} style={btnStyle('rgba(239,68,68,0.1)', '#ef4444')}>❌ رفض</button>
                      )}
                      {status === 'rejected' && (
                        <button onClick={() => updateStatus(item, 'approved')} disabled={isWorking} style={btnStyle('#0f4d3a', '#fff')}>🔄 استرجاع</button>
                      )}
                      <button onClick={() => deleteItem(item)} disabled={isWorking} style={btnStyle('rgba(148,163,184,0.15)', '#64748b')}>🗑️ حذف</button>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

function StatBox({ label, value, color }) {
  return (
    <div style={{ background: '#fff', borderRadius: 12, padding: 12, textAlign: 'center', border: '1px solid #e2e8f0' }}>
      <div style={{ fontSize: 18, fontWeight: 900, color, marginBottom: 2 }}>{value}</div>
      <div style={{ fontSize: 9.5, color: '#64748b', fontWeight: 800 }}>{label}</div>
    </div>
  );
}

const btnStyle = (bg, color) => ({ background: bg, color, border: 'none', padding: '10px 14px', borderRadius: 8, fontSize: 12, fontWeight: 900, cursor: 'pointer', fontFamily: 'inherit', flex: 1, minWidth: 80 });
