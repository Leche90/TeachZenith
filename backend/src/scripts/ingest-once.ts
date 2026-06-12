// CLI: run one ingestion pass and print a summary, then exit.
// Usage (from backend/): npx tsx src/scripts/ingest-once.ts
import { runIngestion } from "../services/ingestion/run.js";
import { countActiveJobs } from "../models/jobs.js";
import { closePool } from "../db/pool.js";

async function main() {
  console.log("Starting focused ingestion run...");
  const t0 = Date.now();
  const summary = await runIngestion();
  const secs = ((Date.now() - t0) / 1000).toFixed(1);

  console.log("\n" + "=".repeat(50));
  console.log("INGESTION COMPLETE");
  console.log("=".repeat(50));
  for (const [slug, c] of Object.entries(summary.bySource)) {
    console.log(`  ${slug.padEnd(8)} seen ${c.seen}, new ${c.inserted}, updated ${c.updated}`);
  }
  console.log(`  TOTAL    seen ${summary.totalSeen}, new ${summary.totalInserted}, updated ${summary.totalUpdated}`);
  const active = await countActiveJobs();
  console.log(`  Active jobs now in DB: ${active}`);
  console.log(`  Took ${secs}s`);

  await closePool();
}

main().catch(async (err) => {
  console.error("Ingestion failed:", err);
  await closePool();
  process.exit(1);
});
