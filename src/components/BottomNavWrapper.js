'use client';
import { usePathname } from 'next/navigation';
import GlobalBottomNav from './GlobalBottomNav';

// المسارات اللي بنخفي فيها الشريط السفلي (عشان ما يتعارض مع أزرار الصفحة)
const HIDDEN_PATHS = ['/cart', '/checkout', '/login', '/register', '/admin', '/product'];

export default function BottomNavWrapper() {
  const pathname = usePathname();

  // التحقق إذا كنا في صفحة من الصفحات المخفية
  const shouldHide = HIDDEN_PATHS.some((path) => pathname.startsWith(path));
  
  if (shouldHide) return null;

  // في الصفحات العادية، بنعرض الشريط + مسافة سفلية عشان ما يغطي المحتوى
  return (
    <>
      <div style={{ height: 'calc(80px + env(safe-area-inset-bottom))', width: '100%', pointerEvents: 'none' }} />
      <GlobalBottomNav />
    </>
  );
}
