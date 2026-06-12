// Adzuna adapter. Fetches teaching jobs for a market and normalizes them to
// RawJob. Adzuna provides reliable posting dates (results[].created), so markets
// using Adzuna are date-mode.

import { env } from "../../config/env.js";
import type { RawJob } from "../ingestion/types.js";
import type { IngestMarket } from "../ingestion/markets.js";

interface AdzunaResult {
  id?: string;
  title?: string;
  created?: string;
  redirect_url?: string;
  description?: string;
  company?: { display_name?: string };
  location?: { display_name?: string; area?: string[] };
  salary_min?: number;
  salary_max?: number;
}
interface AdzunaResponse { results?: AdzunaResult[]; }

const RESULTS_PER_QUERY = 25;

export async function fetchAdzuna(market: IngestMarket): Promise<RawJob[]> {
  if (!market.adzunaCountry) return [];
  if (!env.ADZUNA_APP_ID || !env.ADZUNA_APP_KEY) return [];

  const out: RawJob[] = [];
  for (const query of market.queries) {
    const url =
      `https://api.adzuna.com/v1/api/jobs/${market.adzunaCountry}/search/1` +
      `?app_id=${encodeURIComponent(env.ADZUNA_APP_ID)}` +
      `&app_key=${encodeURIComponent(env.ADZUNA_APP_KEY)}` +
      `&results_per_page=${RESULTS_PER_QUERY}` +
      `&what=${encodeURIComponent(query)}` +
      `&content-type=application/json`;

    try {
      const res = await fetch(url);
      if (!res.ok) continue;
      const data = (await res.json()) as AdzunaResponse;
      for (const r of data.results ?? []) {
        const applyUrl = r.redirect_url ?? null;
        const externalId = r.id ?? hash(applyUrl ?? `${r.title}-${market.countryCode}`);
        out.push({
          sourceSlug: "adzuna",
          externalId,
          title: r.title ?? "(no title)",
          schoolName: r.company?.display_name ?? null,
          description: r.description ?? null,
          applyUrl,
          countryCode: market.countryCode,
          region: market.region,
          city: r.location?.display_name ?? null,
          salaryMin: r.salary_min ?? null,
          salaryMax: r.salary_max ?? null,
          salaryCurrency: null,
          requiredCurriculums: [],
          postedAt: r.created ? new Date(r.created) : null,
          freshnessMode: market.freshnessMode,
        });
      }
    } catch {
      // skip this query on error; the run logs overall failures
    }
    await sleep(400);
  }
  return out;
}

function hash(s: string): string {
  let h = 0;
  for (let i = 0; i < s.length; i++) { h = (h << 5) - h + s.charCodeAt(i); h |= 0; }
  return `adz_${Math.abs(h)}`;
}
function sleep(ms: number) { return new Promise((r) => setTimeout(r, ms)); }
