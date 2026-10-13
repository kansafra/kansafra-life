const T = {
  amber: { from: '#f59e0b', to: '#d97706', accent: '#fbbf24', soft: 'rgba(245,158,11,.12)' },
  cyan: { from: '#06b6d4', to: '#0891b2', accent: '#22d3ee', soft: 'rgba(6,182,212,.12)' },
  pink: { from: '#ec4899', to: '#db2777', accent: '#f472b6', soft: 'rgba(236,72,153,.12)' },
  violet: { from: '#8b5cf6', to: '#7c3aed', accent: '#a78bfa', soft: 'rgba(139,92,246,.12)' },
  emerald: { from: '#10b981', to: '#059669', accent: '#34d399', soft: 'rgba(16,185,129,.12)' },
  sky: { from: '#0ea5e9', to: '#0284c7', accent: '#38bdf8', soft: 'rgba(14,165,233,.12)' },
  orange: { from: '#f97316', to: '#ea580c', accent: '#fb923c', soft: 'rgba(249,115,22,.12)' },
  red: { from: '#dc2626', to: '#991b1b', accent: '#f87171', soft: 'rgba(220,38,38,.12)' },
  teal: { from: '#14b8a6', to: '#0d9488', accent: '#5eead4', soft: 'rgba(20,184,166,.12)' },
  indigo: { from: '#6366f1', to: '#4f46e5', accent: '#818cf8', soft: 'rgba(99,102,241,.12)' },
};

const C = {};

C.merchant = {
  label: 'متجر', icon: '🏪', greeting: 'بائعنا العزيز', theme: T.amber,
  tagline: 'إدارة منتجاتك وأسعارك وطلباتك',
  stats: [
    { key: 'products', label: 'منتج' },
    { key: 'orders', label: 'طلبات' },
    { key: 'revenue', label: 'مبيعات' },
  ],
  quickActions: [
    { icon: '📦', title: 'المنتجات', href: '/merchant/manage/products' },
    { icon: '🛍️', title: 'الطلبات', href: '/merchant/manage/orders' },
    { icon: '🧾', title: 'الفواتير', href: '/merchant/invoices' },
    { icon: '💳', title: 'الدفع', href: '/merchant/payments' },
  ],
};

C.restaurant = {
  label: 'مطعم', icon: '🍽️', greeting: 'صاحب المطعم', theme: T.red,
  tagline: 'إدارة قائمتك وطلباتك',
  stats: [
    { key: 'products', label: 'طبق' },
    { key: 'orders', label: 'طلب' },
    { key: 'revenue', label: 'مبيعات' },
  ],
  quickActions: [
    { icon: '📋', title: 'القائمة', href: '/merchant/manage/products' },
    { icon: '🛍️', title: 'الطلبات', href: '/merchant/manage/orders' },
    { icon: '🎟️', title: 'الكوبونات', href: '/merchant/manage/coupons' },
    { icon: '💳', title: 'الدفع', href: '/merchant/payments' },
  ],
};

C.doctor = {
  label: 'طبيب', icon: '👨‍⚕️', greeting: 'دكتورنا الفاضل', theme: T.cyan,
  tagline: 'إدارة مواعيدك ومرضاك',
  stats: [
    { key: 'appointments', label: 'موعد' },
    { key: 'patients', label: 'مرضى' },
    { key: 'records', label: 'سجلات' },
  ],
  quickActions: [
    { icon: '🕐', title: 'الجدول', href: '/merchant/manage/doctor_schedules' },
    { icon: '📅', title: 'المواعيد', href: '/merchant/manage/appointments' },
    { icon: '📋', title: 'السجلات', href: '/merchant/manage/medical_records' },
    { icon: '💬', title: 'الدردشة', href: '/merchant/chat' },
  ],
};

