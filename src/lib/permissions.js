// ═══════════════════════════════════════════════════════════
// Sanad RBAC — Role-Based Access Control
// ═══════════════════════════════════════════════════════════

// لكل دور: قائمة الوحدات المسموحة
export const ROLE_MATRIX = {
  // ═══ المالك (كل شيء) ═══
  owner: ['*'],

  // ═══ الأدوار العامة ═══
  manager: [
    'dashboard', 'orders', 'products', 'customers', 'employees',
    'debts', 'invoices', 'reports', 'coupons', 'announcements',
    'jobs', 'realestate', 'library', 'tourism', 'lostfound',
    'teachers', 'classes', 'students', 'grades',
    'doctor_schedules', 'medical_records', 'prescriptions',
    'internet', 'sports_matches', 'sports_players', 'sports_standings',
    'payment_methods.read', 'settings.read',
  ],
  
  sales: ['orders.*', 'products.read', 'customers.*', 'coupons.read', 'reports.read'],
  cashier: ['orders.read', 'invoices.*', 'customers.read', 'reports.read'],
  delivery: ['orders.read', 'orders.write'],
  accountant: ['invoices.*', 'debts.*', 'payments.*', 'reports.read'],
  employee: ['orders.read', 'products.read'],

  // ═══ قطاع التعليم ═══
  principal: ['teachers.*', 'classes.*', 'students.*', 'grades.*', 'reports.read', 'employees.read'],
  teacher: ['classes.read', 'students.read', 'grades.read', 'grades.write'],
  supervisor: ['students.*', 'classes.read', 'grades.read'],

  // ═══ قطاع الصحة ═══
  doctor: ['doctor_schedules.*', 'medical_records.*', 'prescriptions.*', 'customers.read'],
  nurse: ['medical_records.read', 'prescriptions.read', 'doctor_schedules.read'],
  receptionist: ['customers.*', 'doctor_schedules.read', 'orders.read'],

  // ═══ قطاع الإنترنت ═══
  technician: ['internet.tickets.*', 'internet.subscribers.read'],
  internet_agent: ['internet.*'],

  // ═══ قطاع الرياضة ═══
  coach: ['sports_players.*', 'sports_matches.*', 'sports_standings.read'],
  team_admin: ['sports_matches.*', 'sports_standings.*', 'employees.read'],

  // ═══ قطاع الحرف/الورش ═══
  craftsman: ['orders.read', 'products.read'],
  worker: ['orders.read'],
};

// ═══ التحقق من الصلاحية ═══
export function can(role, permission) {
  if (!role) return false;
  const perms = ROLE_MATRIX[role] || [];
  
  // المالك: كل شيء
  if (perms.includes('*')) return true;
  
  // مطابقة تامة
  if (perms.includes(permission)) return true;
  
  // مطابقة wildcard: "orders.*" يطابق "orders.read" و "orders.write"
  const [group] = permission.split('.');
  if (perms.includes(`${group}.*`)) return true;
  
  // الوحدة كاملة بدون نقطة تطابق الأبناء
  if (perms.includes(group)) return true;
  
  return false;
}

// ═══ إرجاع الأدوار المتاحة حسب القطاع ═══
export const ROLES_BY_SECTOR = {
  merchant: ['manager', 'sales', 'cashier', 'delivery', 'accountant', 'employee'],
  restaurant: ['manager', 'cashier', 'delivery', 'employee'],
  school: ['principal', 'teacher', 'supervisor', 'accountant'],
  doctor: ['doctor', 'nurse', 'receptionist'],
  pharmacy: ['manager', 'cashier', 'employee'],
  isp: ['manager', 'technician', 'internet_agent', 'accountant'],
  sports: ['coach', 'team_admin', 'manager'],
  mosque: ['manager', 'employee'],
  charity: ['manager', 'employee'],
  hotel: ['manager', 'receptionist', 'cashier'],
  office: ['manager', 'employee'],
  exchange: ['manager', 'cashier'],
  transport: ['manager', 'delivery'],
  craftsman: ['craftsman', 'worker'],
  workshop: ['manager', 'worker'],
  memory: ['manager', 'employee'],
  municipality: ['manager', 'employee'],
  council: ['manager', 'employee'],
};

