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
    const { identifier, password } = await req.json();
    if (!identifier || !password) {
      return NextResponse.json({ error: 'أدخل اسم المستخدم وكلمة المرور' }, { status: 400 });
    }

    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!serviceKey) {
      return NextResponse.json({ error: 'إعدادات الخادم غير مكتملة' }, { status: 500 });
    }

    const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, serviceKey, { auth: { persistSession: false } });
    const normalizedPhone = identifier.replace(/[^0-9]/g, '');
    const isPhone = normalizedPhone.length >= 8 && /^[0-9+\s-]+$/.test(identifier);
    const uname = identifier.trim().toLowerCase();

    // 1. البحث في entities
    const { data: allEntities } = await admin.from('entities').select('*');
    const entity = (allEntities || []).find(e => {
      if (isPhone && e.phone) {
        return e.phone.replace(/[^0-9]/g, '').slice(-9) === normalizedPhone.slice(-9);
      }
      return (e.username || '').toLowerCase() === uname;
    });

    if (entity && matches(entity.password_hash, password)) {
      if (entity.approval_status === 'rejected') return NextResponse.json({ error: 'حسابك مرفوض' }, { status: 403 });
      if (entity.is_active === false) return NextResponse.json({ error: 'حسابك موقوف' }, { status: 403 });
      return NextResponse.json({
        ok: true,
        entity: {
          id: entity.id,
          display_name: entity.display_name,
          entity_type: entity.entity_type,
          username: entity.username,
          phone: entity.phone,
          is_employee: false,
        },
      });
    }

    // 2. البحث في employees
    const { data: allEmployees } = await admin.from('employees').select('*');
    const emp = (allEmployees || []).find(e => {
      if (e.is_active === false) return false;
      if (isPhone && e.phone) {
        return e.phone.replace(/[^0-9]/g, '').slice(-9) === normalizedPhone.slice(-9);
      }
      return (e.username || '').toLowerCase() === uname;
    });

    if (emp && matches(emp.password_hash, password)) {
      const parent = (allEntities || []).find(e => e.display_name === emp.entity_name);
      if (!parent) return NextResponse.json({ error: 'المتجر غير موجود' }, { status: 404 });
      if (parent.approval_status !== 'approved') return NextResponse.json({ error: 'متجرك غير معتمد' }, { status: 403 });
      return NextResponse.json({
        ok: true,
        entity: {
          id: emp.id,
          display_name: parent.display_name,
          entity_type: parent.entity_type,
          username: emp.username,
          phone: emp.phone,
          is_employee: true,
          parent_entity_id: parent.id,
          role: emp.role,
          permissions: emp.permissions || [],
          full_name: emp.full_name,
        },
      });
    }

    return NextResponse.json({ error: 'بيانات الدخول غير صحيحة' }, { status: 401 });
  } catch (err) {
    console.error('[merchant-auth] exception:', err);
    return NextResponse.json({ error: 'خطأ في الخادم' }, { status: 500 });
  }
}
