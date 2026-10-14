'use client';
import Link from 'next/link';
export default function SLAPage() {
  return (
    <div className="legal-page">
      <div className="legal-header">
        <Link href="/" style={{ color: '#fff', fontSize: 22, textDecoration: 'none' }}>→</Link>
        <span style={{ fontSize: 17, fontWeight: 900 }}>اتفاقية مستوى الخدمة</span>
      </div>
      <div className="legal-body">
        <p><strong>آخر تحديث:</strong> 13 أكتوبر 2026</p>
        <h2>1. التوفر</h2>
        <p>نستهدف توفر 99.5% شهرياً لجميع الخدمات.</p>
        <h2>2. الأداء</h2>
        <ul>
          <li>زمن التحميل &lt; 2.5 ثانية</li>
          <li>Lighthouse &gt; 90</li>
          <li>API Response &lt; 500ms</li>
        </ul>
        <h2>3. الصيانة</h2>
        <p>صيانة دورية مخططة، مع إشعار قبل 72 ساعة.</p>
        <h2>4. الدعم</h2>
        <ul>
          <li>البريد: خلال 24 ساعة</li>
          <li>الدردشة: خلال 4 ساعات</li>
          <li>الطوارئ: فوري 24/7</li>
        </ul>
        <h2>5. التعويضات</h2>
        <p>انقطاع &gt; 24 ساعة → رصيد اشتراك إضافي.</p>
      </div>
    </div>
  );
}
