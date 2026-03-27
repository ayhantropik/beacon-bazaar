-- Beacon Bazaar - Supabase Veritabanı Kurulumu
-- Bu SQL'i Supabase Dashboard > SQL Editor'de çalıştırın

-- ENUM Types
DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('customer', 'store_owner', 'admin');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE order_status AS ENUM ('pending', 'confirmed', 'preparing', 'shipped', 'delivered', 'cancelled', 'refunded');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE payment_method AS ENUM ('credit_card', 'debit_card', 'bank_transfer', 'cash_on_delivery');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE payment_status AS ENUM ('pending', 'paid', 'failed', 'refunded');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE beacon_status AS ENUM ('active', 'inactive', 'maintenance');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE appointment_status AS ENUM ('pending', 'confirmed', 'cancelled', 'completed', 'no_show');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- PostGIS Extension (Supabase'de varsayılan olarak mevcut)
CREATE EXTENSION IF NOT EXISTS postgis;

-- Users
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR NOT NULL UNIQUE,
  password VARCHAR NOT NULL,
  name VARCHAR NOT NULL,
  surname VARCHAR NOT NULL,
  phone VARCHAR,
  avatar VARCHAR,
  role user_role NOT NULL DEFAULT 'customer',
  preferences JSONB NOT NULL DEFAULT '{}',
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMP NOT NULL DEFAULT now()
);

-- Stores
CREATE TABLE IF NOT EXISTS stores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "ownerId" UUID,
  name VARCHAR NOT NULL,
  slug VARCHAR NOT NULL UNIQUE,
  description TEXT,
  logo VARCHAR,
  "coverImage" VARCHAR,
  images JSONB NOT NULL DEFAULT '[]',
  location GEOGRAPHY(Point, 4326),
  latitude FLOAT,
  longitude FLOAT,
  address JSONB NOT NULL DEFAULT '{}',
  "contactInfo" JSONB NOT NULL DEFAULT '{}',
  categories JSONB NOT NULL DEFAULT '[]',
  tags JSONB NOT NULL DEFAULT '[]',
  "openingHours" JSONB NOT NULL DEFAULT '[]',
  "beaconId" VARCHAR,
  "ratingAverage" FLOAT NOT NULL DEFAULT 0,
  "ratingCount" INTEGER NOT NULL DEFAULT 0,
  "isVerified" BOOLEAN NOT NULL DEFAULT false,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "followersCount" INTEGER NOT NULL DEFAULT 0,
  "productsCount" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
  CONSTRAINT fk_store_owner FOREIGN KEY ("ownerId") REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_stores_location ON stores USING GIST (location);

