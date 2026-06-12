// CLI: match one teacher against candidate jobs and print the results.
// Usage: npx tsx src/scripts/match-teacher.ts <teacherId>
import { matchTeacher } from "../services/matching/service.js";
import { getMatchesForTeacher } from "../models/matches.js";
import { query, closePool } from "../db/pool.js";

async function main() {
  const teacherId = process.argv[2];
  if (!teacherId) {
    console.error("Usage: npx tsx src/scripts/match-teacher.ts <teacherId>");
    process.exit(1);
  }

  console.log(`Matching teacher ${teacherId} ...`);
  const t0 = Date.now();
  const res = await matchTeacher(teacherId);
  const secs = ((Date.now() - t0) / 1000).toFixed(1);

  console.log(`\nMatched ${res.matched}/${res.candidates} candidate jobs ` +
    `(${res.relevant} relevant, ${res.errors} errors) in ${secs}s`);

  // Show the top relevant matches, grouped by tier.
  const matches = await getMatchesForTeacher(teacherId, 40); // hide low/irrelevant
  console.log(`\nTop matches (score >= 40), best first:\n`);
  for (const m of matches.slice(0, 15)) {
    const job = await query<{ title: string; school_name: string; region: string }>(
      "SELECT title, school_name, region FROM jobs WHERE id = $1", [m.jobId]);
    const j = job[0];
    console.log(`  [${m.tier}] ${m.score}%  ${j?.title} — ${j?.school_name ?? "?"} (${j?.region})`);
    if (m.reasoning) console.log(`           ${m.reasoning}`);
    if (m.gaps.length) console.log(`           gaps: ${m.gaps.map((g: { requirement: string; status: string }) => `${g.requirement} (${g.status})`).join("; ")}`);
  }

  await closePool();
}

main().catch(async (err) => {
  console.error("Matching failed:", err);
  await closePool();
  process.exit(1);
});
