// Shared entity types — mirror the database tables (db migrations 002-005).
// These are the canonical shapes of TeachZenith's data, imported by backend
// (data access) and frontend (rendering). One definition, both sides.

import type {
  QualificationLevel,
  Curriculum,
  EnglishStatus,
  TeachingLevel,
  FrictionTier,
  JobStatus,
  ApplicationStatus,
  SourceKind,
  RegionCode,
} from "./enums.js";

// --- Teacher (intake profile) ------------------------------------------------
export interface Teacher {
  id: string;
  email: string | null;
  fullName: string | null;
  phone: string | null;
  qualification: QualificationLevel | null;
  trcnCertified: boolean | null;
  hasPgde: boolean | null;
  hasQts: boolean | null;
  hasTeachingLicense: boolean | null;
  licenseCountry: string | null;
  yearsExperienceMin: number | null;
  yearsExperienceMax: number | null;   // null = open-ended "15+"
  willingOutsideSpecialization: boolean | null;
  otherSubject: string | null;
  otherCurriculum: string | null;
  headline: string | null;
  bio: string | null;
  completedIntakeAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  // Relations (loaded on demand)
  subjects?: number[];
  curriculums?: Curriculum[];
  englishStatuses?: EnglishStatus[];
  levels?: TeachingLevel[];
  destinations?: TeacherDestination[];
}

export interface TeacherDestination {
  region: RegionCode;
  rank: number;
}

export interface Subject {
  id: number;
  slug: string;
  label: string;
  isShortage: boolean;
}

// --- Source + ingestion ------------------------------------------------------
export interface Source {
  id: string;
  kind: SourceKind;
  name: string;
  slug: string;
  baseUrl: string | null;
  config: Record<string, unknown>;
  tosCheckedAt: Date | null;
  tosAllowsIngest: boolean | null;
  tosNotes: string | null;
  refreshIntervalMinutes: number;
  isEnabled: boolean;
  lastRunAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

// --- Job (with freshness fields) --------------------------------------------
export interface Job {
  id: string;
  sourceId: string;
  externalKey: string;
  title: string;
  schoolName: string | null;
  description: string | null;
  applyUrl: string | null;
  countryCode: string | null;
  region: RegionCode | null;
  city: string | null;
  salaryMin: number | null;
  salaryMax: number | null;
  salaryCurrency: string | null;
  isTaxFree: boolean | null;
  housingProvided: boolean | null;
  flightsProvided: boolean | null;
  visaSponsored: boolean | null;
  requiredCurriculums: Curriculum[];
  minYearsExperience: number | null;
  requiresQts: boolean;
  requiresEnglishTest: boolean;
  requiresLocalLicense: boolean;
  // Freshness system
  postedAt: Date | null;               // source-claimed (untrusted)
  firstSeenAt: Date;                   // when we first saw it (trusted)
  lastVerifiedAt: Date;
  verifyAttempts: number;
  status: JobStatus;
  freshnessScore: number;              // 0..1
  createdAt: Date;
  updatedAt: Date;
}

// --- Match (the AI engine's output) -----------------------------------------
export interface MatchGap {
  requirement: string;                 // e.g. "QTS"
  status: "missing" | "partial" | "met";
  action: string;                      // e.g. "Apply via the TRA route"
}

export interface Match {
  id: string;
  teacherId: string;
  jobId: string;
  score: number;                       // 0..100 (rendered as "92%" in UI)
  tier: FrictionTier;
  reasoning: string | null;
  gaps: MatchGap[];
  modelVersion: string | null;
  scoredAt: Date;
}

// --- Application (tracking) --------------------------------------------------
export interface Application {
  id: string;
  teacherId: string;
  jobId: string;
  status: ApplicationStatus;
  notes: string | null;
  savedAt: Date;
  appliedAt: Date | null;
  lastStatusAt: Date;
  createdAt: Date;
  updatedAt: Date;
}
