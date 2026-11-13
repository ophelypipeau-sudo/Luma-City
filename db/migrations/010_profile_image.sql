ALTER TABLE characters ADD COLUMN IF NOT EXISTS profile_image_version TEXT;
ALTER TABLE characters ALTER COLUMN profile_template SET DEFAULT 'solid';
UPDATE characters SET profile_template='solid' WHERE profile_template='garden';
CREATE TABLE IF NOT EXISTS profile_images (
  character_id TEXT PRIMARY KEY REFERENCES characters(id) ON DELETE CASCADE,
  image BYTEA NOT NULL,
  mime TEXT NOT NULL
);
