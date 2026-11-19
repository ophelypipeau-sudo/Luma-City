ALTER TABLE homes ADD COLUMN access_mode TEXT NOT NULL DEFAULT 'public'
  CHECK (access_mode IN ('public','friends','private'));
ALTER TABLE homes ADD COLUMN access_revision INTEGER NOT NULL DEFAULT 0;
CREATE TABLE home_invitations (
  id UUID PRIMARY KEY,
  owner_id TEXT NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
  guest_id TEXT NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
  state TEXT NOT NULL DEFAULT 'pending' CHECK (state IN ('pending','accepted','declined','revoked')),
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (owner_id <> guest_id)
);
CREATE UNIQUE INDEX home_invitation_active ON home_invitations(owner_id,guest_id)
  WHERE state IN ('pending','accepted');
CREATE INDEX home_invitation_inbox ON home_invitations(guest_id,expires_at);
CREATE TABLE home_exclusions (
  owner_id TEXT NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
  guest_id TEXT NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (owner_id,guest_id), CHECK (owner_id <> guest_id)
);
