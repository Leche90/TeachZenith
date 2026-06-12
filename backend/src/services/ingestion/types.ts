// The normalized shape every source adapter (Adzuna, JSearch, future scrapers)
// must produce. The ingest service maps this into the jobs table. Keeping a
// single normalized shape means adding a new source later doesn't touch the
// ingest/dedup/freshness logic.

import type { RegionCode, Curriculum } from "../../../../shared/types/index.js";
import type { FreshnessMode } from "./markets.js";

export interface RawJob {
  // Identity / dedupe
  sourceSlug: "adzuna" | "jsearch";
  externalId: string;          // stable id from the source (or hashed apply URL)

  // Core listing
  title: string;
  schoolName: string | null;
  description: string | null;
  applyUrl: string | null;

  // Location
  countryCode: string;
  region: RegionCode;
  city: string | null;

  // Compensation / perks (best-effort; often null)
  salaryMin: number | null;
  salaryMax: number | null;
  salaryCurrency: string | null;

  // Requirements (best-effort parse; AI fills gaps later)
  requiredCurriculums: Curriculum[];

  // Freshness
  postedAt: Date | null;       // source-claimed date (may be null)
  freshnessMode: FreshnessMode;
}
