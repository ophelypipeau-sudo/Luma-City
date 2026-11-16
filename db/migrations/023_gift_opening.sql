-- Un cadeau reçu reste emballé jusqu'à ce que son destinataire l'ouvre.
-- On garde aussi la date d'envoi. Les cadeaux déjà offerts n'ont pas de date
-- et sont considérés comme déjà ouverts.
ALTER TABLE profile_garment_transfers ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ;
ALTER TABLE profile_garment_transfers ALTER COLUMN created_at SET DEFAULT NOW();
ALTER TABLE profile_garment_transfers ADD COLUMN IF NOT EXISTS opened_at TIMESTAMPTZ;
UPDATE profile_garment_transfers SET opened_at = NOW() WHERE opened_at IS NULL AND created_at IS NULL;
