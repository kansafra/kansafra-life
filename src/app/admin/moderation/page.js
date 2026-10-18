'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/components/Toast';
import { SkeletonList } from '@/components/Skeleton';
import EmptyState from '@/components/EmptyState';

export default function AdminModerationPage() {
  const router = useRouter();
  const { success, error: tE } = useToast();
  const [tab, setTab] = useState('products');
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(null);

  useEffect(() => {
    let stored = null;
    try { stored = JSON.parse(localStorage.getItem('sanad_admin') || 'null'); } catch {}
    if (!stored) { router.replace('/admin/login'); return; }
    load();
  }, [router, tab]);

  async function load() {
    if (!supabase) { setLoading(false); return; }
    setLoading(true);
    try {
      const table = tab === 'products' ? 'products' : tab === 'services' ? 'services' : 'announcements';
      const { data, error } = await supabase.from(table).select('*').in('moderation_status', ['pending', 'draft']).order('created_at', { ascending: false });
      if (error) throw error;
      setItems(Array.isArray(data) ? data : []);
    } catch (e) { tE('تعذّر التحميل'); setItems([]); }
    setLoading(false);
  }

  async function approve(item) {
    if (!confirm('الموافقة على النشر؟')) return;
    setProcessing(item.id);
    try {
      const table = tab === 'products' ? 'products' : tab === 'services' ? 'services' : 'announcements';
      const { error } = await supabase.from(table).update({
        moderation_status: 'approved',
        moderated_at: new Date().toISOString(),
        moderated_by: 'admin',
      }).eq('id', item.id);
      if (error) throw error;
      success('✅ تمت الموافقة');
      setItems(prev => prev.filter(x => x.id !== item.id));
    } catch (e) { tE('تعذّر: ' + e.message); }
    setProcessing(null);
  }

  async function reject(item) {
    const reason = prompt('سبب الرفض:');
    if (reason === null) return;
    setProcessing(item.id);
    try {
      const table = tab === 'products' ? 'products' : tab === 'services' ? 'services' : 'announcements';
      const { error } = await supabase.from(table).update({
        moderation_status: 'rejected',
        moderation_notes: reason || 'مرفوض',
        moderated_at: new Date().toISOString(),
        moderated_by: 'admin',
      }).eq('id', item.id);
      if (error) throw error;
      success('❌ تم الرفض');
      setItems(prev => prev.filter(x => x.id !== item.id));
    } catch (e) { tE('تعذّر: ' + e.message); }
    setProcessing(null);
  }

  if (loading) return <div style={{ padding: 16, background: '#f8fafc', minHeight: '100vh' }}><SkeletonList count={4} /></div>;

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', paddingBottom: 40 }}>
      <div style={{ position: 'sticky', top: 0, zIndex: 10, background: '#0f4d3a', padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <Link href="/admin" style={{ color: '#fff', textDecoration: 'none', fontSize: 20, width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,.1)', borderRadius: '50%' }}>→</Link>
        <div style={{ flex: 1, color: '#fff', fontSize: 16, fontWeight: 900 }}>⏳ المراجعة ({items.length})</div>
      </div>

      <div style={{ padding: 16 }}>
        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          {[['products','📦'],['services','🛠️'],['announcements','📢']].map(([k, e]) => (
            <button key={k} onClick={() => setTab(k)} style={{ flex: 1, padding: 12, background: tab === k ? '#0f4d3a' : '#fff', color: tab === k ? '#fff' : '#64748b', border: `1px solid ${tab === k ? '#0f4d3a' : '#e5e7eb'}`, borderRadius: 10, fontSize: 12, fontWeight: 900, cursor: 'pointer', fontFamily: 'inherit' }}>{e} {k === 'products' ? 'منتجات' : k === 'services' ? 'خدمات' : 'إعلانات'}</button>
          ))}
        </div>

        {items.length === 0 ? <EmptyState icon="✅" title="لا يوجد قيد المراجعة" description="كل العناصر منشورة" /> : items.map(it => (
          <div key={it.id} style={{ background: '#fff', border: '2px solid #fbbf24', borderRadius: 14, padding: 14, marginBottom: 10 }}>
            <div style={{ fontSize: 14, fontWeight: 900, color: '#0f172a', marginBottom: 4 }}>{it.title || it.name || '—'}</div>
            {it.description && <div style={{ fontSize: 12, color: '#64748b', lineHeight: 1.6, marginBottom: 8 }}>{it.description}</div>}
            {it.provider_name && <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 4 }}>🏪 {it.provider_name}</div>}
            {Number(it.price) > 0 && <div style={{ fontSize: 13, fontWeight: 900, color: '#0f4d3a', marginBottom: 8 }}>{Number(it.price).toLocaleString()} {it.currency || 'SYP'}</div>}
            <div style={{ fontSize: 10, color: '#94a3b8', marginBottom: 10 }}>📅 {new Date(it.created_at).toLocaleString('ar-EG')}</div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => approve(it)} disabled={processing === it.id} style={{ flex: 1, padding: 10, background: 'linear-gradient(135deg,#10b981,#059669)', color: '#fff', border: 'none', borderRadius: 8, fontSize: 12, fontWeight: 900, cursor: processing === it.id ? 'not-allowed' : 'pointer', fontFamily: 'inherit' }}>{processing === it.id ? '...' : '✓ موافقة'}</button>
              <button onClick={() => reject(it)} disabled={processing === it.id} style={{ flex: 1, padding: 10, background: 'rgba(220,38,38,.1)', color: '#dc2626', border: '1px solid rgba(220,38,38,.3)', borderRadius: 8, fontSize: 12, fontWeight: 900, cursor: processing === it.id ? 'not-allowed' : 'pointer', fontFamily: 'inherit' }}>✕ رفض</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
