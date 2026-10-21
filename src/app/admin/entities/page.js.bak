'use client';
import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/components/Toast';
import { SkeletonList } from '@/components/Skeleton';
import EmptyState from '@/components/EmptyState';

const TYPES = { merchant:'متجر', restaurant:'مطعم', doctor:'طبيب', pharmacy:'صيدلية', school:'مدرسة', mosque:'جامع', charity:'جمعية', sports:'رياضة', hotel:'فندق', office:'مكتب', exchange:'صرافة', transport:'مواصلات', memory:'ذاكرة', municipality:'بلدية', craftsman:'حرفي', workshop:'ورشة', isp:'إنترنت' };

export default function AdminEntitiesPage() {
  const router = useRouter();
  const { success, error: tE } = useToast();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    let stored = null;
    try { stored = JSON.parse(localStorage.getItem('sanad_admin') || 'null'); } catch {}
    if (!stored) { router.replace('/admin/login'); return; }
    load();
  }, [router]);

  async function load() {
    if (!supabase) { setLoading(false); return; }
    const { data } = await supabase.from('entities').select('*').order('created_at', { ascending: false });
    setItems(data || []);
    setLoading(false);
  }

  const filtered = useMemo(() => {
    let list = items;
    if (filter === 'pending') list = list.filter(e => e.approval_status === 'pending' || e.is_active === false);
    else if (filter === 'active') list = list.filter(e => e.is_active === true && e.approval_status !== 'pending');
    else if (filter === 'trusted') list = list.filter(e => e.is_trusted === true);
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(e => (e.display_name || '').toLowerCase().includes(q) || (e.phone || '').includes(q));
    }
    return list;
  }, [items, filter, search]);

  async function toggleActive(e) {
    if (!confirm(`${e.is_active ? 'إيقاف' : 'تفعيل'} "${e.display_name}"؟`)) return;
    await supabase.from('entities').update({ is_active: !e.is_active }).eq('id', e.id);
    success('✅ تم'); load();
  }

  async function toggleTrusted(e) {
    await supabase.from('entities').update({ is_trusted: !e.is_trusted }).eq('id', e.id);
    success('✅ تم'); load();
  }

  async function approve(e) {
    await supabase.from('entities').update({ is_active: true, approval_status: 'approved', approved_at: new Date().toISOString() }).eq('id', e.id);
    success('✅ تمت الموافقة'); load();
  }

  async function reject(e) {
    const reason = prompt('سبب الرفض:');
    if (reason === null) return;
    await supabase.from('entities').update({ approval_status: 'rejected', rejection_reason: reason || 'مرفوض' }).eq('id', e.id);
    success('❌ تم الرفض'); load();
  }

  if (loading) return <div style={{ padding: 16, background: '#f8fafc', minHeight: '100vh' }}><SkeletonList count={4} /></div>;

  const pendingCount = items.filter(e => e.approval_status === 'pending').length;

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', paddingBottom: 40 }}>
      <div style={{ position: 'sticky', top: 0, zIndex: 10, background: '#0f4d3a', padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <Link href="/admin" style={{ color: '#fff', textDecoration: 'none', fontSize: 20, width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,.1)', borderRadius: '50%' }}>→</Link>
        <div style={{ flex: 1, color: '#fff', fontSize: 16, fontWeight: 900 }}>🏪 المزودون ({items.length})</div>
      </div>

      <div style={{ padding: 16 }}>
        {pendingCount > 0 && (
          <div style={{ background: 'rgba(251,191,36,.15)', border: '1px solid rgba(251,191,36,.4)', borderRadius: 12, padding: 12, marginBottom: 12, fontSize: 13, fontWeight: 900, color: '#92400e', textAlign: 'center' }}>
            ⏳ {pendingCount} طلب موافقة جديد
          </div>
        )}
        <input type="text" placeholder="🔍 ابحث بالاسم أو الهاتف..." value={search} onChange={(e) => setSearch(e.target.value)}
          style={{ width: '100%', padding: '12px 14px', border: '1px solid #e5e7eb', borderRadius: 12, fontSize: 13, fontFamily: 'inherit', boxSizing: 'border-box', outline: 'none', background: '#fff', marginBottom: 10 }} />
        <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 4 }}>
          {[['all','الكل', items.length],['pending','طلبات', pendingCount],['active','نشط', items.filter(e=>e.is_active&&e.approval_status!=='pending').length],['trusted','موثوق', items.filter(e=>e.is_trusted).length]].map(([k,l,n]) => (
            <button key={k} onClick={() => setFilter(k)} style={{ padding: '6px 12px', background: filter === k ? '#0f4d3a' : '#fff', color: filter === k ? '#fff' : '#64748b', border: `1px solid ${filter === k ? '#0f4d3a' : '#e5e7eb'}`, borderRadius: 8, fontSize: 11, fontWeight: 800, cursor: 'pointer', whiteSpace: 'nowrap', fontFamily: 'inherit' }}>{l} ({n})</button>
          ))}
        </div>
      </div>

      <div style={{ padding: '0 16px' }}>
        {filtered.length === 0 ? <EmptyState icon="🏪" title="لا يوجد مزودون" /> : filtered.map(e => {
          const isPending = e.approval_status === 'pending';
          return (
            <div key={e.id} style={{ background: '#fff', border: isPending ? '2px solid #fbbf24' : '1px solid #e5e7eb', borderRadius: 14, padding: 14, marginBottom: 10, opacity: e.is_active ? 1 : 0.6 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 900, marginBottom: 4 }}>{e.display_name}</div>
                  <div style={{ fontSize: 11, color: '#64748b', direction: 'ltr', textAlign: 'right' }}>📞 {e.phone || '—'}</div>
                  <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>{TYPES[e.entity_type] || e.entity_type || '—'}</div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'flex-end' }}>
                  {isPending && <span style={{ background: 'rgba(251,191,36,.2)', color: '#92400e', padding: '3px 8px', borderRadius: 6, fontSize: 9.5, fontWeight: 900 }}>⏳ معلق</span>}
                  {e.is_trusted && <span style={{ background: 'rgba(16,185,129,.15)', color: '#10b981', padding: '3px 8px', borderRadius: 6, fontSize: 9.5, fontWeight: 900 }}>✓ موثوق</span>}
                  {!e.is_active && <span style={{ background: 'rgba(220,38,38,.1)', color: '#dc2626', padding: '3px 8px', borderRadius: 6, fontSize: 9.5, fontWeight: 900 }}>⏸ معطل</span>}
                </div>
              </div>
              {isPending ? (
                <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
                  <button onClick={() => approve(e)} style={{ flex: 1, padding: 8, background: 'linear-gradient(135deg,#10b981,#059669)', color: '#fff', border: 'none', borderRadius: 8, fontSize: 11, fontWeight: 900, cursor: 'pointer', fontFamily: 'inherit' }}>✓ موافقة</button>
                  <button onClick={() => reject(e)} style={{ flex: 1, padding: 8, background: 'rgba(220,38,38,.1)', color: '#dc2626', border: '1px solid rgba(220,38,38,.3)', borderRadius: 8, fontSize: 11, fontWeight: 900, cursor: 'pointer', fontFamily: 'inherit' }}>✕ رفض</button>
                </div>
              ) : (
                <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
                  <button onClick={() => toggleActive(e)} style={{ flex: 1, padding: 8, background: e.is_active ? 'rgba(220,38,38,.1)' : 'rgba(16,185,129,.15)', color: e.is_active ? '#dc2626' : '#10b981', border: 'none', borderRadius: 8, fontSize: 11, fontWeight: 900, cursor: 'pointer', fontFamily: 'inherit' }}>{e.is_active ? '⏸ إيقاف' : '▶ تفعيل'}</button>
                  <button onClick={() => toggleTrusted(e)} style={{ flex: 1, padding: 8, background: e.is_trusted ? 'rgba(100,116,139,.1)' : 'rgba(251,191,36,.15)', color: e.is_trusted ? '#64748b' : '#92400e', border: 'none', borderRadius: 8, fontSize: 11, fontWeight: 900, cursor: 'pointer', fontFamily: 'inherit' }}>{e.is_trusted ? '❌ إلغاء التوثيق' : '✓ توثيق'}</button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
