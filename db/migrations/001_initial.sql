CREATE TABLE IF NOT EXISTS accounts (id TEXT PRIMARY KEY, label TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS characters (
 id TEXT PRIMARY KEY, account_id TEXT NOT NULL REFERENCES accounts(id),
 slot INTEGER NOT NULL CHECK (slot IN (1,2)), name TEXT NOT NULL,
 color TEXT NOT NULL, hair TEXT NOT NULL, UNIQUE(account_id,slot)
);
CREATE TABLE IF NOT EXISTS play_sessions (
 account_id TEXT PRIMARY KEY REFERENCES accounts(id), character_id TEXT REFERENCES characters(id),
 generation INTEGER NOT NULL DEFAULT 0, owner_token TEXT
);
CREATE TABLE IF NOT EXISTS messages (
 id BIGSERIAL PRIMARY KEY, sender TEXT NOT NULL REFERENCES characters(id),
 recipient TEXT NOT NULL REFERENCES characters(id), body TEXT NOT NULL,
 command_id TEXT NOT NULL, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
 UNIQUE(sender,command_id)
);
CREATE INDEX IF NOT EXISTS messages_recipient ON messages(recipient,id);
CREATE TABLE IF NOT EXISTS read_states (
 reader TEXT NOT NULL REFERENCES characters(id), peer TEXT NOT NULL REFERENCES characters(id),
 last_id BIGINT NOT NULL DEFAULT 0, PRIMARY KEY(reader,peer)
);
CREATE TABLE IF NOT EXISTS blocks (
 actor TEXT NOT NULL REFERENCES characters(id), target TEXT NOT NULL REFERENCES characters(id),
 PRIMARY KEY(actor,target), CHECK(actor <> target)
);
CREATE TABLE IF NOT EXISTS reports (
 id BIGSERIAL PRIMARY KEY, actor TEXT NOT NULL REFERENCES characters(id),
 target TEXT NOT NULL REFERENCES characters(id), reason TEXT NOT NULL,
 created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
