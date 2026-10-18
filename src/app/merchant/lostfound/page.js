'use client';
import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { useCurrentUser } from '@/lib/useCurrentUser';
import { useToast } from '@/components/Toast';
import { SkeletonList } from '@/components/Skeleton';
import EmptyState from '@/components/EmptyState';

export default function MyLostFoundPage() {
  const router = useRouter();
  const { user, loading: uL, dataOwnerName } = useCurrentUser();
  const { success, error: tE } = useToast();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (uL) return;
    if (!user) { router.replace('/login'); return; }
    load();
  }, [user, uL]);

  async function load() {
    if (!supabase || !dataOwnerName) { setLoading(false); return; }
    const { data } = await supabase.from('lost_found').select('*').eq('reporter_name', dataOwnerName).order('created_at', { ascending: false });
    setItems(data || []);
    setLoading(false);
  }

  const filtered = useMemo(() => {
    if (!search.trim()) return items;
    const q = search.trim().toLowerCase();
    return items.filter(i => (i.title || '').toLowerCase().includes(q));
  }, [items, search]);

  async function del(item) {
    if (!confirm(`حذف بلاغ "${item.title}"؟`)) return;
    await supabase.from('lost_found').delete().eq('id', item.id);
    success('✅ تم الحذف'); load();
  }

  async function toggleStatus(item) {
    const newType = item.item_type === 'مفقود' ? 'وجدته' : 'مفقود';
    await supabase.from('lost_found').update({ item_type: newType }).eq('id', item.id);
    success('✅ تم التحديث'); load();
  }

  if (uL || loading) return <div style={{ padding: 16, background: '#f8fafc', minHeight: '100vh' }}><SkeletonList count={3} /></div>;

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', paddingBottom: 80 }}>
      <div style={{ position: 'sticky', top: 0, zIndex: 10, background: '#dc2626', padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <Link href="/merchant" style={{ color: '#fff', textDecoration: 'none', fontSize: 20, width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,.15)', borderRadius: '50%' }}>→</Link>
        <div style={{ flex: 1 }}>
          <div style={{ color: '#fff', fontSize: 16, fontWeight: 900 }}>🔍 بلاغاتي</div>
          <div style={{ color: 'rgba(255,255,255,.8)', fontSize: 11, marginTop: 2 }}>{items.length} بلاغ</div>
        </div>
        <Link href="/merchant/lostfound/new" style={{ background: '#fff', color: '#dc2626', border: 'none', padding: '8px 14px', borderRadius: 10, fontSize: 12, fontWeight: 900, textDecoration: 'none' }}>+ بلاغ</Link>
      </div>

      <div style={{ padding: 16 }}>
        <input type="text" placeholder="🔍 ابحث في بلاغاتك..." value={search} onChange={(e) => setSearch(e.target.value)}
          style={{ width: '100%', padding: '12px 14px', border: '1px solid #e5e7eb', borderRadius: 12, fontSize: 13, fontFamily: 'inherit', boxSizing: 'border-box', outline: 'none', background: '#fff' }} />
      </div>

      <div style={{ padding: '0 16px' }}>
        {filtered.length === 0 ? (
          <EmptyState icon="🔍" title="لا توجد بلاغات" description="أضف بلاغك الأول" actionLabel="+ بلاغ جديد" actionHref="/merchant/lostfound/new" />
        ) : filtered.map(i => (
          <div key={i.id} style={{ background: '#fff', borderRadius: 14, padding: 14, marginBottom: 10, border: '1px solid #e5e7eb' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <div style={{ fontSize: 14, fontWeight: 900, color: '#0f172a' }}>{i.title}</div>
              <span style={{ background: i.item_type === 'وجدته' ? 'rgba(16,185,129,.15)' : 'rgba(220,38,38,.15)', color: i.item_type === 'وجدته' ? '#10b981' : '#dc2626', padding: '3px 10px', borderRadius: 6, fontSize: 10, fontWeight: 900, height: 'fit-content' }}>{i.item_type}</span>
            </div>
            {i.description && <div style={{ fontSize: 12, color: '#64748b', lineHeight: 1.6, marginBottom: 10 }}>{i.description}</div>}
            <div style={{ display: 'flex', gap: 6 }}>
              <button onClick={() => toggleStatus(i)} style={{ flex: 1, padding: 8, background: 'rgba(59,130,246,.1)', color: '#3b82f6', border: 'none', borderRadius: 8, fontSize: 11, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit' }}>🔄 تغيير الحالة</button>
              <button onClick={() => del(i)} style={{ padding: 8, background: 'rgba(220,38,38,.1)', color: '#dc2626', border: 'none', borderRadius: 8, fontSize: 11, cursor: 'pointer', fontFamily: 'inherit' }}>🗑️</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
