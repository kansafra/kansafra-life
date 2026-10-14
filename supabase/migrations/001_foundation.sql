-- ============================================================
-- سند (Sanad) - Migration 001: Foundation & Commerce
-- التأسيس + التجارة
-- ============================================================

-- ==================== الجزء 1: الجغرافيا ====================

CREATE TABLE IF NOT EXISTS countries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  name_ar TEXT NOT NULL,
  name_en TEXT NOT NULL,
  currency TEXT DEFAULT 'SYP',
  phone_code TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS governorates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  country_id UUID REFERENCES countries(id) ON DELETE CASCADE,
  name_ar TEXT NOT NULL,
  name_en TEXT,
  code TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS regions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  governorate_id UUID REFERENCES governorates(id) ON DELETE CASCADE,
  name_ar TEXT NOT NULL,
  name_en TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS towns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  region_id UUID REFERENCES regions(id) ON DELETE CASCADE,
  name_ar TEXT NOT NULL,
  name_en TEXT,
  location_lat NUMERIC,
  location_lng NUMERIC,
  boundaries JSONB,
  population INT DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS neighborhoods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  town_id UUID REFERENCES towns(id) ON DELETE CASCADE,
  name_ar TEXT NOT NULL,
  location_lat NUMERIC,
  location_lng NUMERIC,
  boundaries JSONB,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ==================== الجزء 2: الكيانات والأدوار ====================

CREATE TABLE IF NOT EXISTS entity_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  name_ar TEXT NOT NULL,
  name_en TEXT,
  icon TEXT,
  category TEXT,
  modules JSONB DEFAULT '[]'::jsonb,
  sort_order INT DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS platform_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone TEXT UNIQUE,
  email TEXT UNIQUE,
  username TEXT UNIQUE,
  display_name TEXT NOT NULL,
  role TEXT DEFAULT 'user',
  password_hash TEXT,
  two_factor_enabled BOOLEAN DEFAULT false,
  two_factor_secret TEXT,
  is_active BOOLEAN DEFAULT true,
  is_deleted BOOLEAN DEFAULT false,
  last_login TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS entities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_user_id UUID REFERENCES platform_users(id),
  entity_type_id UUID REFERENCES entity_types(id),
  display_name TEXT UNIQUE NOT NULL,
  name_ar TEXT NOT NULL,
  name_en TEXT,
  description TEXT,
  logo_url TEXT,
  cover_url TEXT,
  primary_color TEXT DEFAULT '#0f5132',
  secondary_color TEXT DEFAULT '#d4a017',
  phone TEXT,
  phone2 TEXT,
  whatsapp TEXT,
  email TEXT,
  website TEXT,
  country_id UUID REFERENCES countries(id),
  governorate_id UUID REFERENCES governorates(id),
  region_id UUID REFERENCES regions(id),
  town_id UUID REFERENCES towns(id),
  neighborhood_id UUID REFERENCES neighborhoods(id),
  address TEXT,
  location_lat NUMERIC,
  location_lng NUMERIC,
  working_hours JSONB,
  social_links JSONB,
  subscription_plan TEXT DEFAULT 'free',
  subscription_expires TIMESTAMPTZ,
  is_verified BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  is_deleted BOOLEAN DEFAULT false,
  settings JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  scope TEXT,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  resource TEXT,
  action TEXT,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS role_permissions (
  role_id UUID REFERENCES roles(id) ON DELETE CASCADE,
  permission_id UUID REFERENCES permissions(id) ON DELETE CASCADE,
  PRIMARY KEY (role_id, permission_id)
);

CREATE TABLE IF NOT EXISTS entity_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_id UUID REFERENCES entities(id) ON DELETE CASCADE,
  user_id UUID REFERENCES platform_users(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'staff',
  permissions JSONB DEFAULT '[]'::jsonb,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(entity_id, user_id)
);

-- ==================== الجزء 3: الأمان والاشتراكات ====================

