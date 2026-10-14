'use client';
import Link from 'next/link';
export default function DPAPage() {
  return (
    <div className="legal-page">
      <div className="legal-header">
        <Link href="/" style={{ color: '#fff', fontSize: 22, textDecoration: 'none' }}>→</Link>
        <span style={{ fontSize: 17, fontWeight: 900 }}>اتفاقية معالجة البيانات</span>
      </div>
      <div className="legal-body">
        <p><strong>آخر تحديث:</strong> 13 أكتوبر 2026</p>
        <h2>1. نطاق المعالجة</h2>
        <p>تلتزم منصة سند بمعالجة البيانات الشخصية وفق أحكام هذه الاتفاقية والقوانين السارية.</p>
        <h2>2. أنواع البيانات</h2>
        <ul>
          <li>بيانات الهوية (الاسم، الهاتف)</li>
          <li>بيانات الاستخدام (السجلات، الأحداث)</li>
          <li>بيانات المعاملات (الطلبات، الفواتير)</li>
        </ul>
        <h2>3. الغرض من المعالجة</h2>
        <ul>
          <li>تقديم الخدمة المتفق عليها</li>
          <li>تحسين التجربة</li>
          <li>الامتثال القانوني</li>
        </ul>
        <h2>4. الأمان</h2>
        <p>AES-256 • TLS 1.3 • RLS • 2FA • نسخ احتياطي مشفر</p>
        <h2>5. الاحتفاظ</h2>
        <p>طالما الحساب نشط + 30 يوم بعد الحذف (للامتثال فقط).</p>
        <h2>6. حقوق أصحاب البيانات</h2>
        <ul>
          <li>الوصول إلى البيانات</li>
          <li>التصحيح والحذف</li>
          <li>سحب الموافقة</li>
          <li>نقل البيانات</li>
        </ul>
      </div>
    </div>
  );
}
