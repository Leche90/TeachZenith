// Jobs data access for ingestion. The key operation is upsertJob: insert a new
// job, or update an existing one (matched on source + external_key) — this is
// our deduplication. It also stamps freshness fields. first_seen_at is set once
// on insert and never overwritten (the date we trust).

import { pool, queryOne } from "../db/pool.js";
import type { RawJob } from "../services/ingestion/types.js";
import { computeFreshness } from "../services/ingestion/freshness.js";

// Resolve (or create) a source row for a slug, return its id. Cached per process.
const sourceIdCache = new Map<string, string>();

export async function getOrCreateSourceId(slug: string, name: string): Promise<string> {
  const cached = sourceIdCache.get(slug);
  if (cached) return cached;

  const existing = await queryOne<{ id: string }>(
    "SELECT id FROM sources WHERE slug = $1", [slug],
  );
  if (existing) {
    sourceIdCache.set(slug, existing.id);
    return existing.id;
  }
  const created = await queryOne<{ id: string }>(
    `INSERT INTO sources (kind, name, slug) VALUES ('aggregator_api', $1, $2)
     RETURNING id`,
    [name, slug],
  );
  sourceIdCache.set(slug, created!.id);
  return created!.id;
}

export interface UpsertResult { inserted: boolean }

// Insert or update one job. Returns whether it was newly inserted (vs updated).
export async function upsertJob(raw: RawJob, sourceId: string): Promise<UpsertResult> {
  // Does it already exist? (dedup key = source + external_key)
  const existing = await queryOne<{ id: string; first_seen_at: Date }>(
    "SELECT id, first_seen_at FROM jobs WHERE source_id = $1 AND external_key = $2",
    [sourceId, raw.externalId],
  );

  const now = new Date();
  const firstSeen = existing?.first_seen_at ?? now;
  const fresh = computeFreshness({
    mode: raw.freshnessMode,
    postedAt: raw.postedAt,
    firstSeenAt: firstSeen,
    now,
  });
  const status = fresh.isFresh ? "active" : "expired";

  if (existing) {
    await pool.query(
      `UPDATE jobs SET
         title=$1, school_name=$2, description=$3, apply_url=$4,
         country_code=$5, region=$6, city=$7,
         salary_min=$8, salary_max=$9, salary_currency=$10,
         posted_at=$11, last_verified_at=now(), verify_attempts=verify_attempts+1,
         status=$12, freshness_score=$13
       WHERE id=$14`,
      [
        raw.title, raw.schoolName, raw.description, raw.applyUrl,
        raw.countryCode, raw.region, raw.city,
        raw.salaryMin, raw.salaryMax, raw.salaryCurrency,
        raw.postedAt, status, fresh.score, existing.id,
      ],
    );
    return { inserted: false };
  }

  await pool.query(
    `INSERT INTO jobs (
       source_id, external_key, title, school_name, description, apply_url,
       country_code, region, city, salary_min, salary_max, salary_currency,
       required_curriculums, posted_at, first_seen_at, last_verified_at,
       status, freshness_score)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14, now(), now(), $15, $16)`,
    [
      sourceId, raw.externalId, raw.title, raw.schoolName, raw.description, raw.applyUrl,
      raw.countryCode, raw.region, raw.city, raw.salaryMin, raw.salaryMax, raw.salaryCurrency,
      raw.requiredCurriculums, raw.postedAt, status, fresh.score,
    ],
  );
  return { inserted: true };
}

export async function countActiveJobs(): Promise<number> {
  const row = await queryOne<{ n: string }>(
    "SELECT count(*)::int AS n FROM jobs WHERE status = 'active'",
  );
  return Number(row?.n ?? 0);
}
