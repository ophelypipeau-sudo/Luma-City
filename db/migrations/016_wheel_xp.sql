ALTER TABLE reward_wheel_spins DROP CONSTRAINT IF EXISTS reward_wheel_spins_currency_check;
ALTER TABLE reward_wheel_spins ADD CONSTRAINT reward_wheel_spins_currency_check CHECK (currency IN ('coins', 'diamonds', 'xp'));
