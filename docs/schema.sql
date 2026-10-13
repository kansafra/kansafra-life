-- Sanad Database Schema
-- PostgreSQL (Supabase)

create table if not exists service_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique not null,
  description text,
  icon text,
  sort_order int default 0,
  is_active boolean default true,
  created_at timestamptz default now()
);

create table if not exists services (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  provider_name text,
  phone text,
  address text,
  image_url text,
  category_id uuid,
  is_featured boolean default false,
  status text default 'active',
  created_at timestamptz default now()
);

create table if not exists announcements (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  body text,
  is_published boolean default true,
  created_at timestamptz default now()
);

create table if not exists entities (
  id uuid primary key default gen_random_uuid(),
  username text unique not null,
  password_hash text not null,
  display_name text not null,
  entity_type text not null,
  phone text,
  is_active boolean default true,
  created_at timestamptz default now()
);

create table if not exists products (
  id uuid primary key default gen_random_uuid(),
  provider_name text not null,
  title text not null,
  price numeric(12,2) default 0,
  discount_percent int default 0,
  currency text default 'SYP',
  stock int default 0,
  is_active boolean default true,
  created_at timestamptz default now()
);

create table if not exists orders (
  id uuid primary key default gen_random_uuid(),
  order_code text unique not null,
  provider_name text not null,
  customer_name text not null,
  customer_phone text not null,
  items jsonb,
  total numeric(12,2) default 0,
  currency text default 'SYP',
  status text default 'new',
  created_at timestamptz default now()
);

create table if not exists sos_alerts (
  id uuid primary key default gen_random_uuid(),
  ref_code text unique not null,
  full_name text not null,
  phone text not null,
  category text not null,
  lat double precision,
  lng double precision,
  status text default 'received',
  created_at timestamptz default now()
);

create table if not exists reviews (
  id uuid primary key default gen_random_uuid(),
  target_type text not null,
  target_id text not null,
  reviewer_name text not null,
  rating int,
  comment text,
  is_approved boolean default true,
  created_at timestamptz default now()
);

create table if not exists vehicles (
  id uuid primary key default gen_random_uuid(),
  owner_name text not null,
  phone text not null,
  vehicle_type text not null,
  brand text, model text, plate_number text,
  route text, is_available boolean default true,
  created_at timestamptz default now()
);

create table if not exists appointments (
  id uuid primary key default gen_random_uuid(),
  doctor_name text not null,
  patient_name text not null,
  patient_phone text not null,
  appointment_date date not null,
  appointment_time text not null,
  status text default 'pending',
  created_at timestamptz default now()
);

create table if not exists blood_donors (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  phone text not null,
  blood_type text not null,
  city text,
  is_available boolean default true,
  created_at timestamptz default now()
);

create table if not exists classes (
  id uuid primary key default gen_random_uuid(),
  entity_name text not null,
  grade text not null,
  section text,
  teacher_name text,
  created_at timestamptz default now()
);

create table if not exists memory_stories (
  id uuid primary key default gen_random_uuid(),
  entity_name text not null,
  title text not null,
  body text,
  author_name text,
  decade text,
  is_approved boolean default true,
  created_at timestamptz default now()
);

create table if not exists sports_players (
  id uuid primary key default gen_random_uuid(),
  club_name text not null,
  full_name text not null,
  position text,
  jersey_number int,
  goals int default 0,
  created_at timestamptz default now()
);

create table if not exists communities (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique not null,
  country text, governorate text, district text,
  is_active boolean default true,
  created_at timestamptz default now()
);

create table if not exists chat_threads (
  id uuid primary key default gen_random_uuid(),
  entity_name text not null,
  customer_key text not null,
  customer_name text,
  last_message text,
  created_at timestamptz default now()
);

create table if not exists chat_messages (
  id uuid primary key default gen_random_uuid(),
  thread_id uuid,
  sender text not null,
  body text not null,
  created_at timestamptz default now()
);

create table if not exists admin_users (
  id uuid primary key default gen_random_uuid(),
  username text unique not null,
  password_hash text not null,
  full_name text not null,
  role text default 'admin',
  is_active boolean default true,
  created_at timestamptz default now()
);

create table if not exists audit_log (
  id uuid primary key default gen_random_uuid(),
  actor text, action text not null,
  target_type text, target_id text,
  details jsonb,
  created_at timestamptz default now()
);

