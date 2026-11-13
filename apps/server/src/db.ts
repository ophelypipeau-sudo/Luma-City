import { PGlite } from "@electric-sql/pglite";
import pg from "pg";
import { mkdir, readdir, readFile } from "node:fs/promises";
import {
  XP_TEST_ACCOUNT,
  XP_TEST_PROFILES,
} from "../../../packages/contracts/src/index.ts";
export type Query = (sql: string, params?: any[]) => Promise<{ rows: any[] }>;
/** Runs a script that may contain several statements, without parameters. */
export type Exec = (sql: string) => Promise<unknown>;
export type Database = {
  query: Query;
  exec: Exec;
  transaction: <T>(fn: (query: Query, exec: Exec) => Promise<T>) => Promise<T>;
  close: () => Promise<void>;
};
/**
 * pg treats sslmode=require/prefer/verify-ca as verify-full and prints a warning at
 * each start. Spelling out the mode it already applies keeps the same security.
 */
export function explicitSslMode(connectionString: string) {
  return connectionString.replace(/([?&]sslmode=)(require|prefer|verify-ca)\b/, "$1verify-full");
}
export async function openDatabase(path = ".data/postgres"): Promise<Database> {
  if (process.env.DATABASE_URL) {
    const pool = new pg.Pool({ connectionString: explicitSslMode(process.env.DATABASE_URL) });
    return {
      query: (sql, params) => pool.query(sql, params),
      exec: (sql) => pool.query(sql),
      transaction: async (fn) => {
        const client = await pool.connect();
        try {
          await client.query("BEGIN");
          const result = await fn((s, p) => client.query(s, p), (s) => client.query(s));
          await client.query("COMMIT");
          return result;
        } catch (e) {
          await client.query("ROLLBACK");
          throw e;
        } finally {
          client.release();
        }
      },
      close: () => pool.end(),
    };
  }
  if (!path.startsWith("memory://")) await mkdir(path, { recursive: true });
  const db = new PGlite(path);
  await db.waitReady;
  return {
    query: (sql, params) => db.query(sql, params),
    exec: (sql) => db.exec(sql),
    transaction: (fn) => db.transaction((tx) => fn((s, p) => tx.query(s, p), (s) => tx.exec(s))),
    close: () => db.close(),
  };
}
const MIGRATIONS = new URL("../../../db/migrations/", import.meta.url);
/**
 * Applies each file of db/migrations once, in name order, and records it in
 * schema_migrations. Every historical file is idempotent, so databases created
 * before this table existed simply replay them once.
 */
export async function migrate(
  db: Database,
  { irisOnly = false, seedDemo = true }: { irisOnly?: boolean; seedDemo?: boolean } = {},
) {
  await db.exec(
    "CREATE TABLE IF NOT EXISTS schema_migrations (name TEXT PRIMARY KEY, applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW())",
  );
  const files = (await readdir(MIGRATIONS)).filter((name) => name.endsWith(".sql")).sort();
  const applied = new Set(
    (await db.query("SELECT name FROM schema_migrations")).rows.map(({ name }) => name),
  );
  for (const file of files) {
    if (applied.has(file)) continue;
    const sql = await readFile(new URL(file, MIGRATIONS), "utf8");
    await db.transaction(async (q, exec) => {
      // Two servers starting together must not apply the same file twice.
      if (!(await q("INSERT INTO schema_migrations (name) VALUES ($1) ON CONFLICT DO NOTHING RETURNING name", [file])).rows.length)
        return;
      await exec(sql);
    });
  }
  if (!seedDemo) return;
  await db.transaction(async (q) => {
    for (const [id, label] of [
      ["aurore", "Compte Aurore"],
      ["sacha", "Compte Sacha"],
      [XP_TEST_ACCOUNT, "Compte Test XP"],
    ].filter(([id]) => !irisOnly || id === "aurore")) {
      await q("INSERT INTO accounts VALUES ($1,$2) ON CONFLICT DO NOTHING", [
        id,
        label,
      ]);
      await q(
        "INSERT INTO play_sessions(account_id) VALUES ($1) ON CONFLICT DO NOTHING",
        [id],
      );
    }
    for (const row of [
      ["iris", "aurore", 1, "Iris", "#9367cb", "#55354b"],
      ["milo", "aurore", 2, "Milo", "#518b81", "#503f37"],
      ["june", "sacha", 1, "June", "#db9574", "#ae653c"],
      ["noa", "sacha", 2, "Noa", "#6487ba", "#333947"],
      [XP_TEST_PROFILES[0], XP_TEST_ACCOUNT, 1, "Nova", "#9676ca", "#55354b"],
      [XP_TEST_PROFILES[1], XP_TEST_ACCOUNT, 2, "Lune", "#7996b7", "#493349"],
    ].filter(([id]) => !irisOnly || id === "iris"))
      await q(
        "INSERT INTO characters (id, account_id, slot, name, color, hair) VALUES ($1,$2,$3,$4,$5,$6) ON CONFLICT DO NOTHING",
        row,
      );
  });
}
