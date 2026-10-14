'use client';
import Link from 'next/link';
export default function GDPR() {
  return (
    <div className="legal-page">
      <div className="legal-header">
        <Link href="/" style={{ color: '#fff', fontSize: 22, textDecoration: 'none' }}>→</Link>
        <span style={{ fontSize: 17, fontWeight: 900 }}>GDPR + CCPA</span>
      </div>
      <div className="legal-body">
        <h2>حقوقك (GDPR)</h2>
        <ul>
          <li>الحق في الوصول</li>
          <li>الحق في التصحيح</li>
          <li>الحق في النسيان</li>
          <li>الحق في نقل البيانات</li>
          <li>الحق في الاعتراض</li>
          <li>الحق في تقييد المعالجة</li>
        </ul>
        <h2>حقوقك (CCPA - كاليفورنيا)</h2>
        <ul>
          <li>معرفة البيانات المجمعة</li>
          <li>حذف البيانات</li>
          <li>رفض بيع البيانات (لا نبيع)</li>
          <li>عدم التمييز</li>
        </ul>
        <h2>الامتثال</h2>
        <ul>
          <li>إشعار الاختراق خلال 72 ساعة</li>
          <li>DPO مخصص للحماية</li>
          <li>سجل معالجة كامل</li>
          <li>تقييم أثر الخصوصية</li>
        </ul>
        <h2>التواصل</h2>
        <p>dpo@getsanad.com</p>
      </div>
    </div>
  );
}