// ═══ معلومات العرض لكل دور ═══
export const ROLE_INFO = {
  owner: { label: 'مالك', icon: '👑', color: '#f59e0b' },
  manager: { label: 'مدير', icon: '👔', color: '#8b5cf6' },
  sales: { label: 'مبيعات', icon: '💼', color: '#3b82f6' },
  cashier: { label: 'كاشير', icon: '💰', color: '#10b981' },
  delivery: { label: 'توصيل', icon: '🚚', color: '#f59e0b' },
  accountant: { label: 'محاسب', icon: '📊', color: '#059669' },
  employee: { label: 'موظف', icon: '👤', color: '#64748b' },
  principal: { label: 'مدير مدرسة', icon: '🎓', color: '#8b5cf6' },
  teacher: { label: 'معلم', icon: '📚', color: '#0ea5e9' },
  supervisor: { label: 'مشرف', icon: '👨‍🏫', color: '#06b6d4' },
  doctor: { label: 'طبيب', icon: '👨‍⚕️', color: '#ef4444' },
  nurse: { label: 'ممرض', icon: '👩‍⚕️', color: '#f472b6' },
  receptionist: { label: 'استقبال', icon: '📞', color: '#3b82f6' },
  technician: { label: 'فني', icon: '🔧', color: '#f59e0b' },
  internet_agent: { label: 'وكيل مشتركين', icon: '📡', color: '#0ea5e9' },
  coach: { label: 'مدرب', icon: '⚽', color: '#10b981' },
  team_admin: { label: 'إداري فريق', icon: '📋', color: '#64748b' },
  craftsman: { label: 'حرفي', icon: '🛠️', color: '#f97316' },
  worker: { label: 'عامل', icon: '👷', color: '#78716c' },
};

// ═══ القائمة الجانبية الديناميكية ═══
export const NAV_ITEMS = [
  { key: 'dashboard', href: '/merchant', icon: '📊', label: 'الرئيسية', module: 'dashboard' },
  { key: 'orders', href: '/merchant/orders', icon: '📋', label: 'الطلبات', module: 'orders.read' },
  { key: 'products', href: '/merchant/products', icon: '📦', label: 'المنتجات', module: 'products.read' },
  { key: 'customers', href: '/merchant/customers', icon: '👥', label: 'العملاء', module: 'customers.read' },
  { key: 'employees', href: '/merchant/employees', icon: '👨‍💼', label: 'الفريق', module: 'employees.read' },
  { key: 'debts', href: '/merchant/debts', icon: '💰', label: 'الديون', module: 'debts.read' },
  { key: 'invoices', href: '/merchant/invoices', icon: '🧾', label: 'الفواتير', module: 'invoices.read' },
  { key: 'reports', href: '/merchant/reports', icon: '📈', label: 'التقارير', module: 'reports.read' },
  { key: 'coupons', href: '/merchant/coupons', icon: '🎟️', label: 'الكوبونات', module: 'coupons.read' },
  { key: 'announcements', href: '/merchant/announcements', icon: '📢', label: 'الإعلانات', module: 'announcements.read' },
  { key: 'teachers', href: '/merchant/teachers', icon: '👨‍🏫', label: 'المعلمون', module: 'teachers.read' },
  { key: 'classes', href: '/merchant/classes', icon: '📚', label: 'الصفوف', module: 'classes.read' },
  { key: 'students', href: '/merchant/students', icon: '🎓', label: 'الطلاب', module: 'students.read' },
  { key: 'grades', href: '/merchant/grades', icon: '📊', label: 'العلامات', module: 'grades.read' },
  { key: 'doctor_schedules', href: '/merchant/doctor_schedules', icon: '📅', label: 'المواعيد', module: 'doctor_schedules.read' },
  { key: 'medical_records', href: '/merchant/medical_records', icon: '📋', label: 'السجلات', module: 'medical_records.read' },
  { key: 'prescriptions', href: '/merchant/prescriptions', icon: '💊', label: 'الوصفات', module: 'prescriptions.read' },
  { key: 'internet', href: '/merchant/internet/plans', icon: '📡', label: 'الإنترنت', module: 'internet.read' },
  { key: 'sports_matches', href: '/merchant/sports_matches', icon: '⚽', label: 'المباريات', module: 'sports_matches.read' },
  { key: 'sports_players', href: '/merchant/sports_players', icon: '🏃', label: 'اللاعبون', module: 'sports_players.read' },
  { key: 'sports_standings', href: '/merchant/sports_standings', icon: '🏆', label: 'الترتيب', module: 'sports_standings.read' },
  { key: 'jobs', href: '/merchant/jobs', icon: '💼', label: 'الوظائف', module: 'jobs.read' },
  { key: 'realestate', href: '/merchant/realestate', icon: '🏠', label: 'العقارات', module: 'realestate.read' },
  { key: 'library', href: '/merchant/library', icon: '📚', label: 'المكتبة', module: 'library.read' },
  { key: 'tourism', href: '/merchant/tourism', icon: '🏛️', label: 'السياحة', module: 'tourism.read' },
  { key: 'lostfound', href: '/merchant/lostfound', icon: '🔍', label: 'المفقودات', module: 'lostfound.read' },
  { key: 'settings', href: '/merchant/settings', icon: '⚙️', label: 'الإعدادات', module: 'settings.read' },
];

export function filterNavByRole(role) {
  return NAV_ITEMS.filter(item => can(role, item.module));
}
