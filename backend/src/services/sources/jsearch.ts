// JSearch source adapter (OpenWeb Ninja, search-v2 endpoint). Global coverage —
// carries Gulf + Asia. Learned from the harness: jobs live under data.jobs, and
// the posting date (job_posted_at_datetime_utc) is often NULL for recruiter
// cycle-based roles — those markets use "verify" freshness mode.

import { env } from "../../config/env.js";
import type { RawJob } from "../ingestion/types.js";
import type { IngestMarket } from "../ingestion/markets.js";

interface JSearchJob {
  job_id?: string;
  job_title?: string;
  employer_name?: string;
  job_apply_link?: string;
  job_description?: string;
  job_city?: string;
  job_country?: string;
  job_posted_at_datetime_utc?: string;
  job_posted_at_timestamp?: number;
  job_min_salary?: number;
  job_max_salary?: number;
  job_salary_currency?: string;
}

const RESULTS_PER_QUERY = 25;

export async function fetchJSearch(market: IngestMarket): Promise<RawJob[]> {
  if (!market.jsearchCountry) return [];
  if (!env.JSEARCH_API_KEY) return [];

  const host = env.JSEARCH_HOST || "api.openwebninja.com";
  const usingRapidApi = host.includes("rapidapi.com");
  const headers: Record<string, string> = usingRapidApi
    ? { "x-rapidapi-key": env.JSEARCH_API_KEY, "x-rapidapi-host": host }
    : { "x-api-key": env.JSEARCH_API_KEY };
  const base = usingRapidApi
    ? `https://${host}/search`
    : `https://${host}/jsearch/search-v2`;

  const out: RawJob[] = [];
  for (const query of market.queries) {
    const url =
      `${base}?query=${encodeURIComponent(query)}` +
      `&country=${encodeURIComponent(market.jsearchCountry)}` +
      `&date_posted=month&num_pages=1`;
    try {
      const res = await fetch(url, { headers });
      if (!res.ok) continue;
      const json = (await res.json()) as Record<string, unknown>;
      const rows = extractJobs(json).slice(0, RESULTS_PER_QUERY);
      for (const r of rows) {
        let posted: Date | null = null;
        if (r.job_posted_at_datetime_utc) posted = new Date(r.job_posted_at_datetime_utc);
        else if (r.job_posted_at_timestamp) posted = new Date(r.job_posted_at_timestamp * 1000);

        const externalId = r.job_id ?? hashUrl(r.job_apply_link ?? r.job_title ?? "");
        out.push({
          sourceSlug: "jsearch",
          externalId,
          title: r.job_title ?? "(no title)",
          schoolName: r.employer_name ?? null,
          description: r.job_description ?? null,
          applyUrl: r.job_apply_link ?? null,
          countryCode: market.countryCode,
          region: market.region,
          city: r.job_city ?? null,
          salaryMin: r.job_min_salary ?? null,
          salaryMax: r.job_max_salary ?? null,
          salaryCurrency: r.job_salary_currency ?? null,
          requiredCurriculums: [],
          postedAt: posted,
          freshnessMode: market.freshnessMode,
        });
      }
    } catch {
      // skip and continue
    }
    await sleep(1200);
  }
  return out;
}

// search-v2 nests jobs under data.jobs; be robust to other shapes too.
function extractJobs(json: Record<string, unknown>): JSearchJob[] {
  const data = json["data"] as Record<string, unknown> | undefined;
  const candidates: unknown[] = [data?.["jobs"], json["jobs"], json["data"], json["results"]];
  for (const c of candidates) {
    if (Array.isArray(c)) return c as JSearchJob[];
  }
  return [];
}

function hashUrl(s: string): string {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return `js_${Math.abs(h)}`;
}
function sleep(ms: number) { return new Promise((r) => setTimeout(r, ms)); }
