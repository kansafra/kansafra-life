'use client';
import Link from 'next/link';
export default function Guidelines() {
  return (
    <div className="legal-page">
      <div className="legal-header">
        <Link href="/" style={{ color: '#fff', fontSize: 22, textDecoration: 'none' }}>→</Link>
        <span style={{ fontSize: 17, fontWeight: 900 }}>إرشادات المجتمع</span>
      </div>
      <div className="legal-body">
        <h2>قيمنا</h2>
        <ul>
          <li>الاحترام المتبادل</li>
          <li>الصدق في التعامل</li>
          <li>حماية الخصوصية</li>
          <li>المساهمة الإيجابية</li>
        </ul>
        <h2>معاملات آمنة</h2>
        <ul>
          <li>تحقق من هوية الطرف الآخر</li>
          <li>استخدم طرق الدفع الرسمية</li>
          <li>اطلب فاتورة دائماً</li>
          <li>بلّغ عن أي تجاوز</li>
        </ul>
        <h2>للأطباء والمؤسسات</h2>
        <ul>
          <li>الالتزام بالأخلاقيات المهنية</li>
          <li>الدقة في المعلومات</li>
          <li>سرعة الرد على العملاء</li>
          <li>احترام الأسعار المعلنة</li>
        </ul>
      </div>
    </div>
  );
}
