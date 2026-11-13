CREATE TABLE IF NOT EXISTS profile_likes (
  actor TEXT NOT NULL REFERENCES characters(id),
  target TEXT NOT NULL REFERENCES characters(id),
  PRIMARY KEY (actor, target),
  CHECK (actor <> target)
);
CREATE TABLE IF NOT EXISTS profile_relations (
  first_id TEXT NOT NULL REFERENCES characters(id),
  second_id TEXT NOT NULL REFERENCES characters(id),
  kind TEXT NOT NULL CHECK (kind IN ('friend', 'best-friend', 'romance')),
  requester TEXT NOT NULL REFERENCES characters(id),
  accepted BOOLEAN NOT NULL DEFAULT FALSE,
  PRIMARY KEY (first_id, second_id, kind),
  CHECK (first_id <> second_id AND requester IN (first_id, second_id))
);
CREATE TABLE IF NOT EXISTS profile_gifts (
  id UUID PRIMARY KEY,
  sender TEXT NOT NULL REFERENCES characters(id),
  recipient TEXT NOT NULL REFERENCES characters(id),
  gift TEXT NOT NULL CHECK (gift IN ('flowers', 'star', 'heart')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (sender <> recipient)
);
