// Matches data access. Stores the AI's output per teacher×job, and reads a
// teacher's matches back for the results screen (best first, grouped by tier).

import { pool, query } from "../db/pool.js";
import type { Match, MatchGap, FrictionTier } from "../../../shared/types/index.js";
import type { MatchOutput } from "../services/matching/matcher.js";

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