C.pharmacy = {
  label: 'صيدلية', icon: '💊', greeting: 'صيدلانينا المحترم', theme: T.pink,
  tagline: 'مناوباتك وأدويتك',
  stats: [
    { key: 'medicines', label: 'دواء' },
    { key: 'orders', label: 'طلبات' },
    { key: 'shifts', label: 'مناوبة' },
  ],
  quickActions: [
    { icon: '💊', title: 'الأدوية', href: '/merchant/manage/products' },
    { icon: '🌙', title: 'المناوبات', href: '/merchant/manage/oncall_shifts' },
    { icon: '🛍️', title: 'الطلبات', href: '/merchant/manage/orders' },
    { icon: '🧾', title: 'الفواتير', href: '/merchant/invoices' },
  ],
};

C.school = {
  label: 'مدرسة', icon: '🏫', greeting: 'أستاذنا الفاضل', theme: T.violet,
  tagline: 'إدارة الصفوف والطلاب والمكتبة',
  stats: [
    { key: 'classes', label: 'صف' },
    { key: 'students', label: 'طالب' },
    { key: 'files', label: 'ملف' },
  ],
  quickActions: [
    { icon: '📚', title: 'الصفوف', href: '/merchant/manage/classes' },
    { icon: '👥', title: 'الطلاب', href: '/merchant/manage/students' },
    { icon: '📊', title: 'العلامات', href: '/merchant/manage/grades' },
    { icon: '📄', title: 'ملفات الصفوف', href: '/merchant/manage/class_files' },
  ],
};

C.mosque = {
  label: 'جامع', icon: '🕌', greeting: 'إمامنا الفاضل', theme: T.emerald,
  tagline: 'الدروس والحلقات والتبرعات',
  stats: [
    { key: 'lessons', label: 'درس' },
    { key: 'circles', label: 'حلقة' },
    { key: 'donations', label: 'تبرع' },
  ],
  quickActions: [
    { icon: '📖', title: 'الدروس', href: '/merchant/manage/lessons' },
    { icon: '🎯', title: 'الحلقات', href: '/merchant/manage/circles' },
    { icon: '🎁', title: 'التبرعات', href: '/merchant/manage/donations' },
    { icon: '📢', title: 'الإعلانات', href: '/merchant/manage/announcements' },
  ],
};

C.council = {
  label: 'مجلس محلي', icon: '🏛️', greeting: 'أعضاء المجلس', theme: T.sky,
  tagline: 'التعاميم والشكاوى والمشاريع',
  stats: [
    { key: 'announcements', label: 'تعميم' },
    { key: 'requests', label: 'طلب' },
    { key: 'projects', label: 'مشروع' },
  ],
  quickActions: [
    { icon: '📢', title: 'التعاميم', href: '/merchant/manage/announcements' },
    { icon: '📋', title: 'الطلبات', href: '/merchant/manage/office_requests' },
    { icon: '📩', title: 'الشكاوى', href: '/merchant/manage/office_requests' },
    { icon: '🏗️', title: 'المشاريع', href: '/merchant/manage/office_requests' },
  ],
};

C.municipality = {
  label: 'بلدية', icon: '🏢', greeting: 'إدارة البلدية', theme: T.sky,
  tagline: 'خدمات بلدية وشهادات وتصاريح',
  stats: [
    { key: 'announcements', label: 'إعلان' },
    { key: 'requests', label: 'طلب' },
    { key: 'services', label: 'خدمة' },
  ],
  quickActions: [
    { icon: '📢', title: 'الإعلانات', href: '/merchant/manage/announcements' },
    { icon: '📩', title: 'الطلبات والشكاوى', href: '/merchant/manage/office_requests' },
    { icon: '📜', title: 'الشهادات', href: '/merchant/manage/office_requests' },
    { icon: '🏗️', title: 'المشاريع', href: '/merchant/manage/office_requests' },
  ],
};

