-- Separate from furniture: existing finishes remain included, new finishes are unlocks.
ALTER TABLE home_rooms DROP CONSTRAINT home_rooms_wall_check;
ALTER TABLE home_rooms ADD CONSTRAINT home_rooms_wall_check CHECK (wall IN ('ivory','rose','lilac','sage','midnight','peach','wallpaper-blush','wallpaper-sage'));
ALTER TABLE home_rooms DROP CONSTRAINT home_rooms_floor_check;
ALTER TABLE home_rooms ADD CONSTRAINT home_rooms_floor_check CHECK (floor IN ('oak','honey','smoked','walnut','white-oak','rosewood'));
CREATE TABLE home_finish_items (
  character_id TEXT NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
  finish_id TEXT NOT NULL,
  acquired_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (character_id, finish_id)
);
CREATE TABLE home_finish_purchases (
  paid_by TEXT NOT NULL REFERENCES accounts(id),
  operation_id UUID NOT NULL,
  character_id TEXT NOT NULL REFERENCES characters(id),
  finish_id TEXT NOT NULL,
  offer_version TEXT NOT NULL,
  price INTEGER NOT NULL CHECK (price > 0),
  purchased_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (paid_by, operation_id),
  UNIQUE (character_id, finish_id)
);
