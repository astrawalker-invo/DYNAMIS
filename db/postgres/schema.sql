CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE homes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  address TEXT,
  tariff_rate NUMERIC(6,2) DEFAULT 8.50,
  motion_timeout_mins INT DEFAULT 5,
  nilm_threshold_watts INT DEFAULT 500,
  ldr_enabled BOOLEAN DEFAULT true,
  motion_enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT CHECK (role IN ('admin','user','demo')) DEFAULT 'user',
  home_id UUID REFERENCES homes(id),
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE devices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  home_id UUID REFERENCES homes(id),
  name TEXT NOT NULL,
  type TEXT,
  room TEXT NOT NULL,
  rated_watts INT NOT NULL,
  relay_channel INT,
  is_active BOOLEAN DEFAULT false,
  always_on BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  home_id UUID REFERENCES homes(id),
  type TEXT CHECK (type IN ('nilm','motion','voltage','system')),
  message TEXT NOT NULL,
  severity TEXT CHECK (severity IN ('info','warning','critical')) DEFAULT 'info',
  acknowledged BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE demo_homes (LIKE homes INCLUDING ALL);
CREATE TABLE demo_devices (LIKE devices INCLUDING ALL);
