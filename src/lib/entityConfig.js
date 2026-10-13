// ═══════════ إعدادات لوحات التحكم حسب نوع الكيان ═══════════

const T = {
  amber:   { from:'#f59e0b', to:'#d97706', accent:'#fbbf24', soft:'rgba(245,158,11,.12)', glow:'rgba(245,158,11,.4)' },
  cyan:    { from:'#06b6d4', to:'#0891b2', accent:'#22d3ee', soft:'rgba(6,182,212,.12)',  glow:'rgba(6,182,212,.4)' },
  pink:    { from:'#ec4899', to:'#db2777', accent:'#f472b6', soft:'rgba(236,72,153,.12)', glow:'rgba(236,72,153,.4)' },
  violet:  { from:'#8b5cf6', to:'#7c3aed', accent:'#a78bfa', soft:'rgba(139,92,246,.12)', glow:'rgba(139,92,246,.4)' },
  emerald: { from:'#10b981', to:'#059669', accent:'#34d399', soft:'rgba(16,185,129,.12)', glow:'rgba(16,185,129,.4)' },
  sky:     { from:'#0ea5e9', to:'#0284c7', accent:'#38bdf8', soft:'rgba(14,165,233,.12)', glow:'rgba(14,165,233,.4)' },
  orange:  { from:'#f97316', to:'#ea580c', accent:'#fb923c', soft:'rgba(249,115,22,.12)', glow:'rgba(249,115,22,.4)' },
  red:     { from:'#dc2626', to:'#991b1b', accent:'#f87171', soft:'rgba(220,38,38,.12)',  glow:'rgba(220,38,38,.4)' },
  teal:    { from:'#14b8a6', to:'#0d9488', accent:'#5eead4', soft:'rgba(20,184,166,.12)', glow:'rgba(20,184,166,.4)' },
  indigo:  { from:'#6366f1', to:'#4f46e5', accent:'#818cf8', soft:'rgba(99,102,241,.12)', glow:'rgba(99,102,241,.4)' },
};

