// ═══════════════════════════════════════════════
// نظام المصادقة — سند
// ═══════════════════════════════════════════════
import { supabase } from './supabase';

const STORAGE_KEY = 'sanad_auth_session';
const LEGACY_KEY = 'sanad_entity'; // للتوافق مع الصفحات القديمة

// ═══ توليد Hash لكلمة المرور ═══
export async function hashPassword(password) {
  const encoder = new TextEncoder();
  const data = encoder.encode(password + 'sanad_salt_2026');
  const hash = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

// ═══ تسجيل حساب جديد ═══
export async function registerEntity({ phone, password, display_name, entity_type, pendingApproval = false, plan_id = null }) {
  if (!supabase) throw new Error('قاعدة البيانات غير متصلة');

  const cleanPhone = phone.replace(/[^0-9]/g, '');
  if (cleanPhone.length < 9) throw new Error('رقم الهاتف غير صحيح');
  if (!display_name || display_name.length < 3) throw new Error('الاسم مطلوب');
  if (!password || password.length < 6) throw new Error('كلمة المرور 6 أحرف على الأقل');

  const { data: existing } = await supabase
    .from('entities')
    .select('id')
    .eq('phone', cleanPhone)
    .maybeSingle();
  
  if (existing) throw new Error('رقم الهاتف مسجل مسبقاً');

  const baseUsername = cleanPhone.slice(-6) || 'user';
  const username = `u${baseUsername}${Math.floor(Math.random() * 100)}`;

  const password_hash = await hashPassword(password);

  const { data: newEntity, error } = await supabase
    .from('entities')
    .insert({
      username,
      display_name: display_name.trim(),
      entity_type: entity_type || 'merchant',
      phone: cleanPhone,
      password_hash,
      is_active: !pendingApproval,
      is_verified: false,
      is_trusted: false,
      approval_status: pendingApproval ? 'pending' : 'approved',
    })
    .select('*')
    .single();

  if (error) throw error;

  // ═══ إنشاء اشتراك شهري للباقة المختارة ═══
  try {
    // نجلب الباقة
    let plan = null;
    if (plan_id) {
      const { data: planData } = await supabase
        .from('subscription_plans')
        .select('*')
        .eq('id', plan_id)
        .maybeSingle();
      plan = planData;
    }
    
    // إذا لا يوجد باقة محددة → نستخدم Free
    if (!plan) {
      const { data: freePlan } = await supabase
        .from('subscription_plans')
        .select('*')
        .eq('name', 'free')
        .maybeSingle();
      plan = freePlan;
    }

    if (plan) {
      const now = new Date();
      const expiresAt = new Date(now);
      if (plan.period === 'yearly') {
        expiresAt.setFullYear(expiresAt.getFullYear() + 1);
      } else {
        expiresAt.setMonth(expiresAt.getMonth() + 1);
      }

      // نضيف الاشتراك
      await supabase.from('entity_subscriptions').insert({
        entity_id: newEntity.id,
        plan_id: plan.id,
        plan_name: plan.name,
        plan_price: plan.price || 0,
        plan_period: plan.period || 'monthly',
        status: pendingApproval ? 'pending' : 'active',
        started_at: now.toISOString(),
        expires_at: expiresAt.toISOString(),
        reminder_sent: false,
        expired_notified: false,
      });

      // نحدّث entities
      await supabase.from('entities').update({
        subscription_plan: plan.name,
        subscription_expires: expiresAt.toISOString(),
      }).eq('id', newEntity.id);

      newEntity.subscription_plan = plan.name;
      newEntity.subscription_expires = expiresAt.toISOString();
    }
  } catch (e) {
    console.warn('subscription create failed:', e);
  }

  // نحفظ الجلسة فقط إذا لا يوجد انتظار موافقة
  if (!pendingApproval) saveSession(newEntity);
  return newEntity;
}

// ═══ تسجيل الدخول ═══
export async function loginEntity({ phone, username, password }) {
  if (!supabase) throw new Error('قاعدة البيانات غير متصلة');

  if (!password) throw new Error('كلمة المرور مطلوبة');
  if (!phone && !username) throw new Error('اسم المستخدم أو رقم الهاتف مطلوب');

  let query = supabase.from('entities').select('*');
  let searchValue = null;
  let searchField = null;

  // 1) لو أدخل username (يبدأ بحرف أو abode)
  if (username && username.trim()) {
    query = query.eq('username', username.trim());
    searchValue = username.trim();
    searchField = 'username';
  }
  // 2) لو أدخل phone (أرقام فقط)
  else if (phone) {
    const cleanPhone = phone.replace(/[^0-9]/g, '');
    if (!cleanPhone) throw new Error('رقم الهاتف غير صالح');
    query = query.eq('phone', cleanPhone);
    searchValue = cleanPhone;
    searchField = 'phone';
  }

  const { data: entity, error } = await query.maybeSingle();

  if (error || !entity) throw new Error('رقم الهاتف أو كلمة المرور غير صحيحة');
  if (!entity.is_active) {
    if (entity.approval_status === 'pending') {
      throw new Error('⏳ حسابك قيد المراجعة — يرجى الانتظار حتى توافق الإدارة');
    }
    throw new Error('الحساب موقوف — تواصل مع الإدارة');
  }

  const password_hash = await hashPassword(password);
  if (entity.password_hash !== password_hash) {
    throw new Error('رقم الهاتف أو كلمة المرور غير صحيحة');
  }

  saveSession(entity);
  return entity;
}

// ═══ حفظ الجلسة (يوجد الاثنين للتوافق) ═══
function saveSession(entity) {
  if (typeof window === 'undefined') return;
  
  const session = {
    type: 'owner',
    id: entity.id,
    username: entity.username,
    display_name: entity.display_name,
    entity_type: entity.entity_type,
    phone: entity.phone,
    is_trusted: entity.is_trusted,
    is_verified: entity.is_verified,
    is_section_admin: entity.is_section_admin === true,
    logo_url: entity.logo_url,
    cover_url: entity.cover_url,
    bio: entity.bio,
    logged_at: new Date().toISOString(),
    // ═══ جلسة دائمة — لا تنتهي ═══
    persistent: true,
  };
  
  const json = JSON.stringify(session);
  localStorage.setItem(STORAGE_KEY, json);
  localStorage.setItem(LEGACY_KEY, json);
  
  window.dispatchEvent(new Event('sanad-auth-change'));
}

// ═══ استرجاع الجلسة ═══
export function getSession() {
  if (typeof window === 'undefined') return null;
  try {
    // نجرّب الجديد أول
    let raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) raw = localStorage.getItem(LEGACY_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

// ═══ تسجيل الخروج ═══
export function logout() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem(LEGACY_KEY);
  window.dispatchEvent(new Event('sanad-auth-change'));
}

// ═══ تحديث بيانات الجلسة ═══
export function updateSession(patch) {
  const current = getSession();
  if (!current) return;
  const updated = { ...current, ...patch };
  const json = JSON.stringify(updated);
  localStorage.setItem(STORAGE_KEY, json);
  localStorage.setItem(LEGACY_KEY, json);
  window.dispatchEvent(new Event('sanad-auth-change'));
}


// ═══ تسجيل دخول الموظف ═══
export async function loginEmployee({ phone, password }) {
  if (!supabase) throw new Error('قاعدة البيانات غير متصلة');
  if (!phone || !password) throw new Error('الهاتف وكلمة المرور مطلوبان');

  const cleanPhone = phone.replace(/[^0-9]/g, '');

  const { data: employee, error } = await supabase
    .from('employees')
    .select('*')
    .eq('phone', cleanPhone)
    .maybeSingle();

  if (error || !employee) throw new Error('رقم الهاتف أو كلمة المرور غير صحيحة');
  if (!employee.is_active) throw new Error('الحساب موقوف — تواصل مع صاحب المتجر');
  if (!employee.password_hash) throw new Error('لم يتم تعيين كلمة مرور لهذا الحساب');

  const password_hash = await hashPassword(password);
  if (employee.password_hash !== password_hash) {
    throw new Error('رقم الهاتف أو كلمة المرور غير صحيحة');
  }

  const { data: entity } = await supabase
    .from('entities')
    .select('*')
    .eq('display_name', employee.entity_name)
    .maybeSingle();

  if (!entity) throw new Error('المتجر غير موجود');
  if (!entity.is_active) throw new Error('المتجر موقوف');

  const session = {
    type: 'employee',
    id: employee.id,
    full_name: employee.full_name,
    phone: employee.phone,
    role: employee.role,
    permissions: Array.isArray(employee.permissions) ? employee.permissions : [],
    entity_id: entity.id,
    entity_name: entity.display_name,
    entity_type: entity.entity_type,
    is_trusted: entity.is_trusted,
    logged_at: new Date().toISOString(),
    persistent: true,
  };

  const json = JSON.stringify(session);
  localStorage.setItem(STORAGE_KEY, json);
  localStorage.setItem(LEGACY_KEY, json);
  window.dispatchEvent(new Event('sanad-auth-change'));

  return { employee, entity };
}
