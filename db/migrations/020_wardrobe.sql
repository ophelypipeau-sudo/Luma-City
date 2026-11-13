-- Purchased garments live on the server: the balance can no longer be edited in a browser.
CREATE TABLE IF NOT EXISTS wardrobe_items (
  character_id TEXT NOT NULL REFERENCES characters(id),
  item_key TEXT NOT NULL,
  piece_id TEXT NOT NULL,
  color TEXT,
  detail_color TEXT,
  purchased_at BIGINT NOT NULL,
  price INTEGER NOT NULL DEFAULT 0 CHECK (price >= 0),
  paid_by TEXT REFERENCES accounts(id),
  PRIMARY KEY (character_id, item_key)
);
CREATE INDEX IF NOT EXISTS wardrobe_items_paid_by ON wardrobe_items(paid_by);
ALTER TABLE characters ADD COLUMN IF NOT EXISTS wardrobe_imported BOOLEAN NOT NULL DEFAULT FALSE;
