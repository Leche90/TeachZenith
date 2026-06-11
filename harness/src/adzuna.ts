import type { NormalizedJob, TargetMarket } from "./types.js";
import { RESULTS_PER_QUERY } from "./markets.js";

const APP_ID = process.env.ADZUNA_APP_ID;
const APP_KEY = process.env.ADZUNA_APP_KEY;

// Adzuna search endpoint:
//   https://api.adzuna.com/v1/api/jobs/{country}/search/{page}?app_id=..&app_key=..&what=..
// Key response fields (confirmed): results[].created (ISO date string),
//   results[].title, results[].company.display_name, results[].location.display_name,
//   results[].redirect_url, results[].description
interface AdzunaResult {
  title?: string;
  created?: string;
  redirect_url?: string;
  description?: string;
  company?: { display_name?: string };
  location?: { display_name?: string };
}
interface AdzunaResponse {
  results?: AdzunaResult[];
}

export async function fetchAdzuna(market: TargetMarket): Promise<NormalizedJob[]> {
  if (!market.adzunaCountry) return []; // country not supported by Adzuna
  if (!APP_ID || !APP_KEY) {
    console.warn("  [adzuna] missing ADZUNA_APP_ID / ADZUNA_APP_KEY — skipping");
    return [];
  }

  const jobs: NormalizedJob[] = [];
  for (const query of market.queries) {
    const url =
      `https://api.adzuna.com/v1/api/jobs/${market.adzunaCountry}/search/1` +
      `?app_id=${encodeURIComponent(APP_ID)}` +
      `&app_key=${encodeURIComponent(APP_KEY)}` +
      `&results_per_page=${RESULTS_PER_QUERY}` +
      `&what=${encodeURIComponent(query)}` +
      `&content-type=application/json`;

    try {
      const res = await fetch(url);
      if (!res.ok) {
        console.warn(`  [adzuna] ${market.label} "${query}" -> HTTP ${res.status}`);
        continue;
      }
      const data = (await res.json()) as AdzunaResponse;
      for (const r of data.results ?? []) {
        jobs.push({
          source: "adzuna",
          title: r.title ?? "(no title)",
          company: r.company?.display_name ?? null,
          location: r.location?.display_name ?? null,
          country: market.label,
          datePosted: r.created ? new Date(r.created) : null,
          url: r.redirect_url ?? null,
          descriptionSnippet: (r.description ?? "").slice(0, 160) || null,
        });
      }
    } catch (err) {
      console.warn(`  [adzuna] ${market.label} "${query}" -> error: ${(err as Error).message}`);
    }
    await sleep(400); // be a polite API citizen
  }
  return jobs;
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}
