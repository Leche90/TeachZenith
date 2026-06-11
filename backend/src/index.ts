// Entrypoint. Starts the HTTP server and wires graceful shutdown so the DB pool
// closes cleanly on Ctrl-C or a platform stop signal.

import { createApp } from "./app.js";
import { env } from "./config/env.js";
import { closePool, ping } from "./db/pool.js";

const app = createApp();

const server = app.listen(env.PORT, async () => {
  const dbOk = await ping();
  console.log(`TeachZenith backend listening on http://localhost:${env.PORT}`);
  console.log(`  Database: ${dbOk ? "connected ✓" : "NOT reachable ✗ (check DATABASE_URL)"}`);
  console.log(`  Try:      curl http://localhost:${env.PORT}/api/health/db`);
});

async function shutdown(signal: string) {
  console.log(`\n${signal} received — shutting down...`);
  server.close(async () => {
    await closePool();
    console.log("Closed cleanly.");
    process.exit(0);
  });
}

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));
