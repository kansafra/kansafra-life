'use client';
import Link from 'next/link';
export default function CookiesPage() {
  return (
    <div className="legal-page">
      <div className="legal-header">
        <Link href="/" style={{ color: '#fff', fontSize: 22, textDecoration: 'none' }}>→</Link>
        <span style={{ fontSize: 17, fontWeight: 900 }}>سياسة الكوكيز</span>
      </div>
      <div className="legal-body">
        <p><strong>آخر تحديث:</strong> 13 أكتوبر 2026</p>
        <h2>1. ما هي ملفات الكوكيز؟</h2>
        <p>ملفات صغيرة تُحفظ في متصفحك لتسهيل استخدامك للمنصة.</p>
        <h2>2. الكوكيز التي نستخدمها</h2>
        <ul>
          <li><strong>ضرورية:</strong> لتسجيل الدخول وحفظ السلة</li>
          <li><strong>تفضيلات:</strong> اللغة والعملة المفضلة</li>
          <li><strong>تحليلية:</strong> لمعرفة الصفحات الأكثر استخداماً</li>
        </ul>
        <h2>3. لا نستخدم</h2>
        <ul>
          <li>كوكيز تتبع إعلاني</li>
          <li>مشاركة بيانات مع أطراف خارجية</li>
        </ul>
        <h2>4. تحكم الكوكيز</h2>
        <p>يمكنك حذف أو تعطيل الكوكيز من إعدادات المتصفح.</p>
        <h2>5. التواصل</h2>
        <p>privacy@getsanad.com</p>
      </div>
    </div>
  );
}
