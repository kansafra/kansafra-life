'use client';
import { usePathname } from 'next/navigation';
import HijriDate from '@/components/HijriDate';

const HIDE_ON = ['/', '/register', '/login', '/logout', '/admin/login'];
const HIDE_PREFIXES = ['/admin', '/merchant', '/customer'];

export default function HijriBar() {
  const pathname = usePathname() || '';
  if (HIDE_ON.includes(pathname)) return null;
  if (HIDE_PREFIXES.some((p) => pathname.startsWith(p))) return null;

  return (
    <div style={{
      position: 'fixed', top: 'max(8px, env(safe-area-inset-top))', insetInlineEnd: 12,
      zIndex: 55, background: 'rgba(15,77,58,.88)', color: '#fff',
      padding: '5px 11px', borderRadius: 999, fontSize: 10.5, fontWeight: 800,
      backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)',
      boxShadow: '0 4px 14px rgba(15,77,58,.25)',
      border: '1px solid rgba(255,255,255,.15)',
      pointerEvents: 'none', lineHeight: 1.2,
    }}>
      <HijriDate compact style={{ color: '#fff' }} />
    </div>
  );
}
