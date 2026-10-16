// ═══════════════════════════════════════════════
// نظام حسابات العملاء — سند
// ═══════════════════════════════════════════════
import { supabase } from './supabase';

const STORAGE_KEY = 'sanad_customer';

// ═══ Hash كلمة المرور ═══
export async function hashPassword(password) {
  const encoder = new TextEncoder();
  const data = encoder.encode(password + 'sanad_customer_2026');
  const hash = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

// ═══ تسجيل عميل جديد ═══
export async function registerCustomer({ full_name, phone, password, email, address }) {
  if (!supabase) throw new Error('قاعدة البيانات غير متصلة');
  
  const cleanPhone = phone.replace(/[^0-9]/g, '');
  if (cleanPhone.length < 9) throw new Error('رقم الهاتف غير صحيح');
  if (!full_name || full_name.length < 3) throw new Error('الاسم مطلوب');
  if (!password || password.length < 4) throw new Error('كلمة المرور 4 أحرف على الأقل');

  // تحقق من التكرار
  const { data: existing } = await supabase
    .from('customers')
    .select('id')
    .eq('phone', cleanPhone)
    .maybeSingle();
  
  if (existing) throw new Error('رقم الهاتف مسجل مسبقاً — سجّل دخولك');

  const password_hash = await hashPassword(password);

  const { data: newCustomer, error } = await supabase
    .from('customers')
    .insert({
      full_name: full_name.trim(),
      phone: cleanPhone,
      email: email?.trim() || null,
      address: address?.trim() || null,
      password_hash,
      is_active: true,
      loyalty_points: 0,
      total_spent: 0,
    })
    .select('*')
    .single();

  if (error) throw error;
  saveCustomerSession(newCustomer);
  return newCustomer;
}

// ═══ تسجيل دخول عميل ═══
export async function loginCustomer({ phone, password }) {
  if (!supabase) throw new Error('قاعدة البيانات غير متصلة');
  
  const cleanPhone = phone.replace(/[^0-9]/g, '');
  if (!cleanPhone) throw new Error('رقم الهاتف مطلوب');
  if (!password) throw new Error('كلمة المرور مطلوبة');

  const { data: customer, error } = await supabase
    .from('customers')
    .select('*')
    .eq('phone', cleanPhone)
    .maybeSingle();

  if (error || !customer) throw new Error('رقم الهاتف أو كلمة المرور غير صحيحة');
  if (!customer.is_active) throw new Error('الحساب موقوف');
  if (!customer.password_hash) throw new Error('الحساب ما فيه كلمة مرور — سجّل من جديد');

  const password_hash = await hashPassword(password);
  if (customer.password_hash !== password_hash) {
    throw new Error('رقم الهاتف أو كلمة المرور غير صحيحة');
  }

  // نحدّث آخر دخول
  await supabase
    .from('customers')
    .update({ last_login: new Date().toISOString() })
    .eq('id', customer.id);

  saveCustomerSession(customer);
  return customer;
}

// ═══ حفظ الجلسة ═══
function saveCustomerSession(customer) {
  if (typeof window === 'undefined') return;
  const session = {
    id: customer.id,
    full_name: customer.full_name,
    phone: customer.phone,
    email: customer.email,
    address: customer.address,
    avatar_url: customer.avatar_url,
    loyalty_points: customer.loyalty_points || 0,
    total_spent: customer.total_spent || 0,
    logged_at: new Date().toISOString(),
    is_guest: false,
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
  window.dispatchEvent(new Event('sanad-customer-change'));
}

// ═══ جلسة الزائر (مؤقتة) ═══
export function saveGuestSession(data) {
  if (typeof window === 'undefined') return;
  const session = {
    full_name: data.full_name,
    phone: data.phone,
    address: data.address || null,
    is_guest: true,
    saved_at: new Date().toISOString(),
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
  window.dispatchEvent(new Event('sanad-customer-change'));
  return session;
}

// ═══ استرجاع الجلسة ═══
export function getCustomer() {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

// ═══ تسجيل الخروج ═══
export function logoutCustomer() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(STORAGE_KEY);
  window.dispatchEvent(new Event('sanad-customer-change'));
}

// ═══ تحديث بيانات الجلسة ═══
export function updateCustomerSession(patch) {
  const current = getCustomer();
  if (!current) return;
  const updated = { ...current, ...patch };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  window.dispatchEvent(new Event('sanad-customer-change'));
}
