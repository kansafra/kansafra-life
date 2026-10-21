'use client';
import { usePermissions } from '@/lib/usePermissions';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function PermissionGate({ permission, children, silent = false }) {
  const { can, session, ready, roleInfo } = usePermissions();
  const router = useRouter();
  const allowed = can(permission);

  useEffect(() => {
    if (ready && session && !allowed && !silent) {
      const timer = setTimeout(() => router.push('/merchant'), 2500);
      return () => clearTimeout(timer);
    }
  }, [ready, session, allowed, router, silent]);

  if (!ready) return <div style={{ padding: 80, textAlign: 'center', color: '#94a3b8' }}>⏳</div>;
  if (!session) return null;
  if (allowed) return children;
  if (silent) return null;

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div style={{ maxWidth: 420, textAlign: 'center', background: '#fff', borderRadius: 24, padding: 40, boxShadow: '0 10px 40px rgba(0,0,0,0.08)' }}>
        <div style={{ fontSize: 72, marginBottom: 16 }}>🔒</div>
        <h1 style={{ fontSize: 22, fontWeight: 900, color: '#0f172a', marginBottom: 8 }}>غير مصرح لك</h1>
        <p style={{ fontSize: 13.5, color: '#64748b', lineHeight: 1.7, marginBottom: 20 }}>
          دورك الحالي (<strong style={{ color: roleInfo.color }}>{roleInfo.icon} {roleInfo.label}</strong>) لا يملك صلاحية الوصول إلى هذه الصفحة.
        </p>
        <p style={{ fontSize: 11.5, color: '#94a3b8', marginBottom: 20 }}>
          سيتم إرجاعك للوحة الرئيسية تلقائياً...
        </p>
        <button onClick={() => router.push('/merchant')} style={{ padding: '12px 24px', background: '#0f4d3a', color: '#fff', border: 'none', borderRadius: 12, fontSize: 14, fontWeight: 900, cursor: 'pointer', fontFamily: 'inherit' }}>
          ← العودة الآن
        </button>
      </div>
    </div>
  );
}
