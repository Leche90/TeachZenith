// Loads and validates environment variables once, at startup. If something
// required is missing or malformed, we fail loudly here with a clear message
// rather than mysteriously later. Everything else imports `env` from here.

import "dotenv/config";
import { z } from "zod";

const schema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(4000),

  // Database. On local WSL this is "postgres:///teachzenith" (socket, no host).
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),

  // Optional now; needed when we build matching + ingestion + the worker.
  REDIS_URL: z.string().optional(),
  ANTHROPIC_API_KEY: z.string().optional(),
  ADZUNA_APP_ID: z.string().optional(),
  ADZUNA_APP_KEY: z.string().optional(),
  JSEARCH_API_KEY: z.string().optional(),
  JSEARCH_HOST: z.string().default("api.openwebninja.com"),

  // Freshness window (days) — tunable without a migration.
  FRESHNESS_DAYS: z.coerce.number().int().positive().default(14),
});

const parsed = schema.safeParse(process.env);

if (!parsed.success) {
  console.error("❌ Invalid environment configuration:");
  for (const issue of parsed.error.issues) {
    console.error(`   - ${issue.path.join(".")}: ${issue.message}`);
  }
  process.exit(1);
}

export const env = parsed.data;
export const isProd = env.NODE_ENV === "production";
