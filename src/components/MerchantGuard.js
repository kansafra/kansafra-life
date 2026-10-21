'use client';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { usePermissions } from '@/lib/usePermissions';
import PermissionGate from './PermissionGate';

const PATH_PERMISSIONS = {
  '/merchant/orders': 'orders.read',
  '/merchant/products': 'products.read',
  '/merchant/customers': 'customers.read',
  '/merchant/employees': 'employees.read',
  '/merchant/debts': 'debts.read',
  '/merchant/invoices': 'invoices.read',
  '/merchant/reports': 'reports.read',
  '/merchant/coupons': 'coupons.read',
  '/merchant/announcements': 'announcements.read',
  '/merchant/settings': 'settings.read',
  '/merchant/payment_methods': 'settings.read',
  '/merchant/teachers': 'teachers.read',
  '/merchant/classes': 'classes.read',
  '/merchant/students': 'students.read',
  '/merchant/grades': 'grades.read',
  '/merchant/doctor_schedules': 'doctor_schedules.read',
  '/merchant/medical_records': 'medical_records.read',
  '/merchant/prescriptions': 'prescriptions.read',
  '/merchant/internet': 'internet.read',
  '/merchant/sports_matches': 'sports_matches.read',
  '/merchant/sports_players': 'sports_players.read',
  '/merchant/sports_standings': 'sports_standings.read',
  '/merchant/jobs': 'jobs.read',
  '/merchant/realestate': 'realestate.read',
  '/merchant/library': 'library.read',
  '/merchant/tourism': 'tourism.read',
  '/merchant/lostfound': 'lostfound.read',
};

export default function MerchantGuard({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const { session, ready } = usePermissions();

  const isPublicPath = pathname.startsWith('/merchant/login') || pathname.startsWith('/merchant/register');

  useEffect(() => {
    if (isPublicPath) return;
    if (!ready) return;
    if (!session) {
      const url = '/merchant/login?next=' + encodeURIComponent(pathname);
      router.replace(url);
    }
  }, [ready, session, isPublicPath, pathname, router]);

  if (isPublicPath) return children;
  if (!ready) return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' }}>⏳</div>;
  if (!session) return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' }}>⏳</div>;

  // إيجاد أطول تطابق
  let permission = null;
  let matched = '';
  Object.keys(PATH_PERMISSIONS).forEach(path => {
    if (pathname.startsWith(path) && path.length > matched.length) {
      matched = path;
      permission = PATH_PERMISSIONS[path];
    }
  });

  // الرئيسية والجذر بدون حماية
  if (!permission) return children;

  return <PermissionGate permission={permission}>{children}</PermissionGate>;
}
