ALTER TABLE characters ADD COLUMN IF NOT EXISTS xp INTEGER NOT NULL DEFAULT 0;
CREATE TABLE IF NOT EXISTS profile_photos (
  actor TEXT NOT NULL REFERENCES characters(id),
  target TEXT NOT NULL REFERENCES characters(id),
  PRIMARY KEY (actor, target),
  CHECK (actor <> target)
);
CREATE TABLE IF NOT EXISTS profile_guestbook (
  id BIGSERIAL PRIMARY KEY,
  actor TEXT NOT NULL REFERENCES characters(id),
  target TEXT NOT NULL REFERENCES characters(id),
  body TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS profile_garment_transfers (
  id UUID PRIMARY KEY,
  sender TEXT NOT NULL REFERENCES characters(id),
  recipient TEXT NOT NULL REFERENCES characters(id),
  item_key TEXT NOT NULL,
  purchased_at BIGINT NOT NULL,
  item JSONB NOT NULL,
  UNIQUE (sender, item_key, purchased_at),
  CHECK (sender <> recipient)
);
