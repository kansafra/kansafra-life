'use client';

// Safe date for hydration
const __safeDate = (d) => (typeof window !== 'undefined' ? __safeDate(d) : __safeDate(0));

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';

const SUGGESTIONS = [
  'كيف أضيف منتج؟',
  'كيف أستخدم نظام الديون؟',
  'ما هو SOS؟',
  'كيف أحجز موعد طبيب؟',
  'كيف أستخدم الذاكرة الرقمية؟',
];

export default function AIPage() {
  const [messages, setMessages] = useState([
    { role: 'bot', text: 'مرحباً! أنا مساعد سند الذكي. كيف يمكنني مساعدتك اليوم؟' },
  ]);
  const [input, setInput] = useState('');
  const [thinking, setThinking] = useState(false);
  const endRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const brain = (q) => {
    const s = q.toLowerCase();
    if (s.includes('منتج') || s.includes('product')) return 'لإضافة منتج: افتح لوحة تحكمك → اضغط "منتج جديد" → املأ الاسم والسعر والخصم → احفظ. سترى المنتج ظاهراً في متجرك.';
    if (s.includes('دين') || s.includes('ديون')) return 'نظام الديون يتيح لك: تسجيل دين على عميل، تتبع السداد، إرسال تذكيرات، وتقارير. اضغط "💰 الديون" من لوحة تحكمك.';
    if (s.includes('sos') || s.includes('طوارئ')) return 'زر SOS مخصص للحالات الطارئة فقط: طبي، أمني، مدني. يُلزم بالاسم الثلاثي والموقع. الإبلاغ الكاذب يعرّضك للمساءلة.';
    if (s.includes('طبيب') || s.includes('موعد')) return 'لحجز موعد طبيب: افتح صفحة الطبيب من الأقسام → اختر التاريخ والوقت → أدخل اسمك وهاتفك → تأكيد. سيصلك رمز QR.';
    if (s.includes('ذاكرة') || s.includes('كنصفرة')) return 'الذاكرة الرقمية أرشيف لصور وحكايات وأماكن كنصفرة. يمكنك تصفحها أو إضافة محتوى من لوحة "ذاكرة كنصفرة".';
    if (s.includes('شام') || s.includes('دفع')) return 'طرق الدفع المتاحة: شام كاش، حوالة بنكية، نقدي، بطاقة، PayPal. اضبطها من "💳 طرق الدفع" في لوحة تحكمك.';
    if (s.includes('تقييم') || s.includes('نجوم')) return 'يمكن للزوار تقييم متجرك من 1 إلى 5 نجوم مع تعليق. تظهر التقييمات في صفحة متجرك.';
    if (s.includes('مرحب') || s.includes('سلام') || s.includes('أهلا')) return 'أهلاً بك! كيف أساعدك في استخدام سند؟';
    if (s.includes('من أنت') || s.includes('من انت')) return 'أنا مساعد سند الذكي — أساعدك على استخدام كل ميزات المنصة بسهولة.';
    return 'لم أفهم تماماً. جرّب صياغة أخرى، أو اختر من الاقتراحات أدناه. يمكنني مساعدتك في: المنتجات، الطلبات، الديون، المواعيد، SOS، والتقييمات.';
  };

  function send(text) {
    const q = (text || input).trim();
    if (!q) return;
    setMessages((m) => [...m, { role: 'user', text: q }]);
    setInput('');
    setThinking(true);
    setTimeout(() => {
      setMessages((m) => [...m, { role: 'bot', text: brain(q) }]);
      setThinking(false);
    }, 600);
  }

  return (
    <div className="ai-page">
      <div className="ai-header">
        <Link href="/" style={{ color: '#fff', fontSize: 22, textDecoration: 'none', marginLeft: 8 }}>→</Link>
        <div className="ai-header-icon">🤖</div>
        <div>
          <div className="ai-header-title">مساعد سند</div>
          <div className="ai-header-sub">مساعد ذكي متاح على مدار الساعة</div>
        </div>
      </div>

      <div className="ai-chat">
        {messages.map((m, i) => (
          <div key={i} className={`ai-msg ${m.role}`}>
            {m.text}
          </div>
        ))}
        {thinking && <div className="ai-msg bot">... يكتب</div>}
        <div ref={endRef} />
      </div>

      {messages.length <= 1 && (
        <div className="ai-suggestions">
          {SUGGESTIONS.map((s) => (
            <button key={s} className="ai-suggest" onClick={() => send(s)} type="button">{s}</button>
          ))}
        </div>
      )}

      <div className="ai-input-wrap">
        <input
          className="ai-input"
          placeholder="اسألني أي شيء..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && send()}
        />
        <button className="ai-send" onClick={() => send()} type="button">↑</button>
      </div>
    </div>
  );
}
