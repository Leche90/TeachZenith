// Matching service. For a teacher: pre-filter candidate jobs (cheap DB query —
// region + active only, so we don't send all jobs to the AI), then match each
// and store the result. Pre-filtering is the main cost control.

import { query } from "../../db/pool.js";
import { getTeacherById } from "../../models/teachers.js";
import { saveMatch } from "../../models/matches.js";
import { matchOne } from "./matcher.js";
import { MATCHING_MODEL } from "./client.js";
import type { JobForMatch } from "./prompt.js";

export interface MatchRunResult {
  teacherId: string;
  candidates: number;
  matched: number;
  relevant: number;
  errors: number;
}

// Pre-filter: active jobs in the teacher's preferred regions (or all active if
// they chose "anywhere"). This is what keeps AI cost low — we only score jobs
// the teacher could plausibly want.
async function candidateJobs(teacherRegions: string[]): Promise<JobForMatch[]> {
  const wantsAnywhere = teacherRegions.includes("anywhere") || teacherRegions.length === 0;
  const sql = wantsAnywhere
    ? `SELECT id, title, school_name, description, region, country_code, city,
              visa_sponsored, requires_qts, requires_english_test, requires_local_license
       FROM jobs WHERE status = 'active' ORDER BY freshness_score DESC LIMIT 60`
    : `SELECT id, title, school_name, description, region, country_code, city,
              visa_sponsored, requires_qts, requires_english_test, requires_local_license
       FROM jobs WHERE status = 'active' AND region = ANY($1)
       ORDER BY freshness_score DESC LIMIT 60`;
  const rows = await query<Record<string, unknown>>(sql, wantsAnywhere ? [] : [teacherRegions]);
  return rows.map((r) => ({
    id: r.id as string,
    title: r.title as string,
    schoolName: (r.school_name as string) ?? null,
    description: (r.description as string) ?? null,
    region: (r.region as string) ?? null,
    countryCode: (r.country_code as string) ?? null,
    city: (r.city as string) ?? null,
    visaSponsored: (r.visa_sponsored as boolean) ?? null,
    requiresQts: (r.requires_qts as boolean) ?? false,
    requiresEnglishTest: (r.requires_english_test as boolean) ?? false,
    requiresLocalLicense: (r.requires_local_license as boolean) ?? false,
  }));
}

export async function matchTeacher(teacherId: string): Promise<MatchRunResult> {
  const teacher = await getTeacherById(teacherId);
  if (!teacher) throw new Error(`No teacher with id ${teacherId}`);

  const regions = (teacher.destinations ?? []).map((d) => d.region);
  const candidates = await candidateJobs(regions);

  const result: MatchRunResult = {
    teacherId,
    candidates: candidates.length,
    matched: 0,
    relevant: 0,
    errors: 0,
  };

  // Process in concurrent batches rather than one-at-a-time. CONCURRENCY controls
  // how many matches run in parallel — kept modest to stay within rate limits
  // while cutting total time by roughly the concurrency factor.
  const CONCURRENCY = 6;
  for (let i = 0; i < candidates.length; i += CONCURRENCY) {
    const batch = candidates.slice(i, i + CONCURRENCY);
    await Promise.all(
      batch.map(async (job) => {
        try {
          const out = await matchOne(teacher, job);
          await saveMatch(teacherId, job.id, out, MATCHING_MODEL);
          result.matched++;
          if (out.relevant) result.relevant++;
        } catch (err) {
          result.errors++;
          console.warn(`  ! match failed for job ${job.id}: ${(err as Error).message}`);
        }
      }),
    );
  }
  return result;
}
