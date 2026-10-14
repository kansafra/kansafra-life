'use client';


import SectionPage from '@/components/SectionPage';
export default function Page() {
  // نستخدم صفحة الإدارة العامة
  if (typeof window !== 'undefined') window.location.href = '/admin/manage/announcements';
  return null;
}
