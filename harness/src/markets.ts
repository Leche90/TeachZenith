import type { TargetMarket } from "./types.js";

// ============================================================================
// FULL DESTINATION MAP — all 8 TeachZenith regions.
// ----------------------------------------------------------------------------
// Coverage reality:
//   Adzuna covers a FIXED country list: gb, us, ca, au, de, fr, nl, it, es, pl,
//   br, in, sg, za, mx, at, nz, ch, be. For anything else (Gulf, most of Asia,
//   Korea/Japan) adzunaCountry is "" and JSearch (global, via Google for Jobs)
//   carries that market alone.
//
// Each entry maps to one of your product regions so we can see, per region,
// what the API layer actually returns. One query per market keeps this run
// light (~one JSearch call + maybe one Adzuna call each).
// ============================================================================

export const TARGET_MARKETS: TargetMarket[] = [
  // ---- GULF (JSearch only) ----
  { label: "Gulf · UAE",          adzunaCountry: "",   jsearchCountry: "ae", queries: ["international school teacher"] },
  { label: "Gulf · Qatar",        adzunaCountry: "",   jsearchCountry: "qa", queries: ["international school teacher"] },
  { label: "Gulf · Saudi Arabia", adzunaCountry: "",   jsearchCountry: "sa", queries: ["international school teacher"] },
  { label: "Gulf · Kuwait",       adzunaCountry: "",   jsearchCountry: "kw", queries: ["international school teacher"] },

  // ---- SOUTHEAST ASIA (JSearch only; Adzuna has Singapore) ----
  { label: "SE Asia · Singapore", adzunaCountry: "sg", jsearchCountry: "sg", queries: ["international school teacher"] },
  { label: "SE Asia · Thailand",  adzunaCountry: "",   jsearchCountry: "th", queries: ["international school teacher"] },
  { label: "SE Asia · Vietnam",   adzunaCountry: "",   jsearchCountry: "vn", queries: ["international school teacher"] },
  { label: "SE Asia · Malaysia",  adzunaCountry: "",   jsearchCountry: "my", queries: ["international school teacher"] },

  // ---- EAST ASIA (JSearch only) ----
  { label: "E Asia · China",      adzunaCountry: "",   jsearchCountry: "cn", queries: ["international school teacher"] },
  { label: "E Asia · South Korea",adzunaCountry: "",   jsearchCountry: "kr", queries: ["international school teacher"] },
  { label: "E Asia · Japan",      adzunaCountry: "",   jsearchCountry: "jp", queries: ["international school teacher"] },

  // ---- EUROPE incl. UK (Adzuna + JSearch) ----
  { label: "Europe · UK",         adzunaCountry: "gb", jsearchCountry: "gb", queries: ["physics teacher"] },
  { label: "Europe · Germany",    adzunaCountry: "de", jsearchCountry: "de", queries: ["international school teacher"] },
  { label: "Europe · Spain",      adzunaCountry: "es", jsearchCountry: "es", queries: ["international school teacher"] },
  { label: "Europe · Netherlands",adzunaCountry: "nl", jsearchCountry: "nl", queries: ["international school teacher"] },

  // ---- NORTH AMERICA (Adzuna + JSearch) ----
  { label: "N America · USA",     adzunaCountry: "us", jsearchCountry: "us", queries: ["international school teacher"] },
  { label: "N America · Canada",  adzunaCountry: "ca", jsearchCountry: "ca", queries: ["international school teacher"] },

  // ---- AUSTRALIA / NZ (Adzuna + JSearch) ----
  { label: "Aus/NZ · Australia",  adzunaCountry: "au", jsearchCountry: "au", queries: ["international school teacher"] },
  { label: "Aus/NZ · New Zealand",adzunaCountry: "nz", jsearchCountry: "nz", queries: ["international school teacher"] },

  // ---- AFRICA (non-Nigeria) (JSearch; Adzuna has South Africa) ----
  { label: "Africa · South Africa", adzunaCountry: "za", jsearchCountry: "za", queries: ["international school teacher"] },
  { label: "Africa · Kenya",        adzunaCountry: "",   jsearchCountry: "ke", queries: ["international school teacher"] },
  { label: "Africa · Egypt",        adzunaCountry: "",   jsearchCountry: "eg", queries: ["international school teacher"] },
];

// Freshness ceiling from your spec.
export const FRESHNESS_DAYS = 14;

// Modest cap per query during testing.
export const RESULTS_PER_QUERY = 20;
