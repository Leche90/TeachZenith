import "dotenv/config";
import { TARGET_MARKETS, FRESHNESS_DAYS } from "./markets.js";
import { fetchAdzuna } from "./adzuna.js";
import { fetchJSearch } from "./jsearch.js";
import { daysAgo, isFresh, looksLikeRealTeachingRole } from "./analyze.js";
import type { NormalizedJob } from "./types.js";

function pct(n: number, total: number): string {
  if (total === 0) return "  n/a";
  return `${((n / total) * 100).toFixed(0).padStart(3)}%`;
}

function summarize(label: string, jobs: NormalizedJob[]) {
  const total = jobs.length;
  const fresh = jobs.filter(isFresh).length;
  const real = jobs.filter(looksLikeRealTeachingRole).length;
  const freshAndReal = jobs.filter((j) => isFresh(j) && looksLikeRealTeachingRole(j)).length;
  const withDate = jobs.filter((j) => daysAgo(j.datePosted) !== null).length;

  console.log(`\n  ${label}`);
  console.log(`    total returned ............ ${total}`);
  console.log(`    has a usable date ......... ${withDate}  (${pct(withDate, total)})`);
  console.log(`    fresh (<=${FRESHNESS_DAYS}d) ............. ${fresh}  (${pct(fresh, total)})`);
  console.log(`    looks like real teaching .. ${real}  (${pct(real, total)})`);
  console.log(`    fresh AND real ............ ${freshAndReal}  (${pct(freshAndReal, total)})  <-- the number that matters`);
}

function sampleTitles(jobs: NormalizedJob[], n = 5) {
  const picks = jobs.slice(0, n);
  for (const j of picks) {
    const age = daysAgo(j.datePosted);
    const ageStr = age === null ? "no date" : `${age}d ago`;
    const flag = looksLikeRealTeachingRole(j) ? "OK " : "?? ";
    console.log(`      ${flag}[${ageStr.padStart(7)}] ${j.title}${j.company ? ` — ${j.company}` : ""}`);
  }
}

async function main() {
  console.log("=".repeat(70));
  console.log("TeachZenith — data-source test harness");
  console.log(`Freshness ceiling: ${FRESHNESS_DAYS} days. Markets: ${TARGET_MARKETS.length}.`);
  console.log("=".repeat(70));

  const allAdzuna: NormalizedJob[] = [];
  const allJSearch: NormalizedJob[] = [];

  for (const market of TARGET_MARKETS) {
    console.log(`\n### ${market.label}`);

    const adz = await fetchAdzuna(market);
    const js = await fetchJSearch(market);
    allAdzuna.push(...adz);
    allJSearch.push(...js);

    summarize(`Adzuna  (${adz.length} raw)`, adz);
    if (adz.length) sampleTitles(adz);
    summarize(`JSearch (${js.length} raw)`, js);
    if (js.length) sampleTitles(js);
  }

  console.log("\n" + "=".repeat(70));
  console.log("OVERALL");
  console.log("=".repeat(70));
  summarize("Adzuna — all markets combined", allAdzuna);
  summarize("JSearch — all markets combined", allJSearch);

  // Per-region rollup: total real teaching roles found across BOTH apis, by region.
  console.log("\n" + "=".repeat(70));
  console.log("BY REGION (real teaching roles found, both APIs combined)");
  console.log("=".repeat(70));
  const all = [...allAdzuna, ...allJSearch];
  const byRegion = new Map<string, { total: number; real: number }>();
  for (const j of all) {
    // region = text before " · " in the market label
    const region = j.country.split(" · ")[0] ?? j.country;
    const cur = byRegion.get(region) ?? { total: 0, real: 0 };
    cur.total += 1;
    if (looksLikeRealTeachingRole(j)) cur.real += 1;
    byRegion.set(region, cur);
  }
  for (const [region, c] of byRegion) {
    console.log(`  ${region.padEnd(14)}  ${String(c.real).padStart(3)} real / ${String(c.total).padStart(3)} total`);
  }

  console.log("\nReading this report:");
  console.log("  - 'fresh AND real' is the true signal: live, genuine teaching roles.");
  console.log("  - Adzuna is empty where it has no endpoint (Gulf, most of Asia).");
  console.log("  - Gulf/Asia roles often have NO posting date (recruiter, cycle-based);");
  console.log("    that's why they show 'no date' — they're still real, live roles.");
  console.log("  - '??' flagged samples are where the keyword heuristic is unsure.\n");
}

main().catch((err) => {
  console.error("Harness failed:", err);
  process.exit(1);
});
