'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import EmptyState from '@/components/EmptyState';

export default function CustomerPayments() {
  const router = useRouter();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let c = null;
    try { c = JSON.parse(localStorage.getItem('sanad_customer') || 'null'); } catch {}
    if (!c) { router.replace('/login'); return; }
    load(c.phone);
  }, [router]);

  async function load(phone) {
    if (!supabase) { setLoading(false); return; }
    const { data } = await supabase.from('orders').select('*').eq('customer_phone', phone).eq('status', 'done').order('created_at', { ascending: false });
    setItems(data || []);
    setLoading(false);
  }

  if (loading) return <div style={{ padding: 60, textAlign: 'center' }}>⏳</div>;

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', paddingBottom: 40 }}>
      <div style={{ background: '#0f4d3a', padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <Link href="/customer" style={{ color: '#fff', textDecoration: 'none', fontSize: 20 }}>→</Link>
        <div style={{ flex: 1, color: '#fff', fontSize: 16, fontWeight: 900 }}>💳 سجل المدفوعات</div>
      </div>
      <div style={{ padding: 16 }}>
        {items.length === 0 ? <EmptyState icon="💳" title="لا توجد مدفوعات" description="ستظهر هنا مدفوعاتك المكتملة" /> : items.map(o => (
          <div key={o.id} style={{ background: '#fff', borderRadius: 14, padding: 14, marginBottom: 10, border: '1px solid #e5e7eb' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <div style={{ fontSize: 12, fontWeight: 900, fontFamily: 'monospace' }}>#{o.order_code}</div>
              <div style={{ fontSize: 16, fontWeight: 900, color: '#10b981' }}>{Number(o.total).toLocaleString()} {o.currency || 'SYP'}</div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#64748b' }}>
              <span>🏪 {o.provider_name}</span>
              <span>💳 {o.payment_method || 'نقدي'}</span>
            </div>
            <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 6 }}>📅 {new Date(o.created_at).toLocaleDateString('ar-EG')}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