-- ═══════════ Row Level Security ═══════════
alter table service_categories enable row level security;
alter table services enable row level security;
alter table announcements enable row level security;
alter table entities enable row level security;
alter table products enable row level security;
alter table orders enable row level security;
alter table sos_alerts enable row level security;
alter table reviews enable row level security;
alter table vehicles enable row level security;
alter table appointments enable row level security;
alter table blood_donors enable row level security;
alter table classes enable row level security;
alter table memory_stories enable row level security;
alter table sports_players enable row level security;
alter table communities enable row level security;
alter table chat_threads enable row level security;
alter table chat_messages enable row level security;
alter table admin_users enable row level security;
alter table audit_log enable row level security;

-- سياسات القراءة العامة
create policy "public_read_service_categories" on service_categories for select to anon, authenticated using (true);
create policy "public_read_services" on services for select to anon, authenticated using (true);
create policy "public_insert_services" on services for insert to anon, authenticated with check (true);
create policy "public_read_announcements" on announcements for select to anon, authenticated using (true);
create policy "public_read_entities" on entities for select to anon, authenticated using (true);
create policy "public_read_products" on products for select to anon, authenticated using (true);
create policy "public_insert_products" on products for insert to anon, authenticated with check (true);
create policy "public_read_orders" on orders for all to anon, authenticated using (true) with check (true);
create policy "public_read_sos" on sos_alerts for all to anon, authenticated using (true) with check (true);
create policy "public_read_reviews" on reviews for select to anon, authenticated using (true);
create policy "public_insert_reviews" on reviews for insert to anon, authenticated with check (true);
create policy "public_read_vehicles" on vehicles for all to anon, authenticated using (true) with check (true);
create policy "public_read_appointments" on appointments for all to anon, authenticated using (true) with check (true);
create policy "public_read_donors" on blood_donors for all to anon, authenticated using (true) with check (true);
create policy "public_read_classes" on classes for all to anon, authenticated using (true) with check (true);
create policy "public_read_memory" on memory_stories for all to anon, authenticated using (true) with check (true);
create policy "public_read_players" on sports_players for all to anon, authenticated using (true) with check (true);
create policy "public_read_communities" on communities for all to anon, authenticated using (true) with check (true);
create policy "public_read_threads" on chat_threads for all to anon, authenticated using (true) with check (true);
create policy "public_read_messages" on chat_messages for all to anon, authenticated using (true) with check (true);
create policy "public_read_admin" on admin_users for select to anon, authenticated using (true);
create policy "public_read_audit" on audit_log for all to anon, authenticated using (true) with check (true);

-- ═══════════ دوال التحقق ═══════════
create or replace function verify_login(un text, pw text)
returns table(id uuid, username text, display_name text, entity_type text, logo_url text)
language plpgsql security definer set search_path = public as $$
begin
  return query
  select e.id, e.username, e.display_name, e.entity_type, e.logo_url
  from entities e
  where e.username = un and e.password_hash = pw and e.is_active = true
  limit 1;
end;
$$;

create or replace function verify_admin(un text, pw text)
returns table(id uuid, username text, full_name text, role text)
language plpgsql security definer set search_path = public as $$
begin
  return query
  select a.id, a.username, a.full_name, a.role
  from admin_users a
  where a.username = un and a.password_hash = pw and a.is_active = true
  limit 1;
end;
$$;

-- ═══════════ Storage Bucket ═══════════
insert into storage.buckets (id, name, public)
values ('sanad-files', 'sanad-files', true)
on conflict (id) do nothing;

-- ═══════════ البيانات الأولية ═══════════

-- المدير العام
insert into admin_users (username, password_hash, full_name, role)
values ('abode', 'Sanad@Admin2017', 'محمد أحمد حاج علي', 'owner')
on conflict (username) do nothing;

-- الأقسام الـ 19
insert into service_categories (name, slug, icon, sort_order, is_active) values
('المتاجر', 'shops', '🛍️', 1, true),
('الصحة والعيادات', 'health', '❤️', 2, true),
('المساجد', 'mosque', '🕌', 3, true),
('التعليم', 'education', '🎓', 4, true),
('المطاعم', 'food', '🍽️', 5, true),
('الحرف والخدمات', 'crafts', '🛠️', 6, true),
('النقل والتوصيل', 'transport', '🚚', 7, true),
('الجمعيات الخيرية', 'charity', '🎁', 8, true),
('الخدمات العامة', 'public', '🏢', 9, true),
('الرياضة', 'sports', '⚽', 10, true),
('المواصلات', 'transport2', '🚗', 11, true),
('ذاكرة كنصفرة', 'memory', '📸', 12, true),
('المكتبة', 'library', '📚', 13, true),
('السياحة', 'tourism', '🏛️', 14, true),
('التوظيف', 'jobs', '💼', 15, true),
('العقارات', 'realestate', '🏠', 16, true),
('المفقودات', 'lostfound', '🔍', 17, true),
('كبار السن', 'elderly', '👴', 18, true),
('المغتربون', 'expat', '🌍', 19, true),
('المزادات', 'auctions', '🏆', 20, true)
on conflict (slug) do nothing;

