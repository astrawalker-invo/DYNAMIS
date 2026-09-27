-- Real home
INSERT INTO homes (id, name, address, tariff_rate) VALUES
  ('aaaaaaaa-0000-0000-0000-000000000001', 'Main Home', 'Delhi, India', 8.50);

-- Users (password for all: energy123 — bcrypt hash generated with bcrypt 10 rounds)
INSERT INTO users (name, email, password_hash, role, home_id) VALUES
  ('Admin User',  'admin@energy.com',  '$2b$10$eYGjjrcX1E48Mna273oZ2OgjkFlojtdO3DxypPDj4GwjZfv.NQ.JS',  'admin', 'aaaaaaaa-0000-0000-0000-000000000001'),
  ('Ravi Kumar',  'ravi@energy.com',   '$2b$10$eYGjjrcX1E48Mna273oZ2OgjkFlojtdO3DxypPDj4GwjZfv.NQ.JS',   'user',  'aaaaaaaa-0000-0000-0000-000000000001'),
  ('Priya Singh', 'priya@energy.com',  '$2b$10$eYGjjrcX1E48Mna273oZ2OgjkFlojtdO3DxypPDj4GwjZfv.NQ.JS',  'user',  'aaaaaaaa-0000-0000-0000-000000000001'),
  ('Demo Guest',  'demo@energy.com',   '$2b$10$eYGjjrcX1E48Mna273oZ2OgjkFlojtdO3DxypPDj4GwjZfv.NQ.JS',   'demo',  NULL);

-- Real devices (is_active true for switchable loads on by default; fridge always_on)
INSERT INTO devices (home_id, name, type, room, rated_watts, relay_channel, always_on, is_active) VALUES
  ('aaaaaaaa-0000-0000-0000-000000000001', 'Ceiling Fan',    'fan',    'bedroom', 75,  1, false, true),
  ('aaaaaaaa-0000-0000-0000-000000000001', 'LED Bulb',       'light',  'bedroom', 12,  2, false, true),
  ('aaaaaaaa-0000-0000-0000-000000000001', 'Ceiling Fan',    'fan',    'living',  75,  3, false, true),
  ('aaaaaaaa-0000-0000-0000-000000000001', 'LED Bulb',       'light',  'living',  12,  4, false, true),
  ('aaaaaaaa-0000-0000-0000-000000000001', 'Air Cooler',     'cooler', 'living',  200, 5, false, true),
  ('aaaaaaaa-0000-0000-0000-000000000001', 'LED Bulb',       'light',  'kitchen', 9,   6, false, true),
  ('aaaaaaaa-0000-0000-0000-000000000001', 'Refrigerator',   'fridge', 'kitchen', 150, NULL, true, true),
  ('aaaaaaaa-0000-0000-0000-000000000001', 'TV',             'tv',     'living',  120, 7, false, true),
  ('aaaaaaaa-0000-0000-0000-000000000001', 'Laptop Charger', 'laptop', 'bedroom', 65,  8, false, true);

-- Demo home (isolated)
INSERT INTO demo_homes (id, name, address, tariff_rate) VALUES
  ('bbbbbbbb-0000-0000-0000-000000000002', 'Demo Home', 'Demo City', 8.50);

INSERT INTO demo_devices (home_id, name, type, room, rated_watts, relay_channel, always_on, is_active) VALUES
  ('bbbbbbbb-0000-0000-0000-000000000002', 'Ceiling Fan',  'fan',    'bedroom', 75,  1, false, true),
  ('bbbbbbbb-0000-0000-0000-000000000002', 'LED Bulb',     'light',  'bedroom', 12,  2, false, true),
  ('bbbbbbbb-0000-0000-0000-000000000002', 'Air Cooler',   'cooler', 'living',  200, 3, false, true),
  ('bbbbbbbb-0000-0000-0000-000000000002', 'TV',           'tv',     'living',  120, 4, false, true),
  ('bbbbbbbb-0000-0000-0000-000000000002', 'Refrigerator', 'fridge', 'kitchen', 150, NULL, true, true);

-- Re-hash passwords after schema: node db/postgres/hashPasswords.js
