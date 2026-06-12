// Shared enums — mirror the PostgreSQL enum types exactly (db migration 001).
// Used by both backend and frontend so the two never disagree on valid values.

export type QualificationLevel =
  | "ond"
  | "hnd"
  | "nce"
  | "bed"
  | "bachelor_other"
  | "pgd"
  | "masters"
  | "phd";

export type TeachingLevel =
  | "early_years"
  | "primary"
  | "junior_secondary"
  | "senior_secondary";

export type Curriculum =
  | "nigerian"
  | "british_igcse"
  | "ib"
  | "american"
  | "other";

export type EnglishStatus =
  | "ielts"
  | "toefl"
  | "duolingo"
  | "can_take"
  | "native"
  | "unsure";

export type FrictionTier =
  | "apply_now"
  | "apply_with_prep"
  | "plan_ahead";

export type JobStatus =
  | "active"
  | "expired"
  | "filled"
  | "unverified";

export type ApplicationStatus =
  | "saved"
  | "applied"
  | "interviewing"
  | "offer"
  | "rejected"
  | "withdrawn";

export type SourceKind =
  | "aggregator_api"
  | "targeted_site"
  | "partner_feed"
  | "manual";

export type RegionCode =
  | "gulf"
  | "southeast_asia"
  | "east_asia"
  | "europe_uk"
  | "north_america"
  | "australia_nz"
  | "africa_non_nigeria"
  | "anywhere";
