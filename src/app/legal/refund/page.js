'use client';
import Link from 'next/link';
export default function RefundPage() {
  return (
    <div className="legal-page">
      <div className="legal-header">
        <Link href="/" style={{ color: '#fff', fontSize: 22, textDecoration: 'none' }}>→</Link>
        <span style={{ fontSize: 17, fontWeight: 900 }}>سياسة الاسترجاع</span>
      </div>
      <div className="legal-body">
        <p><strong>آخر تحديث:</strong> 13 أكتوبر 2026</p>
        <h2>1. اشتراكات المنصة</h2>
        <ul>
          <li>خلال 7 أيام: استرجاع كامل</li>
          <li>بعد 7 أيام: رصيد للشهر القادم</li>
          <li>الاشتراك السنوي: حسب الأشهر المتبقية</li>
        </ul>
        <h2>2. الطلبات من المتاجر</h2>
        <p>حسب سياسة كل تاجر — سند وسيط تقني فقط.</p>
        <h2>3. شروط الاسترجاع</h2>
        <ul>
          <li>عدم استخدام الخدمة</li>
          <li>طلب رسمي بالموافقة</li>
          <li>خلال المدة المحددة</li>
        </ul>
        <h2>4. الاستثناءات</h2>
        <ul>
          <li>الخدمات الرقمية بعد التسليم</li>
          <li>الاشتراكات المدفوعة بالبطاقات</li>
        </ul>
      </div>
    </div>
  );
}
