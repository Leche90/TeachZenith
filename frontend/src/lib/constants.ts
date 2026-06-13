// Single source of truth for intake options and tier copy. Mirrors the backend
// enums so the two never disagree.

export const SUBJECTS: { id: number; label: string }[] = [
  { id: 1, label: "Mathematics" },
  { id: 2, label: "English Language & Literature" },
  { id: 3, label: "ESL / EAL (English as a Second Language)" },
  { id: 4, label: "Science — General (Physics, Chemistry & Biology)" },
  { id: 5, label: "Physics" },
  { id: 6, label: "Chemistry" },
  { id: 7, label: "Biology" },
  { id: 8, label: "Economics" },
  { id: 9, label: "Business Studies" },
  { id: 10, label: "Accounting" },
  { id: 11, label: "Computer Science / ICT" },
  { id: 12, label: "History" },
  { id: 13, label: "Geography" },
  { id: 14, label: "Humanities / Social Studies" },
  { id: 15, label: "French" },
  { id: 16, label: "Religious Studies (CRS / IRS / RE)" },
  { id: 17, label: "Physical Education (PE)" },
  { id: 18, label: "Art & Design" },
  { id: 19, label: "Music" },
  { id: 20, label: "Drama / Performing Arts" },
  { id: 21, label: "Design & Technology" },
  { id: 22, label: "Special Educational Needs (SEN)" },
  { id: 23, label: "Early Years / Primary (general)" },
];

export const LEVELS: { value: string; label: string; sub: string }[] = [
  { value: "early_years", label: "Early Years", sub: "Nursery / KG / Pre-K / EYFS · ages ~3–5" },
  { value: "primary", label: "Primary / Elementary", sub: "Primary 1–6 / Grades 1–5 / KS1–2 / PYP · ages ~6–11" },
  { value: "junior_secondary", label: "Junior / Middle Secondary", sub: "JSS / Grades 6–8 / KS3 / MYP · ages ~11–14" },
  { value: "senior_secondary", label: "Senior / High School", sub: "SSS / Grades 9–12 / KS4–5 / IGCSE / A-Level / IB · ages ~14–18" },
];

export const QUALS: { value: string; label: string }[] = [
  { value: "nce", label: "NCE (Nigeria Certificate in Education)" },
  { value: "ond", label: "OND (Ordinary National Diploma)" },
  { value: "hnd", label: "HND (Higher National Diploma)" },
  { value: "bed", label: "Bachelor's — B.Ed" },
  { value: "bachelor_other", label: "Bachelor's — BSc / BA / BTech / B.Eng" },
  { value: "pgd", label: "Postgraduate Diploma (PGD)" },
  { value: "masters", label: "Master's" },
  { value: "phd", label: "PhD / Doctorate" },
];

export const EXPERIENCE: { value: [number, number | null]; label: string }[] = [
  { value: [0, 2], label: "Under 2 years" },
  { value: [2, 4], label: "2–4 years" },
  { value: [5, 9], label: "5–9 years" },
  { value: [10, 14], label: "10–14 years" },
  { value: [15, null], label: "15+ years" },
];

export const CURRICULA: { value: string; label: string }[] = [
  { value: "nigerian", label: "Nigerian (WAEC/NECO)" },
  { value: "british_igcse", label: "British / IGCSE / Cambridge" },
  { value: "ib", label: "IB (PYP/MYP/DP)" },
  { value: "american", label: "American" },
];

export const ENGLISH: { value: string; label: string }[] = [
  { value: "ielts", label: "Valid IELTS" },
  { value: "toefl", label: "Valid TOEFL" },
  { value: "duolingo", label: "Valid Duolingo" },
  { value: "can_take", label: "Can take a test within 30 days" },
  { value: "native", label: "Native / educated in English" },
  { value: "unsure", label: "Unsure" },
];

export const REGIONS: { value: string; label: string }[] = [
  { value: "gulf", label: "Gulf (UAE, Qatar, Saudi, Kuwait…)" },
  { value: "southeast_asia", label: "Southeast Asia" },
  { value: "east_asia", label: "East Asia (China, Korea, Japan)" },
  { value: "europe_uk", label: "Europe (incl. UK)" },
  { value: "north_america", label: "North America" },
  { value: "australia_nz", label: "Australia / New Zealand" },
  { value: "africa_non_nigeria", label: "Africa (non-Nigeria)" },
  { value: "anywhere", label: "Anywhere I qualify" },
];

// Tier labels + copy — locked wording.
export const TIERS: Record<string, { label: string; line: string; colorVar: string }> = {
  apply_now: { label: "Ready to Apply", line: "You're a strong fit. Go for these.", colorVar: "text-positive" },
  apply_with_prep: { label: "Close the Gap", line: "A few steps from ready.", colorVar: "text-brass" },
  plan_ahead: { label: "Secure Your Spot", line: "Where will you teach next?", colorVar: "text-copper" },
};
export const TIER_ORDER = ["apply_now", "apply_with_prep", "plan_ahead"] as const;
