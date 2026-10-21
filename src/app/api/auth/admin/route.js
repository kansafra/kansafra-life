import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

function tryAllHashes(password) {
  const hashes = [];
  try {
    hashes.push(crypto.createHash('sha256').update(password + 'sanad_salt_v1').digest('hex'));
    hashes.push(crypto.createHash('sha256').update(password).digest('hex'));
    hashes.push(crypto.createHash('sha1').update(password + 'sanad_salt_v1').digest('hex'));
    hashes.push(crypto.createHash('sha1').update(password).digest('hex'));
    hashes.push(Buffer.from(password).toString('base64'));
    hashes.push(password);
  } catch {}
  return hashes;
}

function matches(hash, password) {
  if (!hash) return false;
  return tryAllHashes(password).includes(hash);
}

export async function POST(req) {
  try {
    const { username, password } = await req.json();
    if (!username || !password) {
      return NextResponse.json({ error: 'أدخل اسم المستخدم وكلمة المرور' }, { status: 400 });
    }

    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!serviceKey) {
      console.error('[admin-auth] SERVICE_ROLE_KEY مفقود');
      return NextResponse.json({ error: 'إعدادات الخادم غير مكتملة، تواصل مع الدعم' }, { status: 500 });
    }

    const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, serviceKey, { auth: { persistSession: false } });
    const uname = username.trim().toLowerCase();

    // تم حذف فحص جدول admin_accounts لأنه كان يسبب توقف الكود

    // محاولة admin_users
    const { data: allUsers } = await admin.from('admin_users').select('*');
    const user = (allUsers || []).find(u => (u.username || '').toLowerCase() === uname);
    
    if (user && matches(user.password_hash, password)) {
      if (user.is_active === false) {
        return NextResponse.json({ error: 'الحساب معطّل — تواصل مع الدعم' }, { status: 403 });
      }
      return NextResponse.json({
        ok: true,
        admin: {
          id: user.id,
          username: user.username,
          display_name: user.full_name || user.username,
          role: user.role || 'admin',
        },
      });
    }

    return NextResponse.json({ error: 'بيانات الدخول غير صحيحة' }, { status: 401 });
  } catch (err) {
    console.error('[admin-auth] exception:', err);
    return NextResponse.json({ error: 'خطأ في الخادم' }, { status: 500 });
  }
}
