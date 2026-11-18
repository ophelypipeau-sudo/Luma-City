CREATE TABLE IF NOT EXISTS companions (
  id UUID PRIMARY KEY,
  character_id TEXT NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
  model_id TEXT NOT NULL,
  name TEXT NOT NULL CHECK (char_length(name) BETWEEN 2 AND 20),
  price INTEGER NOT NULL CHECK (price >= 0),
  paid_by TEXT NOT NULL REFERENCES accounts(id),
  purchased_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  equipped BOOLEAN NOT NULL DEFAULT FALSE,
  UNIQUE (character_id, model_id)
);
CREATE INDEX IF NOT EXISTS companions_paid_by ON companions(paid_by);
CREATE UNIQUE INDEX IF NOT EXISTS companions_one_equipped ON companions(character_id) WHERE equipped;
