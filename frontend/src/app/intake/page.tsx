"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Chip, YesNo, PrimaryButton } from "@/components/ui";
import { SUBJECTS, LEVELS, QUALS, EXPERIENCE, CURRICULA, ENGLISH, REGIONS } from "@/lib/constants";
import { createTeacher, runMatch } from "@/lib/api";
import type { IntakePayload } from "@/types";

interface Answers {
  levels: string[]; subjects: number[]; qual: string;
  trcn: boolean | null; pgde: boolean | null; qts: boolean | null; license: boolean | null;
  exp: [number, number | null] | null; outside: boolean | null;
  curric: string[]; english: string[]; regions: string[];
}

const initial: Answers = { levels: [], subjects: [], qual: "", trcn: null, pgde: null, qts: null, license: null, exp: null, outside: null, curric: [], english: [], regions: [] };

export default function IntakePage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [a, setA] = useState<Answers>(initial);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggle = <K extends keyof Answers>(key: K, val: (Answers[K] extends (infer U)[] ? U : never)) =>
    setA((p) => {
      const arr = p[key] as unknown[];
      const next = arr.includes(val) ? arr.filter((x) => x !== val) : [...arr, val];
      return { ...p, [key]: next };
    });

  const primaryOnly = a.levels.length > 0 && a.levels.every((l) => l === "primary" || l === "early_years");

  const steps = [
    { title: "What level do you teach?", hint: "Select all that apply. We show the equivalent names across systems.", ok: a.levels.length > 0,
      body: (
        <div className="flex flex-col gap-2.5">
          {LEVELS.map((l) => {
            const on = a.levels.includes(l.value);
            return (
              <button key={l.value} onClick={() => toggle("levels", l.value)}
                className={`rounded-2xl border p-4 text-left transition active:scale-[.98] ${on ? "border-emerald bg-emerald text-ivory shadow" : "border-line bg-white shadow-sm"}`}>
                <div className="text-[15px] font-bold">{l.label}</div>
                <div className={`mt-0.5 text-xs ${on ? "text-[#C7D6CF]" : "text-muted"}`}>{l.sub}</div>
              </button>
            );
          })}
        </div>
      ) },
    { title: "Which subjects do you teach?", hint: primaryOnly ? "Optional for primary — skip if you teach all subjects." : "Select all that apply.", ok: true,
      body: <div className="flex flex-wrap gap-2.5">{SUBJECTS.map((s) => <Chip key={s.id} on={a.subjects.includes(s.id)} onClick={() => toggle("subjects", s.id)}>{s.label}</Chip>)}</div> },
    { title: "Your highest academic qualification?", hint: "Choose one, then tell us your teaching credentials.", ok: !!a.qual,
      body: (
        <div className="flex flex-col gap-2">
          {QUALS.map((q) => <Chip key={q.value} on={a.qual === q.value} onClick={() => setA((p) => ({ ...p, qual: q.value }))}>{q.label}</Chip>)}
          <div className="my-2 h-px bg-line" />
          <div className="text-[12.5px] text-muted">Teaching credentials:</div>
          <CredRow label="TRCN registered?" v={a.trcn} set={(x) => setA((p) => ({ ...p, trcn: x }))} />
          <CredRow label="Hold a PGDE / PGCE?" v={a.pgde} set={(x) => setA((p) => ({ ...p, pgde: x }))} />
          <CredRow label="Hold UK QTS?" v={a.qts} set={(x) => setA((p) => ({ ...p, qts: x }))} />
          <CredRow label="License in another country?" v={a.license} set={(x) => setA((p) => ({ ...p, license: x }))} />
        </div>
      ) },
    { title: "Years of full-time experience?", hint: "Choose one.", ok: !!a.exp,
      body: <div className="flex flex-wrap gap-2.5">{EXPERIENCE.map((e) => <Chip key={e.label} on={a.exp?.[0] === e.value[0]} onClick={() => setA((p) => ({ ...p, exp: e.value }))}>{e.label}</Chip>)}</div> },
    { title: "Willing to teach outside your specialization?", hint: "", ok: a.outside !== null,
      body: <YesNo big value={a.outside} onChange={(x) => setA((p) => ({ ...p, outside: x }))} /> },
    { title: "Which curricula are you familiar with?", hint: "Select all that apply.", ok: a.curric.length > 0,
      body: <div className="flex flex-wrap gap-2.5">{CURRICULA.map((c) => <Chip key={c.value} on={a.curric.includes(c.value)} onClick={() => toggle("curric", c.value)}>{c.label}</Chip>)}</div> },
    { title: "Your English proficiency status?", hint: "Select all that apply.", ok: a.english.length > 0,
      body: <div className="flex flex-wrap gap-2.5">{ENGLISH.map((e) => <Chip key={e.value} on={a.english.includes(e.value)} onClick={() => toggle("english", e.value)}>{e.label}</Chip>)}</div> },
    { title: "Where would you like to teach?", hint: "Select all that apply.", ok: a.regions.length > 0,
      body: <div className="flex flex-wrap gap-2.5">{REGIONS.map((r) => <Chip key={r.value} on={a.regions.includes(r.value)} onClick={() => toggle("regions", r.value)}>{r.label}</Chip>)}</div> },
  ];

  const cur = steps[step];
  const last = step === steps.length - 1;

  async function submit() {
    setSubmitting(true);
    setError(null);
    try {
      const payload: IntakePayload = {
        levels: a.levels,
        subjectIds: a.subjects,
        qualification: a.qual,
        trcnCertified: a.trcn,
        hasPgde: a.pgde,
        hasQts: a.qts,
        hasTeachingLicense: a.license,
        licenseCountry: null,
        yearsExperienceMin: a.exp ? a.exp[0] : 0,
        yearsExperienceMax: a.exp ? a.exp[1] : null,
        willingOutsideSpecialization: a.outside,
        curriculums: a.curric,
        englishStatuses: a.english,
        destinations: a.regions,
      };
      const teacher = await createTeacher(payload);
      router.push(`/results/${teacher.id}?matching=1`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong. Please try again.");
      setSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col px-6 pb-7 pt-5">
      <div className="mb-6 flex items-center gap-3">
        <button onClick={() => (step === 0 ? router.push("/") : setStep(step - 1))} className="text-2xl text-muted">←</button>
        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-ivory-deep">
          <div className="h-full rounded-full bg-brass transition-[width] duration-300" style={{ width: `${((step + 1) / steps.length) * 100}%` }} />
        </div>
        <span className="text-[13px] font-semibold text-muted">{step + 1}/{steps.length}</span>
      </div>

      <div key={step} className="flex flex-1 flex-col animate-fade-up">
        <h2 className="font-display text-[25px] font-semibold leading-tight">{cur.title}</h2>
        {cur.hint && <p className="mb-5 mt-1.5 text-[13.5px] text-muted">{cur.hint}</p>}
        <div className="flex-1">{cur.body}</div>
      </div>

      {error && <p className="mb-3 mt-2 text-sm text-copper">{error}</p>}
      <div className="mt-5">
        <PrimaryButton disabled={!cur.ok || submitting} onClick={() => (last ? submit() : setStep(step + 1))}>
          {submitting ? "Creating your profile…" : last ? "Find my matches" : "Continue"}
        </PrimaryButton>
      </div>
    </div>
  );
}

function CredRow({ label, v, set }: { label: string; v: boolean | null; set: (x: boolean) => void }) {
  return (
    <div className="flex items-center justify-between gap-2.5 py-0.5">
      <span className="text-sm font-medium">{label}</span>
      <YesNo value={v} onChange={set} />
    </div>
  );
}
