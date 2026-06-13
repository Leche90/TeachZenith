// Loads and validates environment variables once, at startup. If something
// required is missing or malformed, we fail loudly here with a clear message
// rather than mysteriously later. Everything else imports `env` from here.

import { config as loadEnv } from "dotenv";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { z } from "zod";

// Load backend/.env explicitly, regardless of where the process is started from
// (e.g. repo root via npm workspaces). Without this, dotenv looks in the current
// working directory and misses backend/.env.
const __dirname = dirname(fileURLToPath(import.meta.url));
loadEnv({ path: resolve(__dirname, "../../.env") });

const schema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(4000),
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  REDIS_URL: z.string().optional(),
  ANTHROPIC_API_KEY: z.string().optional(),
  ADZUNA_APP_ID: z.string().optional(),
  ADZUNA_APP_KEY: z.string().optional(),
  JSEARCH_API_KEY: z.string().optional(),
  JSEARCH_HOST: z.string().default("api.openwebninja.com"),
  FRESHNESS_DAYS: z.coerce.number().int().positive().default(14),
  // Comma-separated list of allowed frontend origins for CORS. Defaults to the
  // Next.js dev server. In production, set this to your deployed frontend URL.
  CORS_ORIGIN: z.string().default("http://localhost:3000"),
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
