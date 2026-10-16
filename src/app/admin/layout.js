import AdminNav from '@/components/AdminNav';

export const metadata = {
  title: 'لوحة الإدارة — سند',
};

export default function AdminLayout({ children }) {
  return (
    <>
      <AdminNav />
      {children}
    </>
  );
}
