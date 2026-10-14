'use client';
import Link from 'next/link';
export default function APITerms() {
  return (
    <div className="legal-page">
      <div className="legal-header">
        <Link href="/" style={{ color: '#fff', fontSize: 22, textDecoration: 'none' }}>→</Link>
        <span style={{ fontSize: 17, fontWeight: 900 }}>شروط API</span>
      </div>
      <div className="legal-body">
        <h2>الاستخدام المسموح</h2>
        <ul>
          <li>دمج خدماتك مع سند</li>
          <li>قراءة البيانات العامة</li>
          <li>إدارة حسابك المؤسسي</li>
        </ul>
        <h2>حدود الاستخدام</h2>
        <ul>
          <li>1000 طلب / ساعة</li>
          <li>10000 طلب / يوم</li>
          <li>Rate Limit متدرج حسب الخطة</li>
        </ul>
        <h2>المحظورات</h2>
        <ul>
          <li>إعادة بيع البيانات</li>
          <li>الوصول غير المصرح به</li>
          <li>DoS / DDoS</li>
          <li>انتحال الهوية</li>
        </ul>
        <h2>المفاتيح</h2>
        <p>تُصدر من Developer Portal، وتُلغى عند التجاوز.</p>
      </div>
    </div>
  );
}
