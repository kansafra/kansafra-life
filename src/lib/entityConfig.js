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
    { key: 'pending', label: 'قيد التحضير' },
    { key: 'today', label: 'اليوم' },
  ],
  quickActions: [
    { icon: '📦', title: 'المنتجات', href: '/merchant/products' },
    { icon: '🛍️', title: 'الطلبات', href: '/merchant/orders' },
    { icon: '🧾', title: 'الفواتير', href: '/merchant/invoices' },
    { icon: '👥', title: 'العملاء', href: '/merchant/customers' },
    { icon: '📊', title: 'المخزون', href: '/merchant/inventory' },
    { icon: '🚚', title: 'التوصيل', href: '/merchant/delivery' },
    { icon: '👥', title: 'الموظفون', href: '/merchant/employees' },
    { icon: '⭐', title: 'التقييمات', href: '/merchant/reviews' },
    { icon: '💳', title: 'الدفع', href: '/merchant/payments' },
    { icon: '💰', title: 'دفتر الديون', href: '/merchant/debts' },
        { icon: '⚙️', title: 'إعدادات حسابي', href: '/merchant/settings' },
{ icon: '💎', title: 'اشتراكي', href: '/merchant/subscription' },
    { icon: '⏳', title: 'قيد المراجعة', href: '/merchant/moderation' },
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
    { icon: '📋', title: 'القائمة', href: '/merchant/products' },
    { icon: '🛍️', title: 'الطلبات', href: '/merchant/orders' },
    { icon: '🎟️', title: 'الكوبونات', href: '/merchant/coupons' },
    { icon: '👥', title: 'العملاء', href: '/merchant/customers' },
    { icon: '📊', title: 'المخزون', href: '/merchant/inventory' },
    { icon: '💳', title: 'الدفع', href: '/merchant/payments' },
    { icon: '👥', title: 'الموظفون', href: '/merchant/employees' },
        { icon: '⚙️', title: 'إعدادات حسابي', href: '/merchant/settings' },
{ icon: '💎', title: 'اشتراكي', href: '/merchant/subscription' },
    { icon: '⏳', title: 'قيد المراجعة', href: '/merchant/moderation' },
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
    { icon: '🕐', title: 'الجدول', href: '/merchant/doctor_schedules' },
    { icon: '📅', title: 'المواعيد', href: '/merchant/appointments' },
    { icon: '📋', title: 'السجلات', href: '/merchant/medical_records' },
    { icon: '💊', title: 'الوصفات', href: '/merchant/prescriptions' },
    { icon: '💬', title: 'الدردشة', href: '/merchant/chat' },
        { icon: '⚙️', title: 'إعدادات حسابي', href: '/merchant/settings' },
{ icon: '💎', title: 'اشتراكي', href: '/merchant/subscription' },
    { icon: '⏳', title: 'قيد المراجعة', href: '/merchant/moderation' },
  
    { icon: '👥', title: 'العملاء', href: '/merchant/customers' },],
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
    { icon: '💊', title: 'الأدوية', href: '/merchant/products' },
    { icon: '🌙', title: 'المناوبات', href: '/merchant/oncall_shifts' },
    { icon: '🛍️', title: 'الطلبات', href: '/merchant/orders' },
    { icon: '🧾', title: 'الفواتير', href: '/merchant/invoices' },
        { icon: '⚙️', title: 'إعدادات حسابي', href: '/merchant/settings' },
{ icon: '💎', title: 'اشتراكي', href: '/merchant/subscription' },
    { icon: '⏳', title: 'قيد المراجعة', href: '/merchant/moderation' },
  
    { icon: '👥', title: 'العملاء', href: '/merchant/customers' },],
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
    { icon: '📚', title: 'الصفوف', href: '/merchant/classes' },
    { icon: '👥', title: 'الطلاب', href: '/merchant/students' },
    { icon: '📊', title: 'العلامات', href: '/merchant/grades' },
    { icon: '📋', title: 'الحضور', href: '/merchant/attendance' },
    { icon: '💰', title: 'الرسوم', href: '/merchant/fees' },
    { icon: '📄', title: 'ملفات الصفوف', href: '/merchant/class_files' },
        { icon: '⚙️', title: 'إعدادات حسابي', href: '/merchant/settings' },
{ icon: '💎', title: 'اشتراكي', href: '/merchant/subscription' },
    { icon: '⏳', title: 'قيد المراجعة', href: '/merchant/moderation' },
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
    { icon: '📖', title: 'الدروس', href: '/merchant/lessons' },
    { icon: '🗣️', title: 'خطب الجمعة', href: '/merchant/sermons' },
    { icon: '🎯', title: 'الحلقات', href: '/merchant/circles' },
    { icon: '🎁', title: 'التبرعات', href: '/merchant/donations' },
        { icon: '⚙️', title: 'إعدادات حسابي', href: '/merchant/settings' },
{ icon: '💎', title: 'اشتراكي', href: '/merchant/subscription' },
    { icon: '⏳', title: 'قيد المراجعة', href: '/merchant/moderation' },
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
    { icon: '📢', title: 'التعاميم', href: '/merchant/announcements' },
    { icon: '📋', title: 'الطلبات', href: '/merchant/office_requests' },
    { icon: '📩', title: 'الشكاوى', href: '/merchant/office_requests' },
    { icon: '🏗️', title: 'المشاريع', href: '/merchant/budget' },
    { icon: '📜', title: 'الشهادات', href: '/merchant/documents' },
        { icon: '⚙️', title: 'إعدادات حسابي', href: '/merchant/settings' },
{ icon: '💎', title: 'اشتراكي', href: '/merchant/subscription' },
    { icon: '⏳', title: 'قيد المراجعة', href: '/merchant/moderation' },
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
    { icon: '📢', title: 'الإعلانات', href: '/merchant/announcements' },
    { icon: '📩', title: 'الطلبات والشكاوى', href: '/merchant/office_requests' },
    { icon: '📜', title: 'الشهادات', href: '/merchant/office_requests' },
    { icon: '🏗️', title: 'المشاريع', href: '/merchant/office_requests' },
        { icon: '⚙️', title: 'إعدادات حسابي', href: '/merchant/settings' },
{ icon: '💎', title: 'اشتراكي', href: '/merchant/subscription' },
    { icon: '⏳', title: 'قيد المراجعة', href: '/merchant/moderation' },
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
    { icon: '🎁', title: 'التبرعات', href: '/merchant/donations' },
    { icon: '👥', title: 'طلبات المساعدة', href: '/merchant/elderly_requests' },
    { icon: '🤝', title: 'المتطوعون', href: '/merchant/volunteers' },
    { icon: '📢', title: 'الإعلانات', href: '/merchant/announcements' },
        { icon: '⚙️', title: 'إعدادات حسابي', href: '/merchant/settings' },
{ icon: '💎', title: 'اشتراكي', href: '/merchant/subscription' },
    { icon: '⏳', title: 'قيد المراجعة', href: '/merchant/moderation' },
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
    { icon: '👥', title: 'الفريق', href: '/merchant/sports_players' },
    { icon: '⚽', title: 'المباريات', href: '/merchant/sports_matches' },
    { icon: '🏆', title: 'الترتيب', href: '/merchant/sports_standings' },
    { icon: '📢', title: 'الإعلانات', href: '/merchant/announcements' },
        { icon: '⚙️', title: 'إعدادات حسابي', href: '/merchant/settings' },
{ icon: '💎', title: 'اشتراكي', href: '/merchant/subscription' },
    { icon: '⏳', title: 'قيد المراجعة', href: '/merchant/moderation' },
  ],
};

