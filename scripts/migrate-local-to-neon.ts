import { cp, mkdtemp, readdir, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { PGlite } from "@electric-sql/pglite";
import pg from "pg";

type Query = (sql: string, params?: string[]) => Promise<{ rows: any[] }>;
const quote = (name: string) => '"' + name.replaceAll('"', '""') + '"';
const qualified = (name: string) => `public.${quote(name)}`;
const listTables = `
  SELECT c.relname AS name, ARRAY(
    SELECT DISTINCT parent.relname::text
    FROM pg_constraint fk JOIN pg_class parent ON parent.oid = fk.confrelid
    WHERE fk.conrelid = c.oid AND fk.contype = 'f'
    ORDER BY 1
  ) AS parents
  FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE n.nspname = 'public' AND c.relkind = 'r' ORDER BY c.relname
`;
const listSequences = `SELECT sequencename AS name FROM pg_sequences
  WHERE schemaname = 'public' ORDER BY sequencename`;
const listColumns = `SELECT table_name, column_name, udt_name, is_nullable
  FROM information_schema.columns WHERE table_schema = 'public'
  ORDER BY table_name, column_name`;

async function transfer(source: Query, target: Query) {
  for (const file of (await readdir("db/migrations")).filter(f => f.endsWith(".sql")).sort()) {
    const migration = await readFile(join("db/migrations", file), "utf8");
    for (const statement of migration.split(";").filter(sql => sql.trim())) {
      await target(statement);
    }
  }
  for (const sql of [listTables, listColumns, listSequences]) {
    if (JSON.stringify((await source(sql)).rows) !== JSON.stringify((await target(sql)).rows)) {
      throw new Error("Le schéma cible diffère du schéma local.");
    }
  }

  const pending = (await source(listTables)).rows;
  for (const { name } of pending) {
    if ((await target(`SELECT 1 FROM ${qualified(name)} LIMIT 1`)).rows.length) {
      throw new Error(`La table cible ${name} contient déjà des données.`);
    }
  }
  const copied = new Set<string>();
  let total = 0;
  while (pending.length) {
    const index = pending.findIndex(({ parents }) => parents.every((p: string) => copied.has(p)));
    if (index < 0) throw new Error("Dépendances circulaires dans le schéma.");
    const [{ name }] = pending.splice(index, 1);
    const table = qualified(name);
    // Le texte JSON reste côté SQL pour préserver les bigint, JSONB, dates et bytea.
    const snapshot = `SELECT to_jsonb(t)::text AS row FROM ${table} t
      ORDER BY to_jsonb(t)::text COLLATE "C"`;
    const { rows } = await source(snapshot);
    for (let start = 0; start < rows.length; start += 250) {
      const batch = rows.slice(start, start + 250).map(({ row }) => row);
      await target(`INSERT INTO ${table} SELECT * FROM jsonb_populate_recordset(NULL::${table}, $1::jsonb)`,
        ["[" + batch.join(",") + "]"]);
    }
    if (JSON.stringify(rows) !== JSON.stringify((await target(snapshot)).rows)) {
      throw new Error(`Écart de données dans la table ${name}.`);
    }
    copied.add(name);
    total += rows.length;
  }
  const { rows: sequences } = await source(listSequences);
  for (const { name } of sequences) {
    const [{ next_value }] = (await source(
      `SELECT (last_value::bigint + CASE WHEN is_called THEN 1 ELSE 0 END)::text AS next_value
       FROM ${qualified(name)}`,
    )).rows;
    await target(`ALTER SEQUENCE ${qualified(name)} RESTART WITH ${BigInt(next_value)}`);
  }
  return { tables: copied.size, rows: total, sequences: sequences.length };
}

const rehearsal = process.argv.includes("--dry-run");
const connectionString = process.env.DATABASE_URL_UNPOOLED;
if (!rehearsal) {
  if (!connectionString) throw new Error("DATABASE_URL_UNPOOLED est requise.");
  const { hostname, searchParams } = new URL(connectionString);
  if (!hostname.endsWith(".neon.tech") || hostname.split(".")[0].endsWith("-pooler")
      || !["require", "verify-full"].includes(searchParams.get("sslmode") ?? "")) {
    throw new Error("Utiliser la connexion directe Neon avec TLS.");
  }
}
const snapshotDir = await mkdtemp(join(tmpdir(), "msp-neon-"));
try {
  await cp(".data/postgres", snapshotDir, { recursive: true });
  const source = new PGlite(snapshotDir);
  try {
    const query: Query = (sql, params) => source.query(sql, params);
    await query("SET TIME ZONE 'UTC'");
    if (rehearsal) {
      const memory = new PGlite();
      try {
        console.log("Répétition vérifiée", await memory.transaction(tx =>
          transfer(query, (sql, params) => tx.query(sql, params)),
        ));
      } finally {
        await memory.close();
      }
    } else {
      const target = new pg.Client({ connectionString, connectionTimeoutMillis: 10_000 });
      try {
        await target.connect();
        await target.query("BEGIN");
        await target.query("SET LOCAL TIME ZONE 'UTC'");
        const result = await transfer(query, (sql, params) => target.query(sql, params));
        await target.query("COMMIT");
        console.log("Import Neon vérifié", result);
      } finally {
        await target.end();
      }
    }
  } finally {
    await source.close();
  }
} finally {
  await rm(snapshotDir, { recursive: true, force: true });
}
