'use client';
import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { useCurrentUser } from '@/lib/useCurrentUser';
import { useToast } from '@/components/Toast';
import { SkeletonList } from '@/components/Skeleton';
import EmptyState from '@/components/EmptyState';

export default function MyExpatPage() {
  const router = useRouter();
  const { user, loading: uL, dataOwnerName } = useCurrentUser();
  const { success, error: tE } = useToast();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (uL) return;
    if (!user) { router.replace('/login'); return; }
    load();
  }, [user, uL]);

  async function load() {
    if (!supabase || !dataOwnerName) { setLoading(false); return; }
    const { data } = await supabase.from('expat_services').select('*').eq('expat_name', dataOwnerName).order('created_at', { ascending: false });
    setItems(data || []);
    setLoading(false);
  }

  async function del(item) {
    if (!confirm('حذف هذه الخدمة؟')) return;
    await supabase.from('expat_services').delete().eq('id', item.id);
    success('✅ تم الحذف'); load();
  }

  if (uL || loading) return <div style={{ padding: 16, background: '#f8fafc', minHeight: '100vh' }}><SkeletonList count={3} /></div>;

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', paddingBottom: 80 }}>
      <div style={{ position: 'sticky', top: 0, zIndex: 10, background: '#7c3aed', padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <Link href="/merchant" style={{ color: '#fff', textDecoration: 'none', fontSize: 20, width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,.15)', borderRadius: '50%' }}>→</Link>
        <div style={{ flex: 1 }}>
          <div style={{ color: '#fff', fontSize: 16, fontWeight: 900 }}>🌍 خدمات المغتربين</div>
          <div style={{ color: 'rgba(255,255,255,.8)', fontSize: 11, marginTop: 2 }}>{items.length} خدمة</div>
        </div>
        <Link href="/merchant/expat/new" style={{ background: '#fff', color: '#7c3aed', border: 'none', padding: '8px 14px', borderRadius: 10, fontSize: 12, fontWeight: 900, textDecoration: 'none' }}>+ خدمة</Link>
      </div>

      <div style={{ padding: 16 }}>
        {items.length === 0 ? (
          <EmptyState icon="🌍" title="لا توجد خدمات" description="أضف أول خدمة مغتربين" actionLabel="+ إضافة خدمة" actionHref="/merchant/expat/new" />
        ) : items.map(s => (
          <div key={s.id} style={{ background: '#fff', borderRadius: 14, padding: 14, marginBottom: 10, border: '1px solid #e5e7eb' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <div style={{ fontSize: 14, fontWeight: 900, color: '#0f172a' }}>{s.service_type}</div>
              <span style={{ background: s.status === 'completed' ? 'rgba(16,185,129,.15)' : 'rgba(251,191,36,.15)', color: s.status === 'completed' ? '#10b981' : '#92400e', padding: '3px 10px', borderRadius: 6, fontSize: 10, fontWeight: 900, height: 'fit-content' }}>{s.status || 'قيد التنفيذ'}</span>
            </div>
            {s.description && <div style={{ fontSize: 12, color: '#64748b', lineHeight: 1.6, marginBottom: 10 }}>{s.description}</div>}
            <div style={{ fontSize: 11, color: '#64748b', marginBottom: 10 }}>👤 {s.recipient_name} · 📞 {s.recipient_phone}</div>
            {Number(s.amount) > 0 && <div style={{ fontSize: 14, fontWeight: 900, color: '#7c3aed', marginBottom: 10 }}>💰 {Number(s.amount).toLocaleString()} {s.currency}</div>}
            <button onClick={() => del(s)} style={{ width: '100%', padding: 8, background: 'rgba(220,38,38,.1)', color: '#dc2626', border: 'none', borderRadius: 8, fontSize: 11, fontWeight: 900, cursor: 'pointer', fontFamily: 'inherit' }}>🗑️ حذف</button>
          </div>
        ))}
      </div>
    </div>
  );
}
