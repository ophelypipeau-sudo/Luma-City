-- Guestbook notes show when they were written. Older notes keep no date.
ALTER TABLE profile_guestbook ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ;
ALTER TABLE profile_guestbook ALTER COLUMN created_at SET DEFAULT NOW();
