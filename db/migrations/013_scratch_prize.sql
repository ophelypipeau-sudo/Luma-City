ALTER TABLE daily_scratch_tickets ADD COLUMN IF NOT EXISTS currency TEXT NOT NULL DEFAULT 'coins' CHECK (currency IN ('coins','diamonds','xp'));
