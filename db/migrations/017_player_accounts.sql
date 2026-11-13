CREATE TABLE IF NOT EXISTS player_credentials (
  name_key TEXT PRIMARY KEY,
  account_id TEXT NOT NULL UNIQUE REFERENCES accounts(id),
  password_hash TEXT NOT NULL,
  privacy_acknowledged_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE characters ADD COLUMN IF NOT EXISTS starter_outfit JSONB;