-- البلدة الأولى
insert into communities (name, slug, country, governorate, district, lat, lng, is_active)
values ('كنصفرة', 'kansafra', 'سوريا', 'إدلب', 'حارم', 36.1833, 36.5500, true)
on conflict (slug) do nothing;

-- الحسابات المؤسسية (كلمة المرور: sanad123)
insert into entities (username, password_hash, display_name, entity_type, phone, is_active) values
('merchant1', 'sanad123', 'متجر أبو أحمد', 'merchant', '0940000007', true),
('restaurant1', 'sanad123', 'مطعم الشام', 'restaurant', '0940000008', true),
('doctor1', 'sanad123', 'عيادة الأسنان الحديثة', 'doctor', '0940000002', true),
('pharmacy1', 'sanad123', 'صيدلية الرحمة', 'pharmacy', '0940000011', true),
('school1', 'sanad123', 'مدرسة كنصفرة الريفية', 'school', '0940000001', true),
('mosque1', 'sanad123', 'جامع كنصفرة الكبير', 'mosque', '0940000012', true),
('council1', 'sanad123', 'مجلس بلدة كنصفرة', 'council', '0940000013', true),
('sports1', 'sanad123', 'نادي كنصفرة الرياضي', 'sports', '0940000020', true),
('memory1', 'sanad123', 'ذاكرة كنصفرة الرقمية', 'memory', '0940000021', true),
('office1', 'sanad123', 'مكتب خدمات كنصفرة', 'office', '0940000022', true),
('driver1', 'sanad123', 'أبو محمد — تاكسي', 'transport', '0940000030', true)
on conflict (username) do nothing;

-- خدمات تجريبية
insert into services (title, description, provider_name, phone, is_featured, status) values
('مدرسة كنصفرة الريفية', 'تعليم أساسي وإعدادي لجميع المراحل، كادر مؤهل وبيئة تعليمية آمنة.', 'مدرسة كنصفرة الريفية', '0940000001', true, 'active'),
('عيادة الأسنان الحديثة', 'طبيب مختص في جراحة الأسنان والتجميل، تعقيم كامل وأجهزة حديثة.', 'عيادة الأسنان الحديثة', '0940000002', true, 'active'),
('جلاية بلاط', 'جلاء وتلميع كافة أنواع البلاط والحجر بأحدث المعدات.', 'أبو خالد', '0940000003', false, 'active'),
('لياسة وعمار', 'زريقة ولياسة داخلية وخارجية، تشطيب عالي الجودة.', 'ورشة النور', '0940000004', false, 'active'),
('نجار باطون', 'صبّة بلاطة، هوردين، قواعد، عواميد، دكة جدران.', 'نجار باطون كنصفرة', '0940000005', false, 'active'),
('سنكري وكهربجي', 'تمديد ماء وكهرباء وصرف صحي، صيانة وإصلاح.', 'أبو أحمد', '0940000006', false, 'active'),
('متجر أبو أحمد', 'بقالة وأغذية ومستلزمات منزلية، أسعار منافسة.', 'متجر أبو أحمد', '0940000007', false, 'active'),
('مطعم الشام', 'مأكولات شامية أصيلة، فروج مشوي وفلافل.', 'مطعم الشام', '0940000008', false, 'active'),
('شركة سند للنقل', 'توصيل داخلي وخارجي، شحن آمن وسريع.', 'نادي كنصفرة الرياضي', '0940000009', false, 'active');

-- إعلانات تجريبية
insert into announcements (title, body, is_published) values
('قيد التطوير — نراكم قريباً', 'هدفنا وضع كافة الخدمات المتاحة ضمن البلد بين يديكم.', true),
('افتتاح عيادة الأسنان', 'يسرنا الإعلان عن افتتاح عيادة الأسنان الحديثة في حي المركز.', true);

-- ═══════════ نهاية المخطط ═══════════