C.charity = {
  label: 'جمعية خيرية', icon: '🤝', greeting: 'أهل الخير', theme: T.orange,
  tagline: 'التبرعات والحالات والمستفيدين',
  stats: [
    { key: 'donations', label: 'تبرع' },
    { key: 'cases', label: 'حالة' },
    { key: 'volunteers', label: 'متطوع' },
  ],
  quickActions: [
    { icon: '🎁', title: 'التبرعات', href: '/merchant/manage/donations' },
    { icon: '👥', title: 'طلبات المساعدة', href: '/merchant/manage/elderly_requests' },
    { icon: '🤝', title: 'المتطوعون', href: '/merchant/manage/volunteers' },
    { icon: '📢', title: 'الإعلانات', href: '/merchant/manage/announcements' },
  ],
};

C.sports = {
  label: 'نادي', icon: '⚽', greeting: 'مدربنا الفاضل', theme: T.teal,
  tagline: 'اللاعبون والمباريات والترتيب',
  stats: [
    { key: 'players', label: 'لاعب' },
    { key: 'matches', label: 'مباراة' },
    { key: 'standings', label: 'فريق' },
  ],
  quickActions: [
    { icon: '👥', title: 'الفريق', href: '/merchant/manage/sports_players' },
    { icon: '⚽', title: 'المباريات', href: '/merchant/manage/sports_matches' },
    { icon: '🏆', title: 'الترتيب', href: '/merchant/manage/sports_standings' },
    { icon: '📢', title: 'الإعلانات', href: '/merchant/manage/announcements' },
  ],
};

C.memory = {
  label: 'ذاكرة رقمية', icon: '📸', greeting: 'حافظ الذاكرة', theme: T.indigo,
  tagline: 'أرشيف صور وحكايات وأماكن',
  stats: [
    { key: 'photos', label: 'صورة' },
    { key: 'stories', label: 'حكاية' },
    { key: 'places', label: 'مكان' },
  ],
  quickActions: [
    { icon: '🖼️', title: 'المعرض', href: '/merchant/manage/memory_items' },
    { icon: '📖', title: 'الحكايات', href: '/merchant/manage/memory_stories' },
    { icon: '📍', title: 'الأماكن', href: '/merchant/manage/memory_places' },
    { icon: '📢', title: 'الإعلانات', href: '/merchant/manage/announcements' },
  ],
};

C.office = {
  label: 'مكتب', icon: '📁', greeting: 'أهلًا بك', theme: T.emerald,
  tagline: 'الطلبات والمعاملات والملفات',
  stats: [
    { key: 'requests', label: 'طلب' },
    { key: 'jobs', label: 'وظيفة' },
    { key: 'completed', label: 'منجز' },
  ],
  quickActions: [
    { icon: '📋', title: 'الطلبات', href: '/merchant/manage/office_requests' },
    { icon: '💼', title: 'الوظائف', href: '/merchant/manage/job_postings' },
    { icon: '👤', title: 'الباحثون', href: '/merchant/manage/job_seekers' },
    { icon: '💬', title: 'الدردشة', href: '/merchant/chat' },
  ],
};

C.transport = {
  label: 'مواصلات', icon: '🚗', greeting: 'أهلًا بك', theme: T.sky,
  tagline: 'إدارة مركباتك وخطوطك',
  stats: [
    { key: 'vehicles', label: 'مركبة' },
    { key: 'routes', label: 'خط' },
    { key: 'orders', label: 'رحلة' },
  ],
  quickActions: [
    { icon: '🚗', title: 'المركبات', href: '/merchant/manage/vehicles' },
    { icon: '🛣️', title: 'الخطوط', href: '/merchant/manage/vehicles' },
    { icon: '🛍️', title: 'الطلبات', href: '/merchant/manage/orders' },
    { icon: '💳', title: 'الدفع', href: '/merchant/payments' },
  ],
};

export const ENTITY_CONFIG = C;

export function getEntityConfig(type) {
  return C[type] || C.merchant;
}
