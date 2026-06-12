-- ============================================================================
-- TeachZenith — Migration 001: Foundations (extensions, enums, helpers)
-- ----------------------------------------------------------------------------
-- Run order: this file FIRST. Everything else depends on the types and the
-- updated_at trigger defined here. REVISED for the agreed 7-question intake.
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS citext;

-- Q2 — highest ACADEMIC qualification (single-select). Broadened to reflect the
-- real credential landscape of Nigerian teachers (NCE, OND/HND, BSc/BA/BTech,
-- not only education degrees). Teaching qualifications (PGDE/QTS/TRCN/license)
-- are captured SEPARATELY as flags on the teacher.
CREATE TYPE qualification_level AS ENUM (
  'ond',                         -- Ordinary National Diploma
  'hnd',                         -- Higher National Diploma
  'nce',                         -- Nigeria Certificate in Education
  'bed',                         -- Bachelor's in Education
  'bachelor_other',              -- BSc / BA / BTech / B.Eng (non-education)
  'pgd',                         -- Postgraduate Diploma
  'masters',                     -- Master's
  'phd'                          -- PhD / Doctorate
);

-- Teaching level / stage (multi-select). Labels in the UI show the equivalent
-- names across systems (Nigerian / Grades / Key Stage / IB) so teachers
-- recognise their own system while matching aligns to the international one.
CREATE TYPE teaching_level AS ENUM (
  'early_years',                 -- Nursery/KG/Pre-K/EYFS/Foundation (~3-5)
  'primary',                     -- Primary 1-6 / Grades 1-5 / KS1-2 / PYP (~6-11)
  'junior_secondary',            -- JSS / Grades 6-8 / KS3 / MYP (~11-14)
  'senior_secondary'             -- SSS / Grades 9-12 / KS4-5 / IGCSE / A-Level / IB DP (~14-18)
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
