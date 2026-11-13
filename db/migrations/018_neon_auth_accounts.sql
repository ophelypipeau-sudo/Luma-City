CREATE TABLE IF NOT EXISTS neon_player_accounts (
  auth_user_id TEXT PRIMARY KEY,
  account_id TEXT NOT NULL UNIQUE REFERENCES accounts(id),
  name_key TEXT NOT NULL UNIQUE,
  privacy_acknowledged_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
