CREATE TABLE homes (
  id UUID PRIMARY KEY,
  owner_character_id TEXT NOT NULL UNIQUE REFERENCES characters(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  starter_granted BOOLEAN NOT NULL DEFAULT FALSE
);
CREATE TABLE home_rooms (
  id UUID PRIMARY KEY,
  home_id UUID NOT NULL REFERENCES homes(id) ON DELETE CASCADE,
  kind TEXT NOT NULL DEFAULT 'living-room',
  width INTEGER NOT NULL DEFAULT 1000 CHECK (width > 0),
  height INTEGER NOT NULL DEFAULT 680 CHECK (height > 0),
  wall TEXT NOT NULL DEFAULT 'ivory' CHECK (wall IN ('ivory','rose','lilac','sage')),
  floor TEXT NOT NULL DEFAULT 'oak' CHECK (floor IN ('oak','honey','smoked')),
  revision INTEGER NOT NULL DEFAULT 0 CHECK (revision >= 0),
  UNIQUE (home_id, kind)
);
CREATE TABLE furniture_items (
  id UUID PRIMARY KEY,
  owner_character_id TEXT NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
  model_id TEXT NOT NULL,
  acquired_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX furniture_items_owner ON furniture_items(owner_character_id);
CREATE TABLE furniture_placements (
  item_id UUID PRIMARY KEY REFERENCES furniture_items(id) ON DELETE CASCADE,
  room_id UUID NOT NULL REFERENCES home_rooms(id) ON DELETE CASCADE,
  x DOUBLE PRECISION NOT NULL CHECK (x >= 0 AND x <= 1000),
  y DOUBLE PRECISION NOT NULL CHECK (y >= 0 AND y <= 680),
  depth INTEGER NOT NULL DEFAULT 0 CHECK (depth BETWEEN -80 AND 80)
);
CREATE INDEX furniture_placements_room ON furniture_placements(room_id);
CREATE TABLE home_save_operations (
  room_id UUID NOT NULL REFERENCES home_rooms(id) ON DELETE CASCADE,
  operation_id UUID NOT NULL,
  payload TEXT NOT NULL,
  revision INTEGER NOT NULL,
  PRIMARY KEY (room_id, operation_id)
);