C.hotel = {
  label: 'فندق', icon: '🏨', greeting: 'أهلًا بك', theme: T.orange,
  tagline: 'إدارة حجوزاتك وضيوفك',
  stats: [
    { key: 'bookings', label: 'حجز' },
    { key: 'guests', label: 'ضيف' },
    { key: 'revenue', label: 'إيراد' },
  ],
  quickActions: [
    { icon: '🏨', title: 'الحجوزات', href: '/merchant/bookings' },
    { icon: '👥', title: 'الموظفون', href: '/merchant/employees' },
    { icon: '⭐', title: 'التقييمات', href: '/merchant/reviews' },
    { icon: '💬', title: 'الدردشة', href: '/merchant/chat' },
        { icon: '⚙️', title: 'إعدادات حسابي', href: '/merchant/settings' },
{ icon: '💎', title: 'اشتراكي', href: '/merchant/subscription' },
    { icon: '⏳', title: 'قيد المراجعة', href: '/merchant/moderation' },
  
    { icon: '👥', title: 'العملاء', href: '/merchant/customers' },],
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
    { icon: '🖼️', title: 'المعرض', href: '/merchant/memory_items' },
    { icon: '📖', title: 'الحكايات', href: '/merchant/memory_stories' },
    { icon: '📍', title: 'الأماكن', href: '/merchant/memory_places' },
    { icon: '📢', title: 'الإعلانات', href: '/merchant/announcements' },
        { icon: '⚙️', title: 'إعدادات حسابي', href: '/merchant/settings' },
{ icon: '💎', title: 'اشتراكي', href: '/merchant/subscription' },
    { icon: '⏳', title: 'قيد المراجعة', href: '/merchant/moderation' },
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
    { icon: '📋', title: 'الطلبات', href: '/merchant/office_requests' },
    { icon: '💼', title: 'الوظائف', href: '/merchant/job_postings' },
    { icon: '👤', title: 'الباحثون', href: '/merchant/job_seekers' },
    { icon: '💬', title: 'الدردشة', href: '/merchant/chat' },
        { icon: '⚙️', title: 'إعدادات حسابي', href: '/merchant/settings' },
{ icon: '💎', title: 'اشتراكي', href: '/merchant/subscription' },
    { icon: '⏳', title: 'قيد المراجعة', href: '/merchant/moderation' },
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
    { icon: '🚗', title: 'المركبات', href: '/merchant/vehicles' },
    { icon: '🛣️', title: 'الخطوط', href: '/merchant/vehicles' },
    { icon: '🛍️', title: 'الطلبات', href: '/merchant/orders' },
    { icon: '💳', title: 'الدفع', href: '/merchant/payments' },
        { icon: '⚙️', title: 'إعدادات حسابي', href: '/merchant/settings' },
{ icon: '💎', title: 'اشتراكي', href: '/merchant/subscription' },
    { icon: '⏳', title: 'قيد المراجعة', href: '/merchant/moderation' },
  
    { icon: '👥', title: 'العملاء', href: '/merchant/customers' },],
};


