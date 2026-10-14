'use client';
import Link from 'next/link';
export default function Partner() {
  return (
    <div className="legal-page">
      <div className="legal-header">
        <Link href="/" style={{ color: '#fff', fontSize: 22, textDecoration: 'none' }}>→</Link>
        <span style={{ fontSize: 17, fontWeight: 900 }}>اتفاقية الشركاء</span>
      </div>
      <div className="legal-body">
        <h2>أنواع الشراكة</h2>
        <ul>
          <li>شركاء تقنيون</li>
          <li>شركاء إعلانيون</li>
          <li>موزعون إقليميون</li>
        </ul>
        <h2>الالتزامات</h2>
        <ul>
          <li>الالتزام بمعايير سند</li>
          <li>حماية سرية البيانات</li>
          <li>الامتثال للقوانين المحلية</li>
        </ul>
        <h2>الحصة من الإيرادات</h2>
        <p>تُحدد حسب نوع الشراكة والعقد المُبرَم.</p>
        <h2>مدة الاتفاقية</h2>
        <p>سنة واحدة قابلة للتجديد تلقائياً.</p>
      </div>
    </div>
  );
}
