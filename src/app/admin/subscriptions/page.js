'use client';


export default function Page() {
  if (typeof window !== 'undefined') window.location.href = '/admin/manage/entities';
  return null;
}
