// Calls the model for a single teacher×job pair and returns a parsed match.
// Robust JSON parsing (strips any stray markdown), with a safe fallback so one
// bad response never crashes a batch.

import { getAnthropic, MATCHING_MODEL } from "./client.js";
import { SYSTEM_PROMPT, buildUserMessage, type JobForMatch } from "./prompt.js";
import type { Teacher, FrictionTier, MatchGap } from "../../../../shared/types/index.js";

export interface MatchOutput {
  relevant: boolean;
  score: number;
  tier: FrictionTier;
  reasoning: string;
  gaps: MatchGap[];
}

export async function matchOne(teacher: Teacher, job: JobForMatch): Promise<MatchOutput> {
  const client = getAnthropic();

  const resp = await client.messages.create({
    model: MATCHING_MODEL,
    max_tokens: 600,
    // Cache the long system prompt: it's identical across every match in a
    // teacher's run, so caching it cuts input cost on that portion by ~90%.
    system: [
      {
        type: "text",
        text: SYSTEM_PROMPT,
        cache_control: { type: "ephemeral" },
      },
    ],
    messages: [{ role: "user", content: buildUserMessage(teacher, job) }],
  });

  // Concatenate text blocks.
  const text = resp.content
    .map((b) => (b.type === "text" ? b.text : ""))
    .join("")
    .trim();

  return parseMatch(text);
}

// Parse the model's JSON, tolerating stray markdown fences or prose.
export function parseMatch(text: string): MatchOutput {
  let raw = text.trim();
  // strip ```json ... ``` fences if present
  raw = raw.replace(/^```(?:json)?/i, "").replace(/```$/, "").trim();
  // grab the first {...} block if there's surrounding prose
  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");
  if (start !== -1 && end !== -1) raw = raw.slice(start, end + 1);

  try {
    const obj = JSON.parse(raw) as Partial<MatchOutput>;
    return normalize(obj);
  } catch {
    // Fallback: treat as a non-match rather than crashing the batch.
    return {
      relevant: false,
      score: 0,
      tier: "plan_ahead",
      reasoning: "Could not evaluate this role automatically.",
      gaps: [],
    };
  }
}

function normalize(o: Partial<MatchOutput>): MatchOutput {
  const validTiers: FrictionTier[] = ["apply_now", "apply_with_prep", "plan_ahead"];
  const tier = validTiers.includes(o.tier as FrictionTier) ? (o.tier as FrictionTier) : "plan_ahead";
  let score = typeof o.score === "number" ? Math.round(o.score) : 0;
  score = Math.max(0, Math.min(100, score));
  const relevant = Boolean(o.relevant);
  if (!relevant) score = Math.min(score, 20); // irrelevant roles never score high
  const gaps: MatchGap[] = Array.isArray(o.gaps)
    ? o.gaps.filter((g) => g && typeof g.requirement === "string").map((g) => ({
        requirement: String(g.requirement),
        status: (["missing", "partial", "met"].includes(g.status as string) ? g.status : "missing") as MatchGap["status"],
        action: String(g.action ?? ""),
      }))
    : [];
  return {
    relevant,
    score,
    tier,
    reasoning: typeof o.reasoning === "string" ? o.reasoning : "",
    gaps,
  };
}
