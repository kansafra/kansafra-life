'use client';
import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/components/Toast';

export default function AdminSubscriptionsPage() {
  const router = useRouter();
  const { success, error: toastError } = useToast();
  const [items, setItems] = useState([]);
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [working, setWorking] = useState(null);

  useEffect(() => {
    const admin = JSON.parse(localStorage.getItem('sanad_admin') || 'null');
    if (!admin) { router.replace('/admin/login'); return; }
    loadData();
  }, [router]);

  async function loadData() {
    if (!supabase) return;
    setLoading(true);
    try {
      const [subsRes, plansRes] = await Promise.all([
        supabase.from('entity_subscriptions').select('*').order('created_at', { ascending: false }),
        supabase.from('subscription_plans').select('*').order('sort_order'),
      ]);
      setItems(subsRes.data || []);
      setPlans(plansRes.data || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }

  async function renew(entityId, planKey, days) {
    if (!confirm(`تجديد ${days} يوم للباقة ${planKey}؟`)) return;
    setWorking(entityId);
    try {
      const expiresAt = new Date(Date.now() + days * 86400000).toISOString();
      const { error } = await supabase.from('entity_subscriptions').upsert({
        entity_id: entityId,
        plan_id: planKey,
        expires_at: expiresAt,
      }, { onConflict: 'entity_id' });
      if (error) throw error;
      success('✅ تم التجديد');
      loadData();
    } catch (err) { toastError('فشل التجديد'); }
    finally { setWorking(null); }
  }

  const filtered = useMemo(() => {
    let list = items;
    if (filter === 'expiring') list = list.filter(i => i.expires_at && new Date(i.expires_at) < new Date(Date.now() + 7 * 86400000));
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(i => (i.entity_id || '').toLowerCase().includes(q) || (i.plan_id || '').toLowerCase().includes(q));
    }
    return list;
  }, [items, filter, search]);

  if (loading) return <div style={{ padding: 80, textAlign: 'center' }}>⏳</div>;

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', paddingBottom: 40 }}>
      <div style={{ background: '#0f172a', padding: '16px 20px', position: 'sticky', top: 0, zIndex: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Link href="/admin" style={{ color: '#fff', textDecoration: 'none', fontSize: 20 }}>←</Link>
          <h1 style={{ color: '#fff', fontSize: 18, fontWeight: 900, margin: 0, flex: 1 }}>💎 الاشتراكات</h1>
        </div>
        <input type="search" placeholder="🔍 ابحث باسم المتجر..." value={search} onChange={e => setSearch(e.target.value)} style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: 'none', fontSize: 13, outline: 'none', boxSizing: 'border-box', background: 'rgba(255,255,255,0.95)', marginTop: 12 }} />
        <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
          <button onClick={() => setFilter('all')} style={chip(filter === 'all')}>الكل</button>
          <button onClick={() => setFilter('expiring')} style={chip(filter === 'expiring')}>تنتهي قريباً</button>
        </div>
      </div>
      <div style={{ padding: 16, maxWidth: 800, margin: '0 auto' }}>
        {filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 40, background: '#fff', borderRadius: 16, color: '#64748b' }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>💎</div>
            <div style={{ fontSize: 15, fontWeight: 900 }}>لا توجد اشتراكات</div>
          </div>
        ) : filtered.map(i => {
          const daysLeft = i.expires_at ? Math.ceil((new Date(i.expires_at) - new Date()) / 86400000) : null;
          const isExpiring = daysLeft !== null && daysLeft <= 7 && daysLeft > 0;
          return (
            <div key={i.id} style={{ background: '#fff', borderRadius: 14, padding: 14, marginBottom: 10, border: isExpiring ? '2px solid #f59e0b' : '1px solid #e2e8f0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <div style={{ fontSize: 13, fontWeight: 900, color: '#0f172a' }}>🏪 {i.entity_id || '—'}</div>
                <div style={{ fontSize: 10, color: isExpiring ? '#f59e0b' : '#10b981', fontWeight: 900 }}>
                  {isExpiring ? `⚠️ ${daysLeft} يوم` : '✅ نشط'}
                </div>
              </div>
              <div style={{ fontSize: 11, color: '#64748b', marginBottom: 8 }}>
                الباقة: {i.plan_id || '—'} · ينتهي: {i.expires_at ? new Date(i.expires_at).toLocaleDateString('ar-SY') : '—'}
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                {[30, 90, 365].map(d => (
                  <button key={d} onClick={() => renew(i.entity_id, i.plan_id, d)} disabled={working === i.entity_id} style={{ flex: 1, padding: 10, background: 'rgba(16,185,129,0.1)', color: '#10b981', border: '1px solid rgba(16,185,129,0.3)', borderRadius: 8, fontSize: 12, fontWeight: 900, cursor: 'pointer', fontFamily: 'inherit' }}>
                    + {d === 365 ? 'سنة' : `${d} يوم`}
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function chip(active) { return { background: active ? '#fff' : 'rgba(255,255,255,0.1)', color: active ? '#0f172a' : '#fff', border: 'none', padding: '6px 14px', borderRadius: 20, fontSize: 11, fontWeight: 900, cursor: 'pointer', fontFamily: 'inherit' }; }
