import { betterAuth } from "better-auth";
import { drizzleAdapter } from "@better-auth/drizzle-adapter";
import { getDb } from "@/lib/db";
import * as schema from "@/lib/schema";

const betterAuthUrl =
  process.env.NODE_ENV === "development"
    ? "http://localhost:3001"
    : process.env.BETTER_AUTH_URL || "http://localhost:3001";
const googleClientId = process.env.GOOGLE_CLIENT_ID;
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;
const databaseUrl = process.env.DATABASE_URL;

// Helper to build Google OAuth config with optional prompt parameter
const buildGoogleConfig = () => {
  if (!googleClientId || !googleClientSecret) {
    return undefined;
  }

  return {
    clientId: googleClientId,
    clientSecret: googleClientSecret,
  };
};

export const auth = betterAuth({
  baseURL: betterAuthUrl,
  trustedOrigins: [betterAuthUrl],
  secret:
    process.env.BETTER_AUTH_SECRET ||
    "replace-this-with-a-long-random-secret-for-local-dev",
  advanced: {
    cookiePrefix: "flexigo_admin",
  },
  database: databaseUrl
    ? drizzleAdapter(getDb(), {
        provider: "pg",
        schema,
      })
    : undefined,
  socialProviders: buildGoogleConfig()
    ? {
        google: buildGoogleConfig(),
      }
    : undefined,
});
