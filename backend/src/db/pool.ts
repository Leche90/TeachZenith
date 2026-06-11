// The single Postgres connection pool for the whole backend, plus small query
// helpers. All data access goes through here — models call `query`/`queryOne`,
// nothing opens its own connection.

import pg from "pg";
import { env, isProd } from "../config/env.js";

const { Pool } = pg;

export const pool = new Pool({
  connectionString: env.DATABASE_URL,
  // Conservative defaults; tune for production load later.
  max: 10,
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 10_000,
  // Managed hosts usually require SSL in production; local socket does not.
  ssl: isProd ? { rejectUnauthorized: false } : undefined,
});

pool.on("error", (err) => {
  // A pooled client errored while idle — log it; the pool recovers.
  console.error("Unexpected idle client error:", err.message);
});

// Run a query and get all rows back, typed.
export async function query<T = unknown>(
  text: string,
  params?: unknown[],
): Promise<T[]> {
  const res = await pool.query(text, params as never);
  return res.rows as T[];
}

// Run a query expecting at most one row (e.g. fetch by id). Returns null if none.
export async function queryOne<T = unknown>(
  text: string,
  params?: unknown[],
): Promise<T | null> {
  const rows = await query<T>(text, params);
  return rows[0] ?? null;
}

// Simple connectivity check used by the health route.
export async function ping(): Promise<boolean> {
  try {
    const rows = await query<{ ok: number }>("SELECT 1 AS ok");
    return rows[0]?.ok === 1;
  } catch {
    return false;
  }
}

// Graceful shutdown.
export async function closePool(): Promise<void> {
  await pool.end();
}