C.exchange = {
  label: 'مكتب صرافة', icon: '💱', greeting: 'أهلًا بك', theme: T.sky,
  tagline: 'إدارة أسعار الصرف والحوالات',
  stats: [
    { key: 'currencies', label: 'عملة' },
    { key: 'updates', label: 'تحديث اليوم' },
    { key: 'transfers', label: 'حوالة' },
  ],
  quickActions: [
    { icon: '💱', title: 'تحديث الأسعار', href: '/merchant/exchange-rates' },
    { icon: '📊', title: 'التقارير', href: '/merchant/reports' },
    { icon: '👥', title: 'العملاء', href: '/merchant/customers' },
    { icon: '💬', title: 'الدردشة', href: '/merchant/chat' },
        { icon: '⚙️', title: 'إعدادات حسابي', href: '/merchant/settings' },
{ icon: '💎', title: 'اشتراكي', href: '/merchant/subscription' },
    { icon: '⏳', title: 'قيد المراجعة', href: '/merchant/moderation' },
  ],
};

C.craftsman = {
  label: 'حرفي', icon: '🛠️', greeting: 'أهلًا بك', theme: T.amber,
  tagline: 'خدماتك وحرفك وطلباتك',
  stats: [
    { key: 'services', label: 'خدمة' },
    { key: 'orders', label: 'طلب' },
    { key: 'revenue', label: 'دخل' },
    { key: 'reviews', label: 'تقييم' },
  ],
  quickActions: [
    { icon: '🛠️', title: 'خدماتي', href: '/merchant/services' },
    { icon: '📋', title: 'الطلبات', href: '/merchant/orders' },
    { icon: '👥', title: 'العملاء', href: '/merchant/customers' },
    { icon: '🧾', title: 'الفواتير', href: '/merchant/invoices' },
    { icon: '💰', title: 'دفتر الديون', href: '/merchant/debts' },
    { icon: '⭐', title: 'التقييمات', href: '/merchant/reviews' },
    { icon: '💬', title: 'الدردشة', href: '/merchant/chat' },
    { icon: '⚙️', title: 'إعدادات حسابي', href: '/merchant/settings' },
    { icon: '💎', title: 'اشتراكي', href: '/merchant/subscription' },
    { icon: '⏳', title: 'قيد المراجعة', href: '/merchant/moderation' },
  ],
};

