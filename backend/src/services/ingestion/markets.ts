// Focused ingestion markets — only the high-conversion markets we agreed to lead
// with, based on the harness findings. Each maps a country to one of our 8 region
// codes (shared with teacher preferences) and to whichever API covers it.
//
// "freshnessMode" encodes the dual-mode finding:
//   - "date"   : source returns reliable posting dates (apply the 14-day rule)
//   - "verify" : recruiter/cycle-based roles with no posting date — rely on
//                first_seen_at + link re-verification, longer decay window.

import type { RegionCode } from "../../../../shared/types/index.js";

export type FreshnessMode = "date" | "verify";

export interface IngestMarket {
  label: string;
  region: RegionCode;
  countryCode: string;          // ISO-ish, lowercase
  adzunaCountry: string | null; // null = Adzuna doesn't cover it
  jsearchCountry: string | null;
  queries: string[];
  freshnessMode: FreshnessMode;
}

// FOCUSED set: Gulf (highest conversion), UK (flagship), plus the international-
// school markets the harness showed real roles in (Spain, Malaysia, Kenya,
// South Africa). Deliberately NOT broad — clean feed over raw breadth.
export const INGEST_MARKETS: IngestMarket[] = [
  // Gulf — visa-sponsored, passport-blind, highest conversion. Dateless recruiter roles.
  { label: "UAE",          region: "gulf", countryCode: "ae", adzunaCountry: null, jsearchCountry: "ae",
    queries: ["international school teacher", "British curriculum teacher"], freshnessMode: "verify" },
  { label: "Qatar",        region: "gulf", countryCode: "qa", adzunaCountry: null, jsearchCountry: "qa",
    queries: ["international school teacher"], freshnessMode: "verify" },
  { label: "Saudi Arabia", region: "gulf", countryCode: "sa", adzunaCountry: null, jsearchCountry: "sa",
    queries: ["international school teacher"], freshnessMode: "verify" },
  { label: "Kuwait",       region: "gulf", countryCode: "kw", adzunaCountry: null, jsearchCountry: "kw",
    queries: ["international school teacher"], freshnessMode: "verify" },

  // UK — flagship gap-analysis market. Adzuna gives reliable dates.
  { label: "United Kingdom", region: "europe_uk", countryCode: "gb", adzunaCountry: "gb", jsearchCountry: "gb",
    queries: ["physics teacher", "maths teacher", "science teacher"], freshnessMode: "date" },

  // Strong international-school markets from the harness (real roles found).
  { label: "Spain",        region: "europe_uk", countryCode: "es", adzunaCountry: "es", jsearchCountry: "es",
    queries: ["international school teacher"], freshnessMode: "date" },
  { label: "Malaysia",     region: "southeast_asia", countryCode: "my", adzunaCountry: null, jsearchCountry: "my",
    queries: ["international school teacher"], freshnessMode: "date" },
  { label: "Kenya",        region: "africa_non_nigeria", countryCode: "ke", adzunaCountry: null, jsearchCountry: "ke",
    queries: ["international school teacher", "Cambridge curriculum teacher"], freshnessMode: "date" },
  { label: "South Africa", region: "africa_non_nigeria", countryCode: "za", adzunaCountry: "za", jsearchCountry: "za",
    queries: ["international school teacher"], freshnessMode: "date" },
];

// Freshness window in days (tunable). Date-mode jobs older than this are stale;
// verify-mode jobs decay over a longer multiple (see freshness.ts).
export const FRESHNESS_DAYS = 30;
export const VERIFY_MODE_DECAY_DAYS = 120; // cycle-based roles live longer