export const ENTITY_CONFIG = {
  merchant: {
    label: 'متجر', icon: '🏪', greeting: 'بائعنا العزيز', theme: T.amber,
    tagline: 'إدارة منتجاتك وأسعارك وطلباتك',
    stats: [
      { key:'products', label:'منتج',     trend:'+2' },
      { key:'orders',   label:'طلبات',    trend:'+5' },
      { key:'revenue',  label:'مبيعات',   trend:'+18', unit:'ل.س' },
    ],
    quickActions: [
      { id:'new',     icon:'+',  title:'منتج جديد', href:'/merchant/products/new' },
      { id:'products',icon:'📦', title:'المنتجات', href:'/merchant/products' },
      { id:'orders',  icon:'🛍️', title:'الطلبات',  href:'/merchant/orders' },
      { id:'stats',   icon:'📊', title:'التقارير', href:'/merchant/stats' },
    ],
  },
  restaurant: {
    label: 'مطعم', icon: '🍽️', greeting: 'صاحب المطعم', theme: T.red,
    tagline: 'إدارة قائمتك وطلباتك',
    stats: [
      { key:'products', label:'طبق',    trend:'+3' },
      { key:'orders',   label:'طلب',    trend:'+12' },
      { key:'revenue',  label:'مبيعات', trend:'+25', unit:'ل.س' },
    ],
    quickActions: [
      { id:'new',     icon:'+',  title:'طبق جديد', href:'/merchant/products/new' },
      { id:'menu',    icon:'📋', title:'القائمة',  href:'/merchant/products' },
      { id:'orders',  icon:'🛍️', title:'الطلبات',  href:'/merchant/orders' },
      { id:'hours',   icon:'🕐', title:'ساعات',    href:'/merchant/hours' },
    ],
  },
  doctor: {
    label: 'طبيب', icon: '👨‍⚕️', greeting: 'دكتورنا الفاضل', theme: T.cyan,
    tagline: 'إدارة مواعيدك ومرضاك',
    stats: [
      { key:'today',    label:'موعد اليوم', trend:'+3' },
      { key:'patients', label:'مرضى',       trend:'+7' },
      { key:'pending',  label:'بالانتظار',  trend:'-2' },
    ],
    quickActions: [
      { id:'new-appt', icon:'+',  title:'موعد',    href:'/merchant/appointments/new' },
      { id:'schedule', icon:'🕐', title:'الجدول',  href:'/merchant/schedule' },
      { id:'patients', icon:'👥', title:'المرضى',  href:'/merchant/patients' },
      { id:'profile',  icon:'⚙️', title:'إعدادات', href:'/merchant/profile' },
    ],
  },
  pharmacy: {
    label: 'صيدلية', icon: '💊', greeting: 'صيدلانينا المحترم', theme: T.pink,
    tagline: 'مناوباتك وأدويتك',
    stats: [
      { key:'products', label:'دواء',   trend:'+12' },
      { key:'orders',   label:'طلبات',  trend:'+4' },
      { key:'onCall',   label:'مناوبة', trend:'اليوم' },
    ],
    quickActions: [
      { id:'new',    icon:'+',  title:'دواء جديد', href:'/merchant/products/new' },
      { id:'oncall', icon:'🌙', title:'المناوبات', href:'/merchant/oncall' },
      { id:'stock',  icon:'📦', title:'المخزون',   href:'/merchant/products' },
      { id:'info',   icon:'📝', title:'الإرشادات', href:'/merchant/instructions' },
    ],
  },
  school: {
    label: 'مدرسة', icon: '🏫', greeting: 'أستاذنا الفاضل', theme: T.violet,
    tagline: 'إدارة الصفوف والطلاب والمكتبة',
    stats: [
      { key:'classes',  label:'صف',   trend:'+1' },
      { key:'students', label:'طالب', trend:'+8' },
      { key:'files',    label:'ملف',  trend:'+15' },
    ],
    quickActions: [
      { id:'new-class', icon:'+',  title:'صف جديد', href:'/merchant/classes/new' },
      { id:'classes',   icon:'📚', title:'الصفوف',  href:'/merchant/classes' },
      { id:'students',  icon:'👥', title:'الطلاب',  href:'/merchant/students' },
      { id:'library',   icon:'📖', title:'المكتبة', href:'/merchant/library' },
    ],
  },
  mosque: {
    label: 'جامع', icon: '🕌', greeting: 'إمامنا الفاضل', theme: T.emerald,
    tagline: 'الدروس والحلقات والتبرعات',
    stats: [
      { key:'lessons',   label:'درس',  trend:'+3' },
      { key:'circles',   label:'حلقة', trend:'+1' },
      { key:'donations', label:'تبرع', trend:'+15' },
    ],
    quickActions: [
      { id:'new-lesson', icon:'+',  title:'درس',    href:'/merchant/lessons/new' },
      { id:'prayer',     icon:'🕐', title:'المواقيت',href:'/merchant/prayer' },
      { id:'circles',    icon:'🎯', title:'الحلقات', href:'/merchant/circles' },
      { id:'donations',  icon:'💚', title:'التبرعات',href:'/merchant/donations' },
    ],
  },
  council: {
    label: 'مجلس محلي', icon: '🏛️', greeting: 'أعضاء المجلس', theme: T.sky,
    tagline: 'التعاميم والشكاوى والمشاريع',
    stats: [
      { key:'announcements', label:'تعميم', trend:'+2' },
      { key:'complaints',    label:'شكوى',  trend:'-3' },
      { key:'projects',      label:'مشروع', trend:'+1' },
    ],
    quickActions: [
      { id:'new-ann', icon:'+',  title:'تعميم',   href:'/merchant/announcements/new' },
      { id:'reports', icon:'📩', title:'الشكاوى', href:'/merchant/complaints' },
      { id:'proj',    icon:'🏗️', title:'المشاريع',href:'/merchant/projects' },
      { id:'budget',  icon:'💰', title:'الميزانية',href:'/merchant/budget' },
    ],
  },
  municipality: {
    label: 'بلدية', icon: '🏢', greeting: 'إدارة البلدية', theme: T.sky,
    tagline: 'خدمات بلدية وشهادات وتصاريح',
    stats: [
      { key:'announcements', label:'إعلان', trend:'+2' },
      { key:'requests',      label:'طلب',   trend:'+6' },
      { key:'services',      label:'خدمة',  trend:'+1' },
    ],
    quickActions: [
      { id:'new-ann', icon:'+',  title:'إعلان',   href:'/merchant/announcements/new' },
      { id:'cert',    icon:'📜', title:'الشهادات',href:'/merchant/certificates' },
      { id:'reports', icon:'📩', title:'الشكاوى', href:'/merchant/complaints' },
      { id:'budget',  icon:'💰', title:'الميزانية',href:'/merchant/budget' },
    ],
  },
  charity: {
    label: 'جمعية خيرية', icon: '🤝', greeting: 'أهل الخير', theme: T.orange,
    tagline: 'التبرعات والحالات والمستفيدين',
    stats: [
      { key:'donations',     label:'تبرع',    trend:'+12' },
      { key:'cases',         label:'حالة',    trend:'+4' },
      { key:'beneficiaries', label:'مستفيد',  trend:'+7' },
    ],
    quickActions: [
      { id:'new-case',  icon:'+',  title:'حالة',      href:'/merchant/cases/new' },
      { id:'donations', icon:'💰', title:'التبرعات',  href:'/merchant/donations' },
      { id:'benefit',   icon:'👥', title:'المستفيدون',href:'/merchant/beneficiaries' },
      { id:'campaigns', icon:'📢', title:'الحملات',   href:'/merchant/campaigns' },
    ],
  },
  sports: {
    label: 'نادي رياضي', icon: '⚽', greeting: 'مدربنا الفاضل', theme: T.teal,
    tagline: 'اللاعبون والمباريات والترتيب',
    stats: [
      { key:'players',  label:'لاعب',   trend:'+2' },
      { key:'matches',  label:'مباراة', trend:'+4' },
      { key:'wins',     label:'فوز',    trend:'+3' },
    ],
    quickActions: [
      { id:'new-player', icon:'+',  title:'لاعب جديد',  href:'/merchant/players/new' },
      { id:'players',    icon:'👥', title:'الفريق',      href:'/merchant/players' },
      { id:'matches',    icon:'⚽', title:'المباريات',  href:'/merchant/matches' },
      { id:'standings',  icon:'🏆', title:'الترتيب',    href:'/merchant/standings' },
    ],
  },
  memory: {
    label: 'ذاكرة رقمية', icon: '📸', greeting: 'حافظ الذاكرة', theme: T.indigo,
    tagline: 'أرشيف صور وحكايات كنصفرة',
    stats: [
      { key:'photos', label:'صورة', trend:'+15' },
      { key:'stories',label:'حكاية',trend:'+4' },
      { key:'decades',label:'عقد',  trend:'—' },
    ],
    quickActions: [
      { id:'new-photo', icon:'+',  title:'صورة',    href:'/merchant/memory/new' },
      { id:'gallery',   icon:'🖼️', title:'المعرض',  href:'/merchant/memory' },
      { id:'stories',   icon:'📖', title:'حكايات',  href:'/merchant/stories' },
      { id:'timeline',  icon:'⏳', title:'الخط الزمني',href:'/merchant/timeline' },
    ],
  },
  office: {
    label: 'مكتب', icon: '📁', greeting: 'أهلًا بك', theme: T.emerald,
    tagline: 'الطلبات والمعاملات والملفات',
    stats: [
      { key:'requests',   label:'طلب',    trend:'+5' },
      { key:'completed',  label:'منجز',   trend:'+8' },
      { key:'pending',    label:'بالانتظار', trend:'-2' },
    ],
    quickActions: [
      { id:'new-req', icon:'+',  title:'طلب جديد', href:'/merchant/requests/new' },
      { id:'reqs',    icon:'📋', title:'الطلبات',  href:'/merchant/requests' },
      { id:'files',   icon:'📁', title:'الملفات',  href:'/merchant/files' },
      { id:'profile', icon:'⚙️', title:'إعدادات',  href:'/merchant/profile' },
    ],
  },,
  transport: {
    label: 'مواصلات', icon: '🚗', greeting: 'أهلًا بك', theme: { from:'#1e40af', to:'#1e3a8a', accent:'#3b82f6', soft:'rgba(30,64,175,.12)', glow:'rgba(30,64,175,.4)' },
    tagline: 'إدارة مركباتك وخطوطك وأسعارك',
    stats: [
      { key:'vehicles', label:'مركبة', trend:'+1' },
      { key:'trips',    label:'رحلة',  trend:'+8' },
      { key:'revenue',  label:'دخل',   trend:'+15', unit:'ل.س' },
    ],
    quickActions: [
      { id:'new',      icon:'+',  title:'مركبة جديدة', href:'/merchant/vehicles/new' },
      { id:'vehicles', icon:'🚗', title:'مركباتي',     href:'/merchant/vehicles' },
      { id:'routes',   icon:'🛣️', title:'الخطوط',      href:'/merchant/routes' },
      { id:'stats',    icon:'📊', title:'التقارير',    href:'/merchant/stats' },
    ],
  },
  expat_placeholder_for_syntax: {}
};

export function getEntityConfig(type) {
  return ENTITY_CONFIG[type] || ENTITY_CONFIG.merchant;
}
