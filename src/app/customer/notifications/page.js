'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/components/Toast';
import EmptyState from '@/components/EmptyState';

export default function CustomerNotifications() {
  const router = useRouter();
  const { success } = useToast();
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
    const { data } = await supabase.from('customer_notifications').select('*').eq('customer_phone', phone).order('created_at', { ascending: false });
    setItems(data || []);
    setLoading(false);
  }

  async function markRead(n) {
    await supabase.from('customer_notifications').update({ is_read: true }).eq('id', n.id);
    setItems(prev => prev.map(x => x.id === n.id ? { ...x, is_read: true } : x));
  }

  async function markAll() {
    const phone = JSON.parse(localStorage.getItem('sanad_customer') || '{}').phone;
    await supabase.from('customer_notifications').update({ is_read: true }).eq('customer_phone', phone);
    success('✅ تم تعليم الكل كمقروء');
    load(phone);
  }

  if (loading) return <div style={{ padding: 60, textAlign: 'center' }}>⏳</div>;

  const unread = items.filter(n => !n.is_read).length;

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', paddingBottom: 40 }}>
      <div style={{ background: '#0f4d3a', padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <Link href="/customer" style={{ color: '#fff', textDecoration: 'none', fontSize: 20 }}>→</Link>
        <div style={{ flex: 1, color: '#fff', fontSize: 16, fontWeight: 900 }}>🔔 الإشعارات {unread > 0 && `(${unread})`}</div>
        {unread > 0 && <button onClick={markAll} style={{ background: 'rgba(255,255,255,.15)', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: 8, fontSize: 11, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit' }}>تعليم الكل</button>}
      </div>
      <div style={{ padding: 16 }}>
        {items.length === 0 ? <EmptyState icon="🔔" title="لا توجد إشعارات" description="ستظهر إشعاراتك هنا" /> : items.map(n => (
          <div key={n.id} onClick={() => !n.is_read && markRead(n)} style={{ background: n.is_read ? '#fff' : 'rgba(59,130,246,.05)', borderRadius: 14, padding: 14, marginBottom: 10, border: `1px solid ${n.is_read ? '#e5e7eb' : '#3b82f6'}`, cursor: n.is_read ? 'default' : 'pointer' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <div style={{ fontSize: 13, fontWeight: 900, color: '#0f172a' }}>{n.title}</div>
              {!n.is_read && <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#3b82f6' }} />}
            </div>
            {n.body && <div style={{ fontSize: 12, color: '#64748b', lineHeight: 1.6 }}>{n.body}</div>}
            <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 6 }}>{new Date(n.created_at).toLocaleString('ar-EG')}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
