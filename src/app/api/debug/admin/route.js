import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

function hashSHA256Salted(pwd) {
  return crypto.createHash('sha256').update(pwd + 'sanad_salt_v1').digest('hex');
}

export async function POST(req) {
  const result = { steps: [] };

  try {
    result.steps.push({ step: 'SERVICE_KEY', ok: !!process.env.SUPABASE_SERVICE_ROLE_KEY, value: process.env.SUPABASE_SERVICE_ROLE_KEY ? 'موجود (يبدأ بـ ' + process.env.SUPABASE_SERVICE_ROLE_KEY.slice(0, 15) + '...)' : 'مفقود' });
    result.steps.push({ step: 'URL', ok: !!process.env.NEXT_PUBLIC_SUPABASE_URL, value: process.env.NEXT_PUBLIC_SUPABASE_URL || 'مفقود' });

    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json({ error: 'SERVICE_ROLE_KEY مفقود', ...result });
    }

    const body = await req.json().catch(() => ({}));
    const testUsername = body.username || '';
    const testPassword = body.password || '';

    const admin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      { auth: { persistSession: false } }
    );

    // قراءة كل حسابات الأدمن
    const { data: accounts, error: accErr } = await admin
      .from('admin_accounts')
      .select('id, username, is_active, password_hash, role');

    if (accErr) {
      result.steps.push({ step: 'READ_ADMIN_ACCOUNTS', ok: false, value: accErr.message });
    } else {
      result.steps.push({ step: 'READ_ADMIN_ACCOUNTS', ok: true, value: `${(accounts || []).length} حساب` });
      result.accounts = (accounts || []).map(a => ({
        username: a.username,
        is_active: a.is_active,
        hash_length: a.password_hash ? a.password_hash.length : 0,
        hash_preview: a.password_hash ? a.password_hash.slice(0, 12) + '...' : null,
      }));
    }

    // قراءة admin_users
    const { data: users, error: usrErr } = await admin
      .from('admin_users')
      .select('id, username, is_active, password_hash, role');

    if (!usrErr && users && users.length > 0) {
      result.steps.push({ step: 'READ_ADMIN_USERS', ok: true, value: `${users.length} حساب` });
      result.admin_users = users.map(u => ({
        username: u.username,
        is_active: u.is_active,
        hash_length: u.password_hash ? u.password_hash.length : 0,
      }));
    }

    // فحص كلمة المرور إن أُعطيت
    if (testUsername && testPassword) {
      const hashed = hashSHA256Salted(testPassword);
      const account = (accounts || []).find(a => a.username === testUsername.toLowerCase().trim());
      
      if (!account) {
        result.steps.push({ step: 'FIND_ACCOUNT', ok: false, value: `لم أجد حساباً باسم "${testUsername}"` });
      } else {
        result.steps.push({ step: 'FIND_ACCOUNT', ok: true, value: 'الحساب موجود' });
        result.steps.push({ step: 'IS_ACTIVE', ok: account.is_active === true, value: `is_active = ${account.is_active}` });
        result.steps.push({ step: 'HASH_MATCH', ok: account.password_hash === hashed, value: account.password_hash === hashed ? 'متطابقة ✅' : 'غير متطابقة ❌' });
        result.computed_hash_preview = hashed.slice(0, 12) + '...';
        result.stored_hash_preview = account.password_hash ? account.password_hash.slice(0, 12) + '...' : 'فارغ';
      }
    }

    return NextResponse.json(result);
  } catch (err) {
    result.error = err.message;
    return NextResponse.json(result);
  }
}
