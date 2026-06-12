// Dual-mode freshness — the key finding from the harness.
//
//   date mode   : the source gives a reliable posting date. A job is fresh if
//                 posted within FRESHNESS_DAYS. Score decays linearly across it.
//   verify mode : recruiter/cycle-based roles with NO posting date. We can't
//                 trust a date, so we anchor on first_seen_at (when WE saw it)
//                 and decay over a much longer window. Such a role stays live
//                 until re-verification finds the link dead.
//
// The worker (built later) re-verifies links; this module just computes the
// freshness score and whether a job currently counts as fresh.

import { FRESHNESS_DAYS, VERIFY_MODE_DECAY_DAYS, type FreshnessMode } from "./markets.js";

const DAY_MS = 1000 * 60 * 60 * 24;

export interface FreshnessInput {
  mode: FreshnessMode;
  postedAt: Date | null;
  firstSeenAt: Date;
  now?: Date;
}

export interface FreshnessResult {
  score: number;      // 0.000 .. 1.000
  isFresh: boolean;   // should it be shown?
}

export function computeFreshness(input: FreshnessInput): FreshnessResult {
  const now = input.now ?? new Date();

  if (input.mode === "date") {
    // Anchor on the posting date if we have it, else first_seen_at.
    const anchor = input.postedAt ?? input.firstSeenAt;
    const ageDays = (now.getTime() - anchor.getTime()) / DAY_MS;
    if (ageDays < 0) return { score: 1, isFresh: true }; // future-dated, treat as fresh
    const score = clamp01(1 - ageDays / FRESHNESS_DAYS);
    return { score: round3(score), isFresh: ageDays <= FRESHNESS_DAYS };
  }

  // verify mode: anchor on first_seen_at, decay over the longer window.
  const ageDays = (now.getTime() - input.firstSeenAt.getTime()) / DAY_MS;
  const score = clamp01(1 - ageDays / VERIFY_MODE_DECAY_DAYS);
  // Verify-mode jobs stay "fresh" across the long window; the worker expires
  // them earlier if the link dies. So freshness here is about RANKING, not hiding.
  return { score: round3(score), isFresh: ageDays <= VERIFY_MODE_DECAY_DAYS };
}

function clamp01(n: number): number {
  return Math.max(0, Math.min(1, n));
}
function round3(n: number): number {
  return Math.round(n * 1000) / 1000;
}