CREATE TABLE IF NOT EXISTS sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES platform_users(id) ON DELETE CASCADE,
  token TEXT UNIQUE NOT NULL,
  ip_address TEXT,
  user_agent TEXT,
  device_fingerprint TEXT,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  entity_id UUID,
  action TEXT NOT NULL,
  resource TEXT,
  resource_id TEXT,
  old_value JSONB,
  new_value JSONB,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_id UUID REFERENCES entities(id) ON DELETE CASCADE,
  email TEXT,
  phone TEXT,
  token TEXT UNIQUE NOT NULL,
  role TEXT DEFAULT 'admin',
  expires_at TIMESTAMPTZ,
  used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS subscription_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  display_name_ar TEXT,
  price_monthly NUMERIC DEFAULT 0,
  price_yearly NUMERIC DEFAULT 0,
  currency TEXT DEFAULT 'USD',
  features JSONB,
  max_products INT DEFAULT 10,
  max_users INT DEFAULT 1,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_id UUID REFERENCES entities(id) ON DELETE CASCADE,
  plan_id UUID REFERENCES subscription_plans(id),
  status TEXT DEFAULT 'active',
  starts_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ,
  auto_renew BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ==================== الجزء 4: المنتجات والمخزون ====================

CREATE TABLE IF NOT EXISTS product_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_id UUID REFERENCES entities(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  parent_id UUID,
  icon TEXT,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_id UUID REFERENCES entities(id) ON DELETE CASCADE,
  category_id UUID REFERENCES product_categories(id),
  name TEXT NOT NULL,
  description TEXT,
  sku TEXT,
  barcode TEXT,
  unit TEXT DEFAULT 'piece',
  price NUMERIC DEFAULT 0,
  cost_price NUMERIC DEFAULT 0,
  discount_price NUMERIC,
  stock INT DEFAULT 0,
  min_stock INT DEFAULT 0,
  images JSONB DEFAULT '[]'::jsonb,
  tags TEXT[],
  expiry_date DATE,
  is_active BOOLEAN DEFAULT true,
  is_deleted BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS warehouses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_id UUID REFERENCES entities(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  address TEXT,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS inventory_movements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  warehouse_id UUID REFERENCES warehouses(id),
  movement_type TEXT NOT NULL,
  quantity NUMERIC NOT NULL,
  unit_price NUMERIC,
  reference TEXT,
  notes TEXT,
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS suppliers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_id UUID REFERENCES entities(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  address TEXT,
  notes TEXT,
  balance NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ==================== الجزء 5: العملاء والطلبات ====================

CREATE TABLE IF NOT EXISTS customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_id UUID REFERENCES entities(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  address TEXT,
  location_lat NUMERIC,
  location_lng NUMERIC,
  notes TEXT,
  total_spent NUMERIC DEFAULT 0,
  loyalty_points INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_id UUID REFERENCES entities(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES customers(id),
  order_number TEXT UNIQUE,
  status TEXT DEFAULT 'new',
  customer_name TEXT,
  customer_phone TEXT,
  customer_address TEXT,
  subtotal NUMERIC DEFAULT 0,
  discount NUMERIC DEFAULT 0,
  tax NUMERIC DEFAULT 0,
  delivery_fee NUMERIC DEFAULT 0,
  total NUMERIC DEFAULT 0,
  payment_method TEXT,
  payment_status TEXT DEFAULT 'unpaid',
  delivery_type TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id),
  product_name TEXT,
  quantity NUMERIC NOT NULL,
  unit_price NUMERIC NOT NULL,
  discount NUMERIC DEFAULT 0,
  total NUMERIC NOT NULL,
  notes TEXT
);

CREATE TABLE IF NOT EXISTS order_status_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  status TEXT NOT NULL,
  notes TEXT,
  changed_by UUID,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ==================== الجزء 6: الفواتير والديون ====================

CREATE TABLE IF NOT EXISTS invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_id UUID REFERENCES entities(id) ON DELETE CASCADE,
  invoice_number TEXT NOT NULL,
  customer_id UUID REFERENCES customers(id),
  customer_name TEXT,
  customer_phone TEXT,
  items JSONB NOT NULL DEFAULT '[]'::jsonb,
  subtotal NUMERIC DEFAULT 0,
  discount NUMERIC DEFAULT 0,
  tax NUMERIC DEFAULT 0,
  total NUMERIC DEFAULT 0,
  currency TEXT DEFAULT 'SYP',
  status TEXT DEFAULT 'unpaid',
  template JSONB,
  qr_code TEXT,
  barcode TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS debts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_id UUID REFERENCES entities(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES customers(id),
  customer_name TEXT,
  customer_phone TEXT,
  amount NUMERIC NOT NULL,
  paid_amount NUMERIC DEFAULT 0,
  remaining NUMERIC NOT NULL,
  debt_type TEXT DEFAULT 'owed',
  invoice_image_url TEXT,
  electronic_signature TEXT,
  due_date DATE,
  reference_number TEXT,
  notes TEXT,
  status TEXT DEFAULT 'open',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS installments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_id UUID REFERENCES entities(id) ON DELETE CASCADE,
  debt_id UUID REFERENCES debts(id) ON DELETE CASCADE,
  installment_number INT NOT NULL,
  amount NUMERIC NOT NULL,
  due_date DATE NOT NULL,
  paid_at TIMESTAMPTZ,
  status TEXT DEFAULT 'pending',
  penalty NUMERIC DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS payment_methods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_id UUID REFERENCES entities(id) ON DELETE CASCADE,
  method_type TEXT NOT NULL,
  name TEXT NOT NULL,
  details JSONB,
  is_active BOOLEAN DEFAULT true,
  verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_id UUID REFERENCES entities(id),
  invoice_id UUID REFERENCES invoices(id),
  order_id UUID REFERENCES orders(id),
  debt_id UUID REFERENCES debts(id),
  amount NUMERIC NOT NULL,
  currency TEXT DEFAULT 'SYP',
  method TEXT,
  reference TEXT,
  status TEXT DEFAULT 'pending',
  confirmed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS exchange_rates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_id UUID,
  currency_from TEXT NOT NULL,
  currency_to TEXT NOT NULL,
  rate NUMERIC NOT NULL,
  source TEXT,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ==================== الفهارس ====================

CREATE INDEX IF NOT EXISTS idx_gov_country ON governorates(country_id);
CREATE INDEX IF NOT EXISTS idx_regions_gov ON regions(governorate_id);
CREATE INDEX IF NOT EXISTS idx_towns_region ON towns(region_id);
CREATE INDEX IF NOT EXISTS idx_neighborhoods_town ON neighborhoods(town_id);
CREATE INDEX IF NOT EXISTS idx_entities_type ON entities(entity_type_id);
CREATE INDEX IF NOT EXISTS idx_entities_town ON entities(town_id);
CREATE INDEX IF NOT EXISTS idx_entities_active ON entities(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_entity_users_entity ON entity_users(entity_id);
CREATE INDEX IF NOT EXISTS idx_entity_users_user ON entity_users(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_user ON audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_entity ON audit_log(entity_id);
CREATE INDEX IF NOT EXISTS idx_products_entity ON products(entity_id);
CREATE INDEX IF NOT EXISTS idx_products_barcode ON products(barcode);
CREATE INDEX IF NOT EXISTS idx_products_active ON products(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_orders_entity ON orders(entity_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_customer ON orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_invoices_entity ON invoices(entity_id);
CREATE INDEX IF NOT EXISTS idx_invoices_customer ON invoices(customer_id);
CREATE INDEX IF NOT EXISTS idx_debts_entity ON debts(entity_id);
CREATE INDEX IF NOT EXISTS idx_debts_status ON debts(status);
CREATE INDEX IF NOT EXISTS idx_installments_debt ON installments(debt_id);
CREATE INDEX IF NOT EXISTS idx_customers_entity ON customers(entity_id);
CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers(phone);

-- ==================== نهاية الملف ====================
