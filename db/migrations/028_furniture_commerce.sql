-- No public offer or price is seeded. Preview offers are configured in isolated review databases.
CREATE TABLE furniture_offers (
  model_id TEXT PRIMARY KEY,
  version UUID NOT NULL,
  price INTEGER NOT NULL CHECK (price > 0),
  approved BOOLEAN NOT NULL DEFAULT FALSE,
  enabled BOOLEAN NOT NULL DEFAULT FALSE
);
CREATE TABLE furniture_purchases (
  paid_by TEXT NOT NULL REFERENCES accounts(id),
  operation_id UUID NOT NULL,
  character_id TEXT NOT NULL REFERENCES characters(id),
  model_id TEXT NOT NULL,
  offer_version UUID NOT NULL,
  price INTEGER NOT NULL CHECK (price > 0),
  item_id UUID NOT NULL UNIQUE REFERENCES furniture_items(id),
  purchased_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (paid_by, operation_id)
);
