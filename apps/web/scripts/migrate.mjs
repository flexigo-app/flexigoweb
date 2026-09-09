import "dotenv/config";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { migrate } from "drizzle-orm/neon-http/migrator";
import { readMigrationFiles } from "drizzle-orm/migrator";

const databaseUrl = process.env.DB_URL_POOLED || process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL is required to run migrations");
}

const currentDirectory = dirname(fileURLToPath(import.meta.url));
const migrationsFolder = resolve(currentDirectory, "../drizzle");
const client = neon(databaseUrl);
const database = drizzle(client);

await client.query(`CREATE SCHEMA IF NOT EXISTS drizzle`);
await client.query(`CREATE TABLE IF NOT EXISTS drizzle.__drizzle_migrations (
  id serial PRIMARY KEY,
  hash text NOT NULL,
  created_at bigint
)`);

const [migrationCount] = await client.query(
  `SELECT count(*)::int AS count FROM drizzle.__drizzle_migrations`
);
const [legacySchema] = await client.query(`
  SELECT
    to_regclass('public.account') IS NOT NULL AS account_exists,
    to_regclass('public.booking') IS NOT NULL AS booking_exists,
    to_regclass('public.driver') IS NOT NULL AS driver_exists,
    to_regtype('public.user_role') IS NOT NULL AS user_role_exists
`);

if (
  migrationCount.count < 4 &&
  legacySchema.account_exists &&
  legacySchema.booking_exists &&
  legacySchema.driver_exists &&
  legacySchema.user_role_exists
) {
  const baselineMigrations = readMigrationFiles({ migrationsFolder }).slice(0, 4);

  for (const migration of baselineMigrations) {
    await client.query(
      `INSERT INTO drizzle.__drizzle_migrations (hash, created_at)
       SELECT $1, $2
       WHERE NOT EXISTS (
         SELECT 1 FROM drizzle.__drizzle_migrations WHERE hash = $1
       )`,
      [migration.hash, migration.folderMillis]
    );
  }
}

await migrate(database, {
  migrationsFolder,
});

console.log("Migrations applied successfully.");