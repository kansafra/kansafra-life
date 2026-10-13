'use client';

// Safe date for hydration
const __safeDate = (d) => (typeof window !== 'undefined' ? __safeDate(d) : __safeDate(0));

import SectionPage from '@/components/SectionPage';
export default function Page() {
  // نستخدم صفحة الإدارة العامة
  if (typeof window !== 'undefined') window.location.href = '/admin/manage/announcements';
  return null;
}
