-- ============================================================================
-- TeachZenith — Migration 001: Foundations (extensions, enums, helpers)
-- ----------------------------------------------------------------------------
-- Run order: this file FIRST. Everything else depends on the types and the
-- updated_at trigger defined here. REVISED for the agreed 7-question intake.
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS citext;

-- Q2 — highest teaching qualification (single-select). QTS moved to the
-- teaching-license question; TRCN is a separate boolean on teachers.
CREATE TYPE qualification_level AS ENUM (
  'bed_subject',
  'degree_plus_pgde',
  'masters_education',
  'degree_no_teaching_qual'
);

-- Q5 — curriculums (multi-select). 'other' stored with free text alongside.
CREATE TYPE curriculum AS ENUM (
  'nigerian',
  'british_igcse',
  'ib',
  'american',
  'other'
);

-- Q6 — English proficiency (multi-select, no scores).
CREATE TYPE english_status AS ENUM (
  'ielts',
  'toefl',
  'duolingo',
  'can_take',
  'native',
  'unsure'
);

CREATE TYPE friction_tier AS ENUM (
  'apply_now',
  'apply_with_prep',
  'plan_ahead'
);

CREATE TYPE job_status AS ENUM (
  'active',
  'expired',
  'filled',
  'unverified'
);

CREATE TYPE application_status AS ENUM (
  'saved',
  'applied',
  'interviewing',
  'offer',
  'rejected',
  'withdrawn'
);

CREATE TYPE source_kind AS ENUM (
  'aggregator_api',
  'targeted_site',
  'partner_feed',
  'manual'
);

-- Q7 — geographic regions. One shared vocabulary used by BOTH a teacher's
-- destination preferences and a job's region, so matching compares like-for-like.
CREATE TYPE region_code AS ENUM (
  'gulf',
  'southeast_asia',
  'east_asia',
  'europe_uk',
  'north_america',
  'australia_nz',
  'africa_non_nigeria',
  'anywhere'
);

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
