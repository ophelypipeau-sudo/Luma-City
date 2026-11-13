CREATE TABLE IF NOT EXISTS xp_pickup_claims (
  id UUID NOT NULL,
  recipient TEXT NOT NULL REFERENCES characters(id),
  PRIMARY KEY (recipient, id)
);
