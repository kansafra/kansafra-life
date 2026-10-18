'use client';
import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { useCurrentUser } from '@/lib/useCurrentUser';
import { useToast } from '@/components/Toast';
import { SkeletonList } from '@/components/Skeleton';
import EmptyState from '@/components/EmptyState';

export default function ModerationPage() {
  const router = useRouter();
  const { user, loading: userLoading, isOwner, isSectionAdmin, dataOwnerName } = useCurrentUser();
  const { error: toastError } = useToast();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('products');

  useEffect(() => {
    if (userLoading) return;
    if (!user) { router.replace('/login'); return; }
    load();
  }, [user, userLoading, tab]);

  async function load() {
    if (!supabase || !dataOwnerName) { setLoading(false); return; }
    setLoading(true);
    try {
      const table = tab === 'products' ? 'products' : tab === 'services' ? 'services' : 'announcements';
      let q = supabase.from(table).select('*').order('created_at', { ascending: false });
      
      // جلب العناصر المعلقة
      q = q.or('moderation_status.eq.pending,moderation_status.eq.draft');
      
      if (!isSectionAdmin) {
        if (tab === 'announcements') {
          q = q.eq('provider_name', dataOwnerName);
        } else {
          q = q.eq('provider_name', dataOwnerName);
        }
      }
      
      const { data, error } = await q;
      if (error) throw error;
      setItems(Array.isArray(data) ? data : []);
    } catch (e) { 
      toastError('تعذّر التحميل');
      setItems([]);
    }
    setLoading(false);
  }

  if (userLoading || loading) {
    return <div style={{ padding: 16, background: '#f8fafc', minHeight: '100vh' }}><SkeletonList count={3} /></div>;
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', paddingBottom: 40 }}>
      <div style={{ position: 'sticky', top: 0, zIndex: 10, background: '#0f4d3a', padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <Link href="/merchant" style={{ color: '#fff', textDecoration: 'none', fontSize: 20, width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,.1)', borderRadius: '50%' }}>→</Link>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 16, fontWeight: 900, color: '#fff' }}>⏳ قيد المراجعة</div>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,.7)', marginTop: 2 }}>{items.length} عنصر</div>
        </div>
      </div>

      <div style={{ padding: 16 }}>
        <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
          {[
            { k: 'products', l: '📦 منتجات' },
            { k: 'services', l: '🛠️ خدمات' },
            { k: 'announcements', l: '📢 إعلانات' },
          ].map(t => (
            <button key={t.k} onClick={() => setTab(t.k)} style={{
              flex: 1, padding: 12, background: tab === t.k ? '#0f4d3a' : '#fff',
              color: tab === t.k ? '#fff' : '#64748b',
              border: `1px solid ${tab === t.k ? '#0f4d3a' : '#e5e7eb'}`,
              borderRadius: 10, fontSize: 12, fontWeight: 900, cursor: 'pointer', fontFamily: 'inherit',
            }}>{t.l}</button>
          ))}
        </div>

        <div style={{ background: 'rgba(251,191,36,.1)', border: '1px solid rgba(251,191,36,.3)', borderRadius: 12, padding: 12, marginBottom: 16, fontSize: 12, color: '#92400e', fontWeight: 700, textAlign: 'center' }}>
          ⏳ هذه العناصر بانتظار موافقة الإدارة قبل نشرها
        </div>
      </div>

      <div style={{ padding: '0 16px' }}>
        {items.length === 0 ? (
          <EmptyState icon="✅" title="لا يوجد قيد المراجعة" description="كل عناصرك منشورة" />
        ) : items.map((it) => (
          <div key={it.id} style={{ background: '#fff', border: '1px solid #fbbf24', borderRadius: 14, padding: 14, marginBottom: 10 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 900, color: '#0f172a', marginBottom: 4 }}>{it.title || it.name || '—'}</div>
                {it.description && (
                  <div style={{ fontSize: 11.5, color: '#64748b', lineHeight: 1.6, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {it.description}
                  </div>
                )}
              </div>
              <div style={{ background: 'rgba(251,191,36,.15)', color: '#92400e', padding: '4px 10px', borderRadius: 8, fontSize: 10.5, fontWeight: 900 }}>
                ⏳ معلّق
              </div>
            </div>
            <div style={{ fontSize: 10.5, color: '#94a3b8', marginTop: 8 }}>
              📅 {new Date(it.created_at).toLocaleString('ar-EG')}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
