CREATE TABLE puzzle_rounds (
  id UUID PRIMARY KEY,
  character_id TEXT NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
  sequence BIGINT GENERATED ALWAYS AS IDENTITY,
  config JSONB NOT NULL,
  tokens UUID[] NOT NULL,
  placed INTEGER[] NOT NULL DEFAULT '{}',
  reward SMALLINT NOT NULL DEFAULT 0 CHECK (reward BETWEEN 0 AND 3),
  closed_at TIMESTAMPTZ,
  CHECK (reward = 0 OR cardinality(placed) = cardinality(tokens))
);

CREATE INDEX puzzle_rounds_by_player ON puzzle_rounds(character_id, sequence DESC);
CREATE UNIQUE INDEX puzzle_open_round_by_player ON puzzle_rounds(character_id) WHERE closed_at IS NULL;
CREATE INDEX puzzle_rewards_by_player ON puzzle_rounds(character_id) WHERE reward > 0;
