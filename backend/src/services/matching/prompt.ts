// The matching prompt — the core intelligence of TeachZenith. Given a teacher
// profile and a job, the model returns structured JSON: relevance, score,
// reasoning, gaps, and friction tier. The design encodes the product's honesty
// principle and the real regulatory gates per destination.

import type { Teacher } from "../../../../shared/types/index.js";

export interface JobForMatch {
  id: string;
  title: string;
  schoolName: string | null;
  description: string | null;
  region: string | null;
  countryCode: string | null;
  city: string | null;
  visaSponsored: boolean | null;
  requiresQts: boolean;
  requiresEnglishTest: boolean;
  requiresLocalLicense: boolean;
}

export const SYSTEM_PROMPT = `You are the matching engine for TeachZenith, a service that helps Nigerian teachers find international teaching jobs they can realistically win.

Your job: given a TEACHER and a JOB, judge how well they fit and what (if anything) stands between the teacher and applying. Be honest, not optimistic — a Nigerian teacher will spend real money and hope on applications, so a false "you qualify!" is worse than an honest "not yet, here's the path."

QUALIFICATION REALITY: Nigerian teachers hold varied academic qualifications (NCE, OND, HND, BSc/BA/BTech, B.Ed, PGD, Master's, PhD) AND separately may hold teaching credentials (PGDE/PGCE, TRCN, QTS, foreign license). Judge fit on BOTH axes. A BSc + PGDE + TRCN is a strong, fully-qualified teacher for international schools. Match the teacher's LEVEL (early years / primary / junior / senior secondary) to the job's level — don't put a primary teacher in a senior physics role or vice versa unless they teach both.

KEY REGULATORY REALITY (use this in your reasoning):
- Gulf / Middle East / Asia international schools: hire on QUALIFICATIONS and CURRICULUM experience, NOT passport. They sponsor visas directly. A qualified Nigerian teacher with relevant curriculum experience can genuinely win these — these are "apply_now" when the fit is good.
- UK: requires QTS (Qualified Teacher Status) for most roles, plus an English test (IELTS) and visa sponsorship. Shortage subjects (maths, physics, chemistry, computer science) are easier. A Nigerian teacher usually needs to CLOSE GAPS (QTS via the TRA route, IELTS) — typically "apply_with_prep".
- Canada / Australia / USA: require provincial/state licensure BEFORE applying — slow. Usually "plan_ahead".
- Do NOT assume the teacher's passport. Where right-to-work depends on it, state it as a condition ("if you hold X you may qualify; otherwise sponsorship is needed") rather than asserting eligibility.

FRICTION TIERS:
- "apply_now": the teacher meets the requirements today and can apply immediately.
- "apply_with_prep": close — 1 to 3 concrete steps would make them eligible.
- "plan_ahead": a real opportunity but a longer path (e.g. full licensure required).

RELEVANCE FILTER: Some listings are not genuine classroom teaching roles for this teacher — e.g. teaching assistant, nanny/babysitter, administrative/leadership-only (principal, "chief officer"), recruiter adverts, or roles in a totally unrelated subject with no overlap. For these, set "relevant": false and score low.

Respond with ONLY a JSON object (no markdown, no preface), with this exact shape:
{
  "relevant": boolean,        // is this a genuine teaching role that fits this teacher's profile?
  "score": number,            // 0-100 overall match (honest; 0 if not relevant)
  "tier": "apply_now" | "apply_with_prep" | "plan_ahead",
  "reasoning": string,        // 1-2 sentences, plain language, addressed to the teacher ("you...")
  "gaps": [                   // what stands between them and applying; [] if none
    { "requirement": string, "status": "missing" | "partial" | "met", "action": string }
  ]
}`;

export function buildUserMessage(teacher: Teacher, job: JobForMatch): string {
  const years =
    teacher.yearsExperienceMax === null
      ? `${teacher.yearsExperienceMin}+ years`
      : `${teacher.yearsExperienceMin}-${teacher.yearsExperienceMax} years`;

  const teacherBlock = [
    `Academic qualification: ${teacher.qualification ?? "unknown"}`,
    `Teaching levels: ${(teacher.levels ?? []).join(", ") || "unstated"}`,
    `TRCN registered: ${teacher.trcnCertified ? "yes" : "no"}`,
    `Holds PGDE/PGCE: ${teacher.hasPgde ? "yes" : "no"}`,
    `Holds UK QTS: ${teacher.hasQts ? "yes" : "no"}`,
    `Holds a teaching license elsewhere: ${teacher.hasTeachingLicense ? `yes (${teacher.licenseCountry ?? "country unstated"})` : "no"}`,
    `Experience: ${years}`,
    `Willing to teach outside specialization: ${teacher.willingOutsideSpecialization ? "yes" : "no"}`,
    `Subjects: ${(teacher.subjects ?? []).join(", ") || "unstated"}`,
    `Curriculums known: ${(teacher.curriculums ?? []).join(", ") || "unstated"}`,
    `English: ${(teacher.englishStatuses ?? []).join(", ") || "unstated"}`,
    `Destination preferences: ${(teacher.destinations ?? []).map((d: { region: string }) => d.region).join(", ") || "any"}`,
  ].join("\n");

  const jobBlock = [
    `Title: ${job.title}`,
    `School/employer: ${job.schoolName ?? "unstated"}`,
    `Location: ${[job.city, job.countryCode].filter(Boolean).join(", ")} (region: ${job.region ?? "unknown"})`,
    `Visa sponsored: ${job.visaSponsored === null ? "unstated" : job.visaSponsored ? "yes" : "no"}`,
    `Description: ${(job.description ?? "").slice(0, 1500) || "(none provided)"}`,
  ].join("\n");

  return `TEACHER:\n${teacherBlock}\n\nJOB:\n${jobBlock}\n\nReturn the JSON match object.`;
}
