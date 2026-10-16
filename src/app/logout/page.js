'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function LogoutPage() {
  const router = useRouter();

  useEffect(() => {
    // امسح كل الجلسات
    try {
      localStorage.clear();
      sessionStorage.clear();
    } catch (e) {}
    
    // ارجع للرئيسية بعد ثانية
    setTimeout(() => {
      window.location.href = '/';
    }, 800);
  }, []);

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'linear-gradient(180deg, #0a1f16 0%, #061410 100%)',
      color: '#fff', textAlign: 'center', padding: 20,
    }}>
      <div>
        <div style={{ fontSize: 64, marginBottom: 16 }}>🚪</div>
        <h1 style={{ fontSize: 22, fontWeight: 900, marginBottom: 8 }}>
          جارٍ تسجيل الخروج...
        </h1>
        <p style={{ fontSize: 14, color: 'rgba(255,255,255,.6)' }}>
          يتم مسح جميع البيانات المؤقتة
        </p>
      </div>
    </div>
  );
}
