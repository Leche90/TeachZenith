// Ingestion orchestrator. For each focused market, pull from both adapters,
// persist with dedup + freshness, and report a summary. Writes an ingestion_runs
// row per source so the admin layer can monitor feed health.

import { pool } from "../../db/pool.js";
import { INGEST_MARKETS } from "./markets.js";
import { fetchAdzuna } from "../sources/adzuna.js";
import { fetchJSearch } from "../sources/jsearch.js";
import { getOrCreateSourceId, upsertJob } from "../../models/jobs.js";
import type { RawJob } from "./types.js";

export interface IngestSummary {
  bySource: Record<string, { seen: number; inserted: number; updated: number }>;
  totalSeen: number;
  totalInserted: number;
  totalUpdated: number;
}

export async function runIngestion(): Promise<IngestSummary> {
  const summary: IngestSummary = {
    bySource: {
      adzuna: { seen: 0, inserted: 0, updated: 0 },
      jsearch: { seen: 0, inserted: 0, updated: 0 },
    },
    totalSeen: 0,
    totalInserted: 0,
    totalUpdated: 0,
  };

  const adzunaSourceId = await getOrCreateSourceId("adzuna", "Adzuna");
  const jsearchSourceId = await getOrCreateSourceId("jsearch", "JSearch");

  // Track a run per source for the health log.
  const adzunaRun = await startRun(adzunaSourceId);
  const jsearchRun = await startRun(jsearchSourceId);

  for (const market of INGEST_MARKETS) {
    console.log(`\n→ ${market.label} (${market.region})`);

    const adzunaJobs = await fetchAdzuna(market);
    await persistBatch(adzunaJobs, adzunaSourceId, summary, "adzuna");
    if (adzunaJobs.length) console.log(`    adzuna: ${adzunaJobs.length} fetched`);

    const jsearchJobs = await fetchJSearch(market);
    await persistBatch(jsearchJobs, jsearchSourceId, summary, "jsearch");
    if (jsearchJobs.length) console.log(`    jsearch: ${jsearchJobs.length} fetched`);
  }

  await finishRun(adzunaRun, summary.bySource.adzuna);
  await finishRun(jsearchRun, summary.bySource.jsearch);

  return summary;
}

async function persistBatch(
  jobs: RawJob[],
  sourceId: string,
  summary: IngestSummary,
  slug: "adzuna" | "jsearch",
): Promise<void> {
  for (const raw of jobs) {
    summary.bySource[slug].seen++;
    summary.totalSeen++;
    try {
      const { inserted } = await upsertJob(raw, sourceId);
      if (inserted) {
        summary.bySource[slug].inserted++;
        summary.totalInserted++;
      } else {
        summary.bySource[slug].updated++;
        summary.totalUpdated++;
      }
    } catch (err) {
      console.warn(`    ! failed to persist "${raw.title}": ${(err as Error).message}`);
    }
  }
}

async function startRun(sourceId: string): Promise<string> {
  const res = await pool.query<{ id: string }>(
    "INSERT INTO ingestion_runs (source_id) VALUES ($1) RETURNING id",
    [sourceId],
  );
  return res.rows[0]!.id;
}

async function finishRun(
  runId: string,
  counts: { seen: number; inserted: number; updated: number },
): Promise<void> {
  await pool.query(
    `UPDATE ingestion_runs SET
       finished_at = now(), ok = true,
       jobs_seen = $1, jobs_inserted = $2, jobs_updated = $3
     WHERE id = $4`,
    [counts.seen, counts.inserted, counts.updated, runId],
  );
}
