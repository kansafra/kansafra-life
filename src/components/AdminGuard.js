'use client';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function AdminGuard({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [admin, setAdmin] = useState(null);

  const isPublic = pathname === '/admin/login';

  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem('sanad_admin') || 'null');
      setAdmin(stored);
    } catch {}
    setReady(true);
  }, []);

  useEffect(() => {
    if (isPublic || !ready) return;
    if (!admin) {
      const url = '/admin/login?next=' + encodeURIComponent(pathname);
      router.replace(url);
    }
  }, [ready, admin, isPublic, pathname, router]);

  if (isPublic) return children;
  if (!ready) return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' }}>⏳</div>;
  if (!admin) return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' }}>⏳</div>;

  return children;
}
