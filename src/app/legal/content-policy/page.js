'use client';
import Link from 'next/link';
export default function ContentPolicy() {
  return (
    <div className="legal-page">
      <div className="legal-header">
        <Link href="/" style={{ color: '#fff', fontSize: 22, textDecoration: 'none' }}>→</Link>
        <span style={{ fontSize: 17, fontWeight: 900 }}>سياسة المحتوى</span>
      </div>
      <div className="legal-body">
        <p><strong>آخر تحديث:</strong> 13 أكتوبر 2026</p>
        <h2>المحتوى المسموح</h2>
        <ul>
          <li>الخدمات التجارية المشروعة</li>
          <li>المنتجات الحلال والقانونية</li>
          <li>المحتوى التربوي والثقافي</li>
        </ul>
        <h2>المحتوى الممنوع</h2>
        <ul>
          <li>المواد المقلدة أو المسروقة</li>
          <li>المحتوى المسيء للشريعة</li>
          <li>الإعلانات الاحتيالية</li>
          <li>المخدرات والأسلحة</li>
          <li>المحتوى الجنسي</li>
          <li>الكراهية والعنصرية</li>
        </ul>
        <h2>العقوبات</h2>
        <ul>
          <li>تحذير رسمي</li>
          <li>حذف المحتوى</li>
          <li>إيقاف الحساب مؤقتاً</li>
          <li>حظر دائم</li>
          <li>إحالة قانونية</li>
        </ul>
      </div>
    </div>
  );
}
