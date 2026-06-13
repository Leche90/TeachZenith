// Matches data access. Stores the AI's output per teacher×job, and reads a
// teacher's matches back for the results screen (best first, grouped by tier).

import { pool, query } from "../db/pool.js";
import type { Match, MatchGap, FrictionTier } from "../../../shared/types/index.js";
import type { MatchOutput } from "../services/matching/matcher.js";
import { findCareersUrl } from "../services/employers/registry.js";

export async function saveMatch(
  teacherId: string,
  jobId: string,
  out: MatchOutput,
  modelVersion: string,
): Promise<void> {
  await pool.query(
    `INSERT INTO matches (teacher_id, job_id, score, tier, reasoning, gaps, model_version)
     VALUES ($1,$2,$3,$4,$5,$6,$7)
     ON CONFLICT (teacher_id, job_id) DO UPDATE SET
       score = EXCLUDED.score, tier = EXCLUDED.tier, reasoning = EXCLUDED.reasoning,
       gaps = EXCLUDED.gaps, model_version = EXCLUDED.model_version, scored_at = now()`,
    [teacherId, jobId, out.score, out.tier, out.reasoning, JSON.stringify(out.gaps), modelVersion],
  );
}

// A match enriched with the job details the results screen needs to render.
export interface EnrichedMatch {
  matchId: string;
  jobId: string;
  score: number;
  tier: FrictionTier;
  reasoning: string | null;
  gaps: MatchGap[];
  job: {
    title: string;
    schoolName: string | null;
    region: string | null;
    countryCode: string | null;
    city: string | null;
    applyUrl: string | null;
    // When we recognise the employer, a verified first-party careers URL to
    // prefer over the aggregator apply link (and the name to show on the button).
    careersUrl: string | null;
    careersName: string | null;
    isTaxFree: boolean | null;
    housingProvided: boolean | null;
    visaSponsored: boolean | null;
    firstSeenAt: Date;
    lastVerifiedAt: Date;
  };
}

export interface GroupedMatches {
  apply_now: EnrichedMatch[];
  apply_with_prep: EnrichedMatch[];
  plan_ahead: EnrichedMatch[];
  counts: { apply_now: number; apply_with_prep: number; plan_ahead: number; total: number };
}

interface EnrichedRow {
  match_id: string;
  job_id: string;
  score: number;
  tier: FrictionTier;
  reasoning: string | null;
  gaps: MatchGap[];
  title: string;
  school_name: string | null;
  region: string | null;
  country_code: string | null;
  city: string | null;
  apply_url: string | null;
  is_tax_free: boolean | null;
  housing_provided: boolean | null;
  visa_sponsored: boolean | null;
  first_seen_at: Date;
  last_verified_at: Date;
}

// Enriched matches for the results screen: joins jobs, filters out low scores
// and expired jobs, and groups by tier (best first within each).
export async function getGroupedMatchesForTeacher(
  teacherId: string,
  minScore = 40,
): Promise<GroupedMatches> {
  const rows = await query<EnrichedRow>(
    `SELECT m.id AS match_id, m.job_id, m.score, m.tier, m.reasoning, m.gaps,
            j.title, j.school_name, j.region, j.country_code, j.city, j.apply_url,
            j.is_tax_free, j.housing_provided, j.visa_sponsored,
            j.first_seen_at, j.last_verified_at
     FROM matches m
     JOIN jobs j ON j.id = m.job_id
     WHERE m.teacher_id = $1 AND m.score >= $2 AND j.status = 'active'
     ORDER BY m.score DESC`,
    [teacherId, minScore],
  );

  const grouped: GroupedMatches = {
    apply_now: [],
    apply_with_prep: [],
    plan_ahead: [],
    counts: { apply_now: 0, apply_with_prep: 0, plan_ahead: 0, total: 0 },
  };

  for (const r of rows) {
    const enriched: EnrichedMatch = {
      matchId: r.match_id,
      jobId: r.job_id,
      score: r.score,
      tier: r.tier,
      reasoning: r.reasoning,
      gaps: r.gaps ?? [],
      job: {
        title: r.title,
        schoolName: r.school_name,
        region: r.region,
        countryCode: r.country_code,
        city: r.city,
        applyUrl: r.apply_url,
        careersUrl: findCareersUrl(r.school_name)?.careersUrl ?? null,
        careersName: findCareersUrl(r.school_name)?.displayName ?? null,
        isTaxFree: r.is_tax_free,
        housingProvided: r.housing_provided,
        visaSponsored: r.visa_sponsored,
        firstSeenAt: r.first_seen_at,
        lastVerifiedAt: r.last_verified_at,
      },
    };
    grouped[r.tier].push(enriched);
    grouped.counts[r.tier]++;
    grouped.counts.total++;
  }
  return grouped;
}

interface MatchRow {
  id: string;
  teacher_id: string;
  job_id: string;
  score: number;
  tier: FrictionTier;
  reasoning: string | null;
  gaps: MatchGap[];
  model_version: string | null;
  scored_at: Date;
}

// A teacher's matches, best first. Optionally filter by minimum score (e.g. hide
// the irrelevant low-scorers from the results screen).
export async function getMatchesForTeacher(
  teacherId: string,
  minScore = 0,
): Promise<Match[]> {
  const rows = await query<MatchRow>(
    `SELECT id, teacher_id, job_id, score, tier, reasoning, gaps, model_version, scored_at
     FROM matches WHERE teacher_id = $1 AND score >= $2
     ORDER BY tier, score DESC`,
    [teacherId, minScore],
  );
  return rows.map((r) => ({
    id: r.id,
    teacherId: r.teacher_id,
    jobId: r.job_id,
    score: r.score,
    tier: r.tier,
    reasoning: r.reasoning,
    gaps: r.gaps ?? [],
    modelVersion: r.model_version,
    scoredAt: r.scored_at,
  }));
}
