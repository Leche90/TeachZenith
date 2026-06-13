"use client";
import { useParams, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { runMatch, getMatches } from "@/lib/api";
import { TIERS, TIER_ORDER } from "@/lib/constants";
import EduBackground from "@/components/ui/EduBackground";
import type { GroupedMatches, EnrichedMatch, FrictionTier } from "@/types";

export default function ResultsPage() {
  const params = useParams<{ teacherId: string }>();
  const search = useSearchParams();
  const teacherId = params.teacherId;
  const [data, setData] = useState<GroupedMatches | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [detail, setDetail] = useState<{ m: EnrichedMatch; tier: FrictionTier } | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        // If we arrived straight from intake, run matching first.
        if (search.get("matching") === "1") await runMatch(teacherId);
        const res = await getMatches(teacherId);
        if (!cancelled) { setData(res); setLoading(false); }
      } catch (e) {
        if (!cancelled) { setError(e instanceof Error ? e.message : "Could not load matches."); setLoading(false); }
      }
    })();
    return () => { cancelled = true; };
  }, [teacherId, search]);

  if (loading) return <Matching />;
  if (error) return <ErrorState message={error} />;
  if (!data || data.counts.total === 0) return <EmptyState />;

  return (
    <div className="flex min-h-screen flex-col animate-fade-in">
      <header className="relative overflow-hidden bg-gradient-to-br from-emerald to-emerald-lift px-6 pb-6 pt-7 text-ivory md:px-14 md:pb-8 md:pt-10 lg:px-20">
        <div className="mx-auto max-w-6xl">
          <div className="text-xs font-semibold uppercase tracking-[1.5px] text-brass">Your matches</div>
          <h1 className="mt-1.5 font-display text-[27px] font-semibold leading-tight md:text-4xl">{data.counts.total} roles fit your profile</h1>
          <p className="mt-2 text-[14.5px] text-[#C7D6CF] md:text-base">Grouped by how ready you are to apply.</p>
        </div>
      </header>

      {/* On xl screens with a selected job, split into list + detail panes. */}
      <div className={`mx-auto w-full max-w-6xl flex-1 px-4 pb-8 pt-1.5 md:px-10 lg:px-16 ${detail ? "xl:grid xl:grid-cols-[1fr_minmax(380px,440px)] xl:gap-8 xl:items-start" : ""}`}>
        <div>
          {TIER_ORDER.map((tier) => {
            const list = data[tier];
            if (!list.length) return null;
            const T = TIERS[tier];
            return (
              <section key={tier} className="mt-6 first:mt-3">
                <div className="flex items-center gap-2.5">
                  <span className={`h-2.5 w-2.5 rounded-[3px] ${tier === "apply_now" ? "bg-positive" : tier === "apply_with_prep" ? "bg-brass" : "bg-copper"}`} />
                  <h3 className="font-display text-[19px] font-semibold md:text-xl">{T.label}</h3>
                  <span className="text-[13px] font-semibold text-muted">{list.length}</span>
                </div>
                <p className="ml-5 mb-3.5 text-[13.5px] text-muted">{T.line}</p>
                {/* Responsive card grid: 1 col mobile, 2 on md, 3 on lg (or 2 when detail pane open) */}
                <div className={`grid grid-cols-1 gap-3 sm:grid-cols-2 ${detail ? "xl:grid-cols-1" : "lg:grid-cols-3"}`}>
                  {list.map((m, i) => (
                    <MatchCard key={m.matchId} m={m} tier={tier} index={i} active={detail?.m.matchId === m.matchId} onClick={() => setDetail({ m, tier })} />
                  ))}
                </div>
              </section>
            );
          })}
          <p className="mt-7 text-center text-[12.5px] leading-relaxed text-muted">
            We never charge you. We never promise a job.<br />Every listing is checked for freshness.
          </p>
        </div>

        {/* Detail: side pane on xl, full overlay on smaller screens */}
        {detail && (
          <>
            <div className="hidden xl:block xl:sticky xl:top-6">
              <DetailPanel m={detail.m} tier={detail.tier} back={() => setDetail(null)} />
            </div>
            <div className="fixed inset-0 z-30 overflow-auto bg-ivory xl:hidden">
              <Detail m={detail.m} tier={detail.tier} back={() => setDetail(null)} />
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function MatchCard({ m, tier, index, active, onClick }: { m: EnrichedMatch; tier: FrictionTier; index: number; active?: boolean; onClick: () => void }) {
  const edge = tier === "apply_now" ? "border-l-positive" : tier === "apply_with_prep" ? "border-l-brass" : "border-l-copper";
  const scoreColor = tier === "apply_now" ? "text-positive" : tier === "apply_with_prep" ? "text-brass" : "text-copper";
  return (
    <button onClick={onClick} style={{ animationDelay: `${index * 0.06}s` }}
      className={`flex h-full animate-fade-up flex-col rounded-2xl border-l-4 bg-white p-4 text-left shadow transition hover:-translate-y-0.5 hover:shadow-lg ${edge} ${active ? "ring-2 ring-emerald" : ""}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="text-[15px] font-bold leading-snug">{m.job.title}</div>
        <div className={`whitespace-nowrap text-[17px] font-extrabold ${scoreColor}`}>{m.score}<span className="text-[11px] font-semibold">%</span></div>
      </div>
      <div className="mt-1 text-[13px] text-muted">{m.job.schoolName} · {m.job.city}, {m.job.countryCode?.toUpperCase()}</div>
    </button>
  );
}

// Shared inner content for both the full-screen detail (mobile) and the side
// pane (desktop).
function DetailContent({ m, tier, back, rounded }: { m: EnrichedMatch; tier: FrictionTier; back: () => void; rounded?: boolean }) {
  const T = TIERS[tier];
  const scoreColor = tier === "apply_now" ? "text-positive" : tier === "apply_with_prep" ? "text-brass" : "text-copper";
  return (
    <>
      <header className={`bg-gradient-to-br from-emerald to-emerald-lift px-5 pb-6 pt-4 text-ivory ${rounded ? "rounded-t-3xl" : ""}`}>
        <button onClick={back} className="mb-4 text-[14.5px] text-[#C7D6CF] transition hover:text-ivory">← {rounded ? "Close" : "All matches"}</button>
        <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5">
          <span className={`h-2 w-2 rounded-sm ${tier === "apply_now" ? "bg-positive" : tier === "apply_with_prep" ? "bg-brass" : "bg-copper"}`} />
          <span className="text-[12.5px] font-semibold">{T.label}</span>
        </div>
        <h1 className="font-display text-[23px] font-semibold leading-tight">{m.job.title}</h1>
        <div className="mt-1.5 text-[14.5px] text-[#C7D6CF]">{m.job.schoolName} · {m.job.city}, {m.job.countryCode?.toUpperCase()}</div>
      </header>

      <div className={`px-5 pb-7 pt-5 ${rounded ? "" : "flex-1 overflow-auto"}`}>
        <div className="mb-4 flex items-baseline gap-2.5">
          <span className={`font-display text-[40px] font-semibold ${scoreColor}`}>{m.score}%</span>
          <span className="text-sm text-muted">match with your profile</span>
        </div>
        {m.reasoning && <p className="mb-6 text-[15.5px] leading-relaxed">{m.reasoning}</p>}

        {m.gaps.length > 0 && (
          <>
            <h3 className="mb-3 font-display text-[17px] font-semibold">What it takes</h3>
            <div className="mb-6 flex flex-col gap-3">
              {m.gaps.map((g, i) => (
                <div key={i} className="rounded-2xl bg-white p-3.5 shadow-sm">
                  <div className="mb-1.5 flex items-center gap-2">
                    <span className={`text-[11px] font-bold uppercase tracking-wide ${g.status === "met" ? "text-positive" : g.status === "partial" ? "text-brass" : "text-copper"}`}>
                      {g.status === "met" ? "✓ Met" : g.status === "partial" ? "Partial" : "Needed"}
                    </span>
                    <span className="text-[14.5px] font-bold">{g.requirement}</span>
                  </div>
                  <p className="text-[13.5px] leading-relaxed text-muted">{g.action}</p>
                </div>
              ))}
            </div>
          </>
        )}

        <div className="mb-4 flex items-center gap-1.5 text-[12.5px] font-semibold text-positive">
          <span>●</span> Verified live recently
        </div>
        {m.job.careersUrl ? (
          <>
            <a href={m.job.careersUrl} target="_blank" rel="noopener noreferrer"
              className="block w-full rounded-2xl bg-brass py-4 text-center text-base font-bold text-emerald shadow-lg transition hover:brightness-105 active:scale-[.98]">
              View careers at {m.job.careersName} →
            </a>
            {m.job.applyUrl && (
              <a href={m.job.applyUrl} target="_blank" rel="noopener noreferrer"
                className="mt-2 block text-center text-[12.5px] text-muted underline transition hover:text-ink">
                See the original listing
              </a>
            )}
          </>
        ) : m.job.applyUrl ? (
          <a href={m.job.applyUrl} target="_blank" rel="noopener noreferrer"
            className="block w-full rounded-2xl bg-brass py-4 text-center text-base font-bold text-emerald shadow-lg transition hover:brightness-105 active:scale-[.98]">
            Apply now →
          </a>
        ) : (
          <div className="rounded-2xl bg-ivory-deep py-4 text-center text-sm text-muted">Application link unavailable</div>
        )}
        <button className="mt-2.5 w-full rounded-2xl border border-line py-3.5 text-[15px] font-semibold transition active:scale-[.98]">Save for later</button>
      </div>
    </>
  );
}

// Full-screen detail (mobile overlay).
function Detail({ m, tier, back }: { m: EnrichedMatch; tier: FrictionTier; back: () => void }) {
  return (
    <div className="flex min-h-screen flex-col animate-fade-in">
      <DetailContent m={m} tier={tier} back={back} />
    </div>
  );
}

// Card-framed detail (desktop side pane).
function DetailPanel({ m, tier, back }: { m: EnrichedMatch; tier: FrictionTier; back: () => void }) {
  return (
    <div className="animate-fade-in overflow-hidden rounded-3xl bg-ivory shadow-lg">
      <DetailContent m={m} tier={tier} back={back} rounded />
    </div>
  );
}


function Matching() {
  const msgs = ["Reading your profile…", "Checking live jobs…", "Working out what each one takes…"];
  const [i, setI] = useState(0);
  useEffect(() => { const t = setInterval(() => setI((p) => (p + 1) % msgs.length), 1100); return () => clearInterval(t); }, []);
  return (
    <div className="tz-emerald-bg flex min-h-screen flex-col items-center justify-center px-8 text-center text-ivory">
      <EduBackground />
      <div className="relative z-10 mb-7 h-14 w-14 animate-spin rounded-full border-[3px] border-brass/25 border-t-brass" />
      <h2 className="relative z-10 mb-2.5 font-display text-2xl font-semibold">Finding your matches…</h2>
      <p className="relative z-10 min-h-[22px] animate-pulse-soft text-[15px] text-[#C7D6CF]">{msgs[i]}</p>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-8 text-center">
      <h2 className="font-display text-2xl font-semibold">No strong matches yet</h2>
      <p className="mt-3 text-[15px] leading-relaxed text-muted">
        We couldn&apos;t find roles that fit your profile right now. New jobs arrive regularly — check back soon, or broaden your destinations.
      </p>
    </div>
  );
}

function ErrorState({ message }: { message: string }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-8 text-center">
      <h2 className="font-display text-2xl font-semibold">Something went wrong</h2>
      <p className="mt-3 text-[15px] leading-relaxed text-muted">{message}</p>
    </div>
  );
}