-- Products
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "storeId" UUID,
  name VARCHAR NOT NULL,
  slug VARCHAR NOT NULL UNIQUE,
  description TEXT,
  "shortDescription" VARCHAR,
  price DECIMAL(10,2) NOT NULL,
  "salePrice" DECIMAL(10,2),
  currency VARCHAR NOT NULL DEFAULT 'TRY',
  categories JSONB,
  tags JSONB,
  images JSONB,
  thumbnail VARCHAR,
  attributes JSONB NOT NULL DEFAULT '{}',
  variations JSONB NOT NULL DEFAULT '[]',
  "stockQuantity" INTEGER NOT NULL DEFAULT 0,
  "lowStockThreshold" INTEGER NOT NULL DEFAULT 5,
  "trackInventory" BOOLEAN NOT NULL DEFAULT true,
  "ratingAverage" FLOAT NOT NULL DEFAULT 0,
  "ratingCount" INTEGER NOT NULL DEFAULT 0,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "isFeatured" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
  CONSTRAINT fk_product_store FOREIGN KEY ("storeId") REFERENCES stores(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_products_store ON products ("storeId");
CREATE INDEX IF NOT EXISTS idx_products_name ON products (name);

-- Orders
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId" UUID,
  items JSONB NOT NULL,
  "shippingAddress" JSONB,
  "billingAddress" JSONB,
  "paymentMethod" payment_method,
  "paymentStatus" payment_status NOT NULL DEFAULT 'pending',
  status order_status NOT NULL DEFAULT 'pending',
  subtotal DECIMAL(10,2) NOT NULL,
  discount DECIMAL(10,2) NOT NULL DEFAULT 0,
  "deliveryFee" DECIMAL(10,2) NOT NULL DEFAULT 0,
  total DECIMAL(10,2) NOT NULL,
  "couponCode" VARCHAR,
  notes TEXT,
  "trackingNumber" VARCHAR,
  "estimatedDelivery" TIMESTAMP,
  "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
  CONSTRAINT fk_order_user FOREIGN KEY ("userId") REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_orders_user ON orders ("userId");
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders (status);

-- Beacons
CREATE TABLE IF NOT EXISTS beacons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  uuid VARCHAR NOT NULL,
  major INTEGER NOT NULL,
  minor INTEGER NOT NULL,
  "storeId" UUID,
  name VARCHAR NOT NULL,
  latitude FLOAT,
  longitude FLOAT,
  floor INTEGER,
  zone VARCHAR,
  "batteryLevel" INTEGER,
  "lastSeen" TIMESTAMP,
  status beacon_status NOT NULL DEFAULT 'active',
  settings JSONB NOT NULL DEFAULT '{"txPower": -59, "advertisingInterval": 1000, "maxRange": 10}',
  "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
  CONSTRAINT fk_beacon_store FOREIGN KEY ("storeId") REFERENCES stores(id) ON DELETE CASCADE
);

-- Appointments
CREATE TABLE IF NOT EXISTS appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId" UUID,
  "storeId" UUID,
  "serviceId" UUID,
  "productId" UUID,
  date DATE NOT NULL,
  "startTime" VARCHAR NOT NULL,
  "endTime" VARCHAR NOT NULL,
  duration INTEGER NOT NULL DEFAULT 30,
  status appointment_status NOT NULL DEFAULT 'pending',
  notes TEXT,
  "meetingLink" VARCHAR,
  "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
  CONSTRAINT fk_appointment_user FOREIGN KEY ("userId") REFERENCES users(id) ON DELETE SET NULL,
  CONSTRAINT fk_appointment_store FOREIGN KEY ("storeId") REFERENCES stores(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_appointments_user ON appointments ("userId");
CREATE INDEX IF NOT EXISTS idx_appointments_store ON appointments ("storeId");

-- Updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW."updatedAt" = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Auto-update triggers
DO $$ BEGIN
  CREATE TRIGGER trg_users_updated BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TRIGGER trg_stores_updated BEFORE UPDATE ON stores FOR EACH ROW EXECUTE FUNCTION update_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TRIGGER trg_products_updated BEFORE UPDATE ON products FOR EACH ROW EXECUTE FUNCTION update_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TRIGGER trg_orders_updated BEFORE UPDATE ON orders FOR EACH ROW EXECUTE FUNCTION update_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TRIGGER trg_beacons_updated BEFORE UPDATE ON beacons FOR EACH ROW EXECUTE FUNCTION update_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TRIGGER trg_appointments_updated BEFORE UPDATE ON appointments FOR EACH ROW EXECUTE FUNCTION update_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- RLS (Row Level Security) - Supabase önerisi
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE beacons ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;

-- Public read policies (backend service role ile bypass edilir)
DO $$ BEGIN
  CREATE POLICY "Public read stores" ON stores FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  CREATE POLICY "Public read products" ON products FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  CREATE POLICY "Service role full access users" ON users USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  CREATE POLICY "Service role full access stores" ON stores USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  CREATE POLICY "Service role full access products" ON products USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  CREATE POLICY "Service role full access orders" ON orders USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  CREATE POLICY "Service role full access beacons" ON beacons USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  CREATE POLICY "Service role full access appointments" ON appointments USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Başarılı mesajı
DO $$ BEGIN
  RAISE NOTICE 'Beacon Bazaar veritabanı başarıyla oluşturuldu!';
END $$;
