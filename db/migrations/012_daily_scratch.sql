CREATE TABLE IF NOT EXISTS daily_scratch_tickets (
  id UUID PRIMARY KEY,
  account_id TEXT NOT NULL REFERENCES accounts(id),
  character_id TEXT NOT NULL REFERENCES characters(id),
  play_day DATE NOT NULL,
  amount INTEGER NOT NULL CHECK (amount > 0),
  collected_at TIMESTAMPTZ,
  UNIQUE (account_id, play_day)
);
CREATE INDEX IF NOT EXISTS daily_scratch_by_player ON daily_scratch_tickets(character_id);
