ALTER TABLE arcade_rounds
  DROP CONSTRAINT IF EXISTS arcade_rounds_game_check,
  ADD CONSTRAINT arcade_rounds_game_check CHECK (game IN ('petal','comet','prism','memory','mole'));
