// ═══════════════════════════════════════════════
// نظام الصلاحيات — سند
// ═══════════════════════════════════════════════

// ═══ الصلاحيات لكل دور ═══
export const ROLES = {
  guest: {
    name: 'زائر',
    icon: '👤',
    canBrowse: true,      // تصفح
    canBuy: true,         // شراء
    canBook: true,        // حجز
    canReview: true,      // تقييم
    canFavorite: true,    // مفضلة (محلية)
    hasDashboard: false,  // لوحة تحكم
    hasHistory: false,    // سجل طلبات
    hasLoyalty: false,    // نقاط ولاء
    needsApproval: false,
  },
  customer: {
    name: 'عميل',
    icon: '🛍️',
    canBrowse: true,
    canBuy: true,
    canBook: true,
    canReview: true,
    canFavorite: true,
    hasDashboard: false,
    hasHistory: true,     // يحفظ السجل
    hasLoyalty: true,     // يجمع نقاط
    needsApproval: false,
  },
  merchant: {
    name: 'تاجر',
    icon: '🏪',
    canBrowse: true,
    canBuy: true,
    canBook: true,
    canReview: true,
    canFavorite: true,
    hasDashboard: true,
    hasHistory: true,
    hasLoyalty: true,
    needsApproval: true,
  },
  admin: {
    name: 'مدير',
    icon: '👑',
    canBrowse: true,
    canBuy: true,
    canBook: true,
    canReview: true,
    canFavorite: true,
    hasDashboard: true,
    hasHistory: true,
    hasLoyalty: true,
    canManage: true,      // إدارة كل شي
    needsApproval: false,
  },
};

// ═══ ما لا يقدر عليه الزائر ═══
export const GUEST_RESTRICTED = [
  'لا يمكنه حفظ سجل الطلبات',
  'لا يمكنه جمع نقاط الولاء',
  'لا يمكنه الوصول للوحة التحكم',
  'بياناته تُحفظ محلياً على جهازه فقط',
];

// ═══ فحص الصلاحية ═══
export function can(role, action) {
  const r = ROLES[role];
  if (!r) return false;
  return r[action] === true;
}

// ═══ جلب صلاحيات الزائر ═══
export function getGuestPermissions() {
  return ROLES.guest;
}

// ═══ جلب صلاحيات العميل ═══
export function getCustomerPermissions() {
  return ROLES.customer;
}

// ═══ التحقق من النوع ═══
export function getUserType(session) {
  if (!session) return 'guest';
  if (session.is_guest) return 'guest';
  if (session.entity_type) return 'merchant';
  if (session.role === 'owner' || session.role === 'admin') return 'admin';
  return 'customer';
}

// ═══ هل يقدر يشتري؟ ═══
export function canPurchase(session) {
  const type = getUserType(session);
  return ROLES[type]?.canBuy === true;
}

// ═══ هل يقدر يحجز؟ ═══
export function canBook(session) {
  const type = getUserType(session);
  return ROLES[type]?.canBook === true;
}

// ═══ هل يقدر يقيّم؟ ═══
export function canReview(session) {
  const type = getUserType(session);
  return ROLES[type]?.canReview === true;
}

// ═══ هل عنده لوحة تحكم؟ ═══
export function hasDashboard(session) {
  const type = getUserType(session);
  return ROLES[type]?.hasDashboard === true;
}
