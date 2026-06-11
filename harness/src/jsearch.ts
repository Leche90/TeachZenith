import type { NormalizedJob, TargetMarket } from "./types.js";
import { RESULTS_PER_QUERY } from "./markets.js";

// JSearch via OpenWeb Ninja direct portal (preferred — avoids RapidAPI transfer limits).
// If you signed up through RapidAPI instead, set JSEARCH_HOST to the RapidAPI host
// and the code will send the RapidAPI headers instead.
const API_KEY = process.env.JSEARCH_API_KEY;
const HOST = process.env.JSEARCH_HOST || "api.openwebninja.com"; // direct portal default

// JSearch search endpoint returns data[] with ~40 fields. We use:
//   job_title, employer_name, job_city/job_country, job_apply_link,
//   job_posted_at_datetime_utc (ISO) or job_posted_at_timestamp (unix seconds),
//   job_description
interface JSearchResult {
  job_title?: string;
  employer_name?: string;
  job_city?: string;
  job_country?: string;
  job_apply_link?: string;
  job_posted_at_datetime_utc?: string;
  job_posted_at_timestamp?: number;
  job_description?: string;
}
interface JSearchResponse {
  status?: string;
  data?: JSearchResult[];
}

export async function fetchJSearch(market: TargetMarket): Promise<NormalizedJob[]> {
  if (!API_KEY) {
    console.warn("  [jsearch] missing JSEARCH_API_KEY — skipping");
    return [];
  }

  const usingRapidApi = HOST.includes("rapidapi.com");
  const headers: Record<string, string> = usingRapidApi
    ? { "x-rapidapi-key": API_KEY, "x-rapidapi-host": HOST }
    : { "x-api-key": API_KEY };

  const jobs: NormalizedJob[] = [];
  for (const query of market.queries) {
    // date_posted=month keeps results recent at the source; we still apply our own
    // 14-day freshness filter downstream for a true picture.
    // Endpoint: current JSearch is /jsearch/search-v2 on the OpenWeb Ninja portal.
    const base = HOST.includes("rapidapi.com")
      ? `https://${HOST}/search`
      : `https://${HOST}/jsearch/search-v2`;
    const url =
      `${base}` +
      `?query=${encodeURIComponent(query)}` +
      `&country=${encodeURIComponent(market.jsearchCountry)}` +
      `&date_posted=month` +
      `&num_pages=1`;

    try {
      const res = await fetch(url, { headers });
      if (!res.ok) {
        console.warn(`  [jsearch] ${market.label} "${query}" -> HTTP ${res.status}`);
        continue;
      }
      const json = (await res.json()) as Record<string, unknown>;

      // search-v2 may nest the job array under a different key than the old
      // endpoint. Find the first array of objects among likely locations.
      const rows = extractJobArray(json).slice(0, RESULTS_PER_QUERY);

      if (rows.length === 0 && !DEBUGGED.printed) {
        // One-time peek at the actual response shape so we know the real schema.
        DEBUGGED.printed = true;
        const topKeys = Object.keys(json);
        console.warn(`  [jsearch] DEBUG top-level keys: ${topKeys.join(", ")}`);
        const dataVal = (json as { data?: unknown }).data;
        if (dataVal && typeof dataVal === "object") {
          console.warn(`  [jsearch] DEBUG data keys: ${Object.keys(dataVal as object).join(", ")}`);
        }
      }

      // One-time peek at a sample job's field names, so we can map the date field.
      if (rows.length > 0 && !DEBUGGED.fieldsPrinted) {
        DEBUGGED.fieldsPrinted = true;
        const keys = Object.keys(rows[0] as object);
        const dateKeys = keys.filter((k) => /post|date|time|created|updated/i.test(k));
        console.warn(`  [jsearch] DEBUG sample job fields: ${keys.join(", ")}`);
        console.warn(`  [jsearch] DEBUG date-like fields: ${dateKeys.join(", ") || "(none found)"}`);
      }

      for (const r of rows) {
        let posted: Date | null = null;
        if (r.job_posted_at_datetime_utc) posted = new Date(r.job_posted_at_datetime_utc);
        else if (r.job_posted_at_timestamp) posted = new Date(r.job_posted_at_timestamp * 1000);

        const loc = [r.job_city, r.job_country].filter(Boolean).join(", ") || null;
        jobs.push({
          source: "jsearch",
          title: r.job_title ?? "(no title)",
          company: r.employer_name ?? null,
          location: loc,
          country: market.label,
          datePosted: posted,
          url: r.job_apply_link ?? null,
          descriptionSnippet: (r.job_description ?? "").slice(0, 160) || null,
        });
      }
    } catch (err) {
      console.warn(`  [jsearch] ${market.label} "${query}" -> error: ${(err as Error).message}`);
    }
    await sleep(1200); // JSearch free tier is rate-limited; go gently
  }
  return jobs;
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

// One-time debug print guard.
const DEBUGGED = { printed: false, fieldsPrinted: false };

// search-v2 nests the job list differently across versions. Robustly locate the
// first array of job-like objects: check known keys, then fall back to scanning.
function extractJobArray(json: Record<string, unknown>): JSearchResult[] {
  // Known/likely locations in order of preference.
  const candidates: unknown[] = [
    json["data"],
    (json["data"] as Record<string, unknown> | undefined)?.["jobs"],
    json["jobs"],
    json["results"],
    (json["data"] as Record<string, unknown> | undefined)?.["results"],
  ];
  for (const c of candidates) {
    if (Array.isArray(c) && looksLikeJobs(c)) return c as JSearchResult[];
  }
  // Last resort: scan all top-level values for the first array of objects.
  for (const v of Object.values(json)) {
    if (Array.isArray(v) && looksLikeJobs(v)) return v as JSearchResult[];
  }
  return [];
}

function looksLikeJobs(arr: unknown[]): boolean {
  if (arr.length === 0) return true; // empty array is a valid "no results"
  const first = arr[0];
  return typeof first === "object" && first !== null;
}
