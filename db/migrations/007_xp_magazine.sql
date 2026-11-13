CREATE TABLE IF NOT EXISTS xp_rewards (
  id BIGSERIAL PRIMARY KEY,
  recipient TEXT NOT NULL REFERENCES characters(id),
  source TEXT NOT NULL CHECK (source IN ('like', 'photo', 'look-like')),
  points INTEGER NOT NULL CHECK (points > 0),
  claimed_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS pending_xp_rewards ON xp_rewards(recipient) WHERE claimed_at IS NULL;
CREATE TABLE IF NOT EXISTS profile_look_likes (
  actor TEXT NOT NULL REFERENCES characters(id),
  target TEXT NOT NULL REFERENCES characters(id),
  look_key TEXT NOT NULL,
  PRIMARY KEY (actor, target, look_key),
  CHECK (actor <> target)
);
