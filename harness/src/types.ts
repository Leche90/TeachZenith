// Normalized shape so Adzuna and JSearch results can be compared apples-to-apples.
export interface NormalizedJob {
  source: "adzuna" | "jsearch";
  title: string;
  company: string | null;
  location: string | null;
  country: string;        // the target country we queried
  datePosted: Date | null; // best available posting date from the source
  url: string | null;
  descriptionSnippet: string | null;
}

// One target market = a country code plus the search terms we try there.
export interface TargetMarket {
  label: string;          // human-readable, e.g. "UAE"
  adzunaCountry: string;  // Adzuna uses a country code in the URL path, e.g. "gb"
  jsearchCountry: string; // JSearch uses an ISO-ish country code, e.g. "ae"
  queries: string[];      // teaching search phrases to try
}
