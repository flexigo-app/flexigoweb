import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";

export function getDb() {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error("DATABASE_URL is required for Better Auth with Neon/Drizzle");
  }

  const sql = neon(databaseUrl);
  return drizzle(sql);
}