C.workshop = {
  label: 'ورشة تصنيع', icon: '🏭', greeting: 'أهلًا بك', theme: T.orange,
  tagline: 'إدارة إنتاجك ومنتجاتك وطلباتك',
  stats: [
    { key: 'products', label: 'منتج' },
    { key: 'orders', label: 'طلب' },
    { key: 'inventory', label: 'مخزون' },
    { key: 'revenue', label: 'مبيعات' },
  ],
  quickActions: [
    { icon: '🏭', title: 'المنتجات', href: '/merchant/products' },
    { icon: '📦', title: 'المخزون', href: '/merchant/inventory' },
    { icon: '🛍️', title: 'الطلبات', href: '/merchant/orders' },
    { icon: '👥', title: 'العملاء', href: '/merchant/customers' },
    { icon: '🧾', title: 'الفواتير', href: '/merchant/invoices' },
    { icon: '💰', title: 'دفتر الديون', href: '/merchant/debts' },
    { icon: '⭐', title: 'التقييمات', href: '/merchant/reviews' },
    { icon: '⚙️', title: 'إعدادات حسابي', href: '/merchant/settings' },
    { icon: '💎', title: 'اشتراكي', href: '/merchant/subscription' },
    { icon: '⏳', title: 'قيد المراجعة', href: '/merchant/moderation' },
  ],
};

C.internet = {
  label: 'مزود إنترنت', icon: '🌐', greeting: 'أهلًا بك', theme: T.sky,
  tagline: 'إدارة الباقات والمشتركين والفواتير',
  stats: [
    { key: 'subscribers', label: 'مشترك' },
    { key: 'plans', label: 'باقة' },
    { key: 'invoices', label: 'فاتورة' },
  ],
  quickActions: [
    { icon: '📶', title: 'الباقات', href: '/merchant/internet/plans' },
    { icon: '👥', title: 'المشتركون', href: '/merchant/internet/subscribers' },
    { icon: '🧾', title: 'الفواتير', href: '/merchant/internet/invoices' },
    { icon: '🛠️', title: 'التذاكر', href: '/merchant/internet/tickets' },
    { icon: '💎', title: 'اشتراكي', href: '/merchant/subscription' },
    { icon: '⚙️', title: 'إعدادات حسابي', href: '/merchant/settings' },
  ],
};

// register uses key "isp" — alias to internet config
C.isp = C.internet;

export const ENTITY_CONFIG = C;

export function getEntityConfig(type) {
  return C[type] || C.merchant;
}
