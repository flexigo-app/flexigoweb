import { betterAuth } from "better-auth";
import { drizzleAdapter } from "@better-auth/drizzle-adapter";
import { getDb } from "@/lib/db";
import * as schema from "@/lib/schema";

const betterAuthUrl = process.env.BETTER_AUTH_URL || "http://localhost:3000";
const googleClientId = process.env.GOOGLE_CLIENT_ID;
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;
const databaseUrl = process.env.DATABASE_URL;

export const auth = betterAuth({
  baseURL: betterAuthUrl,
  secret:
    process.env.BETTER_AUTH_SECRET ||
    "replace-this-with-a-long-random-secret-for-local-dev",
  database: databaseUrl
    ? drizzleAdapter(getDb(), {
        provider: "pg",
        schema,
      })
    : undefined,
  socialProviders:
    googleClientId && googleClientSecret
      ? {
          google: {
            clientId: googleClientId,
            clientSecret: googleClientSecret,
          },
        }
      : undefined,
});
