// Shared enums — mirror the PostgreSQL enum types exactly (db migration 001).
// Used by both backend and frontend so the two never disagree on valid values.

export type QualificationLevel =
  | "bed_or_education_degree"
  | "degree_plus_pgde"
  | "masters"
  | "degree_no_teaching_qual";

export type Curriculum =
  | "nigerian"
  | "british_igcse"
  | "ib"
  | "american";

export type EnglishTestStatus =
  | "has_score"
  | "can_take"
  | "unknown";

// The friction tier — the heart of the product. Lives on a match.
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
