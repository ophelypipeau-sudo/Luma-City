CREATE TABLE IF NOT EXISTS reward_wheel_drops (
  id UUID PRIMARY KEY,
  spin_id UUID NOT NULL REFERENCES reward_wheel_spins(id),
  slot INTEGER NOT NULL CHECK (slot BETWEEN 0 AND 19),
  amount INTEGER NOT NULL CHECK (amount > 0),
  collected_at TIMESTAMPTZ,
  UNIQUE (spin_id, slot)
);
