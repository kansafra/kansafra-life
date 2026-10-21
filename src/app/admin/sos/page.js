'use client';
import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/components/Toast';

export default function AdminSOSPage() {
  const router = useRouter();
  const { success } = useToast();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('active');

  useEffect(() => {
    const admin = JSON.parse(localStorage.getItem('sanad_admin') || 'null');
    if (!admin) { router.replace('/admin/login'); return; }
    loadSOS();
  }, [router]);

  async function loadSOS() {
    if (!supabase) return;
    setLoading(true);
    try {
      const { data } = await supabase.from('sos_requests').select('*').order('created_at', { ascending: false });
      setItems(data || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }

  async function resolve(id) {
    const { error } = await supabase.from('sos_requests').update({ status: 'resolved' }).eq('id', id);
    if (!error) { success('✅ تم الحل'); setItems(prev => prev.map(x => x.id === id ? { ...x, status: 'resolved' } : x)); }
  }

  const filtered = useMemo(() => {
    if (filter === 'all') return items;
    return items.filter(i => i.status === filter);
  }, [items, filter]);

  const activeCount = items.filter(i => i.status === 'active').length;

  if (loading) return <div style={{ padding: 80, textAlign: 'center' }}>⏳</div>;

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', paddingBottom: 40 }}>
      <div style={{ background: '#0f172a', padding: '16px 20px', position: 'sticky', top: 0, zIndex: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Link href="/admin" style={{ color: '#fff', textDecoration: 'none', fontSize: 20 }}>←</Link>
          <h1 style={{ color: '#fff', fontSize: 18, fontWeight: 900, margin: 0, flex: 1 }}>🚨 الطوارئ</h1>
          {activeCount > 0 && <div style={{ background: '#ef4444', color: '#fff', padding: '4px 10px', borderRadius: 8, fontSize: 11, fontWeight: 900 }}>{activeCount}</div>}
        </div>
        <div style={{ display: 'flex', gap: 6, marginTop: 12 }}>
          {['active', 'resolved', 'all'].map(f => (
            <button key={f} onClick={() => setFilter(f)} style={{ background: filter === f ? '#fff' : 'rgba(255,255,255,0.1)', color: filter === f ? '#0f172a' : '#fff', border: 'none', padding: '6px 14px', borderRadius: 20, fontSize: 11, fontWeight: 900, cursor: 'pointer', fontFamily: 'inherit' }}>
              {f === 'active' ? 'نشطة' : f === 'resolved' ? 'محلولة' : 'الكل'}
            </button>
          ))}
        </div>
      </div>
      <div style={{ padding: 16, maxWidth: 800, margin: '0 auto' }}>
        {filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 40, background: '#fff', borderRadius: 16, color: '#64748b' }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>✅</div>
            <div style={{ fontSize: 15, fontWeight: 900 }}>لا توجد نداءات</div>
          </div>
        ) : filtered.map(i => (
          <div key={i.id} style={{ background: '#fff', borderRadius: 14, padding: 14, marginBottom: 10, border: i.status === 'active' ? '2px solid #ef4444' : '1px solid #e2e8f0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <div style={{ fontSize: 13, fontWeight: 900, color: '#0f172a' }}>🚨 {i.type === 'medical' ? 'إسعاف' : i.type === 'fire' ? 'حريق' : i.type === 'security' ? 'أمن' : 'أخرى'}</div>
              <div style={{ fontSize: 10, color: i.status === 'active' ? '#ef4444' : '#10b981', fontWeight: 900 }}>{i.status === 'active' ? '🔴 نشط' : '✅ محلول'}</div>
            </div>
            {i.description && <div style={{ fontSize: 12, color: '#475569', marginBottom: 8 }}>{i.description}</div>}
            {i.phone && <div style={{ fontSize: 11, color: '#64748b', marginBottom: 4 }}>📱 {i.phone}</div>}
            {i.address && <div style={{ fontSize: 11, color: '#64748b', marginBottom: 8 }}>📍 {i.address}</div>}
            <div style={{ display: 'flex', gap: 6 }}>
              {i.status === 'active' && <button onClick={() => resolve(i.id)} style={{ flex: 1, padding: 10, background: 'rgba(16,185,129,0.1)', color: '#10b981', border: '1px solid rgba(16,185,129,0.3)', borderRadius: 8, fontSize: 12, fontWeight: 900, cursor: 'pointer', fontFamily: 'inherit' }}>✅ حل</button>}
              {i.phone && <a href={`tel:${i.phone}`} style={{ flex: 1, padding: 10, background: 'rgba(14,165,233,0.1)', color: '#0284c7', border: '1px solid rgba(14,165,233,0.3)', borderRadius: 8, fontSize: 12, fontWeight: 900, textAlign: 'center', textDecoration: 'none' }}>📞</a>}
              {i.lat && i.lng && <a href={`https://www.google.com/maps?q=${i.lat},${i.lng}`} target="_blank" rel="noreferrer" style={{ flex: 1, padding: 10, background: 'rgba(139,92,246,0.1)', color: '#8b5cf6', border: '1px solid rgba(139,92,246,0.3)', borderRadius: 8, fontSize: 12, fontWeight: 900, textAlign: 'center', textDecoration: 'none' }}>🗺️</a>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
