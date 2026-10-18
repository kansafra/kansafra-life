'use client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useEffect } from 'react';

export default function Page() {
  const router = useRouter();
  useEffect(() => {
    let stored = null;
    try { stored = JSON.parse(localStorage.getItem('sanad_admin') || 'null'); } catch {}
    if (!stored) router.replace('/admin/login');
  }, [router]);
  
  return (
    <div style={{ padding: 60, textAlign: 'center', background: '#f8fafc', minHeight: '100vh' }}>
      <div style={{ fontSize: 64, marginBottom: 20 }}>🚧</div>
      <h1 style={{ fontSize: 20, fontWeight: 900, marginBottom: 12 }}>قيد التطوير</h1>
      <p style={{ color: '#64748b', marginBottom: 24 }}>هذه الصفحة ستكون متاحة قريباً</p>
      <Link href="/admin/municipal" style={{ display: 'inline-block', padding: '12px 24px', background: '#1e40af', color: '#fff', borderRadius: 10, textDecoration: 'none', fontWeight: 900 }}>← العودة</Link>
    </div>
  );
}
