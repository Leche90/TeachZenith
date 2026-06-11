import type { NormalizedJob } from "./types.js";
import { FRESHNESS_DAYS } from "./markets.js";

export function daysAgo(date: Date | null): number | null {
  if (!date || isNaN(date.getTime())) return null;
  const ms = Date.now() - date.getTime();
  return Math.floor(ms / (1000 * 60 * 60 * 24));
}

export function isFresh(job: NormalizedJob): boolean {
  const d = daysAgo(job.datePosted);
  return d !== null && d >= 0 && d <= FRESHNESS_DAYS;
}

// Crude first-pass relevance scoring. This is NOT the real AI matcher — it's a cheap
// heuristic so we can eyeball, in this test, how much of each feed is a genuine
// classroom teaching role versus noise (tutoring ads, EdTech sales, TA gigs, etc.).
// The real product replaces this with an LLM classifier.
const POSITIVE = [
  "teacher", "teaching", "educator", "faculty", "lecturer",
  "ib ", "igcse", "curriculum", "international school", "primary", "secondary",
  "mathematics", "maths", "physics", "chemistry", "biology", "english",
];
const NEGATIVE = [
  "sales", "recruiter", "assistant", "intern", "volunteer",
  "tutor app", "edtech sales", "account manager", "business development",
  "babysitter", "nanny", "teaching assistant",
];

export function looksLikeRealTeachingRole(job: NormalizedJob): boolean {
  const hay = `${job.title} ${job.descriptionSnippet ?? ""}`.toLowerCase();
  const pos = POSITIVE.some((k) => hay.includes(k));
  const neg = NEGATIVE.some((k) => hay.includes(k));
  return pos && !neg;
}
