import { PGlite } from "@electric-sql/pglite";
import pg from "pg";
import { mkdir, readFile } from "node:fs/promises";
import {
  XP_TEST_ACCOUNT,
  XP_TEST_PROFILES,
} from "../../../packages/contracts/src/index.ts";
export type Query = (sql: string, params?: any[]) => Promise<{ rows: any[] }>;
export type Database = {
  query: Query;
  transaction: <T>(fn: (query: Query) => Promise<T>) => Promise<T>;
  close: () => Promise<void>;
};
export async function openDatabase(path = ".data/postgres"): Promise<Database> {
  if (process.env.DATABASE_URL) {
    const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
    return {
      query: (sql, params) => pool.query(sql, params),
      transaction: async (fn) => {
        const client = await pool.connect();
        try {
          await client.query("BEGIN");
          const result = await fn((s, p) => client.query(s, p));
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
    transaction: (fn) => db.transaction((tx) => fn((s, p) => tx.query(s, p))),
    close: () => db.close(),
  };
}
export async function migrate(db: Database, irisOnly = false) {
  for (const file of [
    "001_initial.sql",
    "002_character_motto.sql",
    "003_profile_social.sql",
    "004_profile_activity.sql",
    "005_profile_template.sql",
    "006_character_outfit.sql",
    "007_xp_magazine.sql",
    "008_arcade_wheel.sql",
    "009_arcade_scores.sql",
    "010_profile_image.sql",
    "011_arcade_memory.sql",
    "012_daily_scratch.sql",
    "013_scratch_prize.sql",
    "014_wheel_coin_drops.sql",
    "015_xp_pickup_claims.sql",
    "016_wheel_xp.sql",
    "017_player_accounts.sql",
    "018_neon_auth_accounts.sql",
    "019_home_gift_quest.sql",
  ]) {
    const sql = await readFile(
      new URL(`../../../db/migrations/${file}`, import.meta.url),
      "utf8",
    );
    for (const statement of sql.split(";").filter((s) => s.trim()))
      await db.query(statement);
  }
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
