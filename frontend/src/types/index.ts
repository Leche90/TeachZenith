// Types mirroring the backend API responses the frontend consumes.

export type FrictionTier = "apply_now" | "apply_with_prep" | "plan_ahead";

export interface IntakePayload {
  levels: string[];
  subjectIds: number[];
  qualification: string;
  trcnCertified: boolean | null;
  hasPgde: boolean | null;
  hasQts: boolean | null;
  hasTeachingLicense: boolean | null;
  licenseCountry: string | null;
  yearsExperienceMin: number;
  yearsExperienceMax: number | null;
  willingOutsideSpecialization: boolean | null;
  curriculums: string[];
  englishStatuses: string[];
  destinations: string[];
  fullName?: string | null;
  email?: string | null;
}

export interface Teacher {
  id: string;
  fullName: string | null;
}

export interface MatchGap {
  requirement: string;
  status: "missing" | "partial" | "met";
  action: string;
}

export interface EnrichedMatch {
  matchId: string;
  jobId: string;
  score: number;
  tier: FrictionTier;
  reasoning: string | null;
  gaps: MatchGap[];
  job: {
    title: string;
    schoolName: string | null;
    region: string | null;
    countryCode: string | null;
    city: string | null;
    applyUrl: string | null;
    careersUrl: string | null;
    careersName: string | null;
    visaSponsored: boolean | null;
  };
}

export interface GroupedMatches {
  apply_now: EnrichedMatch[];
  apply_with_prep: EnrichedMatch[];
  plan_ahead: EnrichedMatch[];
  counts: { apply_now: number; apply_with_prep: number; plan_ahead: number; total: number };
}
