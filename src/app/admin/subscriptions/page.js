'use client';

// Safe date for hydration
const __safeDate = (d) => (typeof window !== 'undefined' ? __safeDate(d) : __safeDate(0));

export default function Page() {
  if (typeof window !== 'undefined') window.location.href = '/admin/manage/entities';
  return null;
}
