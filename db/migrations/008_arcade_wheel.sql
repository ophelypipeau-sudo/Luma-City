CREATE TABLE IF NOT EXISTS arcade_rounds (
  id UUID PRIMARY KEY,
  character_id TEXT NOT NULL REFERENCES characters(id),
  game TEXT NOT NULL CHECK (game IN ('petal','comet','prism')),
  seed BIGINT NOT NULL,
  completed BOOLEAN NOT NULL DEFAULT FALSE
);
CREATE INDEX IF NOT EXISTS arcade_rounds_by_player ON arcade_rounds(character_id,game);
CREATE TABLE IF NOT EXISTS reward_wheel_spins (
  id UUID PRIMARY KEY,
  character_id TEXT NOT NULL REFERENCES characters(id),
  prize_index INTEGER NOT NULL,
  currency TEXT NOT NULL CHECK (currency IN ('coins','diamonds')),
  amount INTEGER NOT NULL CHECK (amount > 0),
  collected_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS reward_wheel_by_player ON reward_wheel_spins(character_id);
