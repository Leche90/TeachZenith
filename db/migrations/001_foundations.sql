-- ============================================================================
-- TeachZenith — Migration 001: Foundations (extensions, enums, helpers)
-- ----------------------------------------------------------------------------
-- Run order: this file FIRST. Everything else depends on the types and the
-- updated_at trigger defined here.
-- ============================================================================

-- --- Extensions ---------------------------------------------------------------
-- pgcrypto gives us gen_random_uuid() for primary keys.
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- pgvector powers semantic matching later (embedding similarity between a
-- teacher profile and a job description). Safe to enable now; we add the
-- actual vector columns in the jobs/teachers migrations.
-- If your Postgres host doesn't have pgvector yet, comment this line and the
-- vector columns; everything else still works.
CREATE EXTENSION IF NOT EXISTS vector;

-- citext lets us store emails case-insensitively (so Ada@x.com == ada@x.com).
CREATE EXTENSION IF NOT EXISTS citext;

-- --- Enumerated types ---------------------------------------------------------
-- Using enums (not free text) keeps data clean and queries fast. Adding a new
-- value later is a one-line ALTER TYPE, so this isn't a lock-in.

-- Highest teaching qualification (mirrors intake Q1).
CREATE TYPE qualification_level AS ENUM (
  'bed_or_education_degree',     -- B.Ed / B.A. or B.Sc. in Education
  'degree_plus_pgde',            -- Degree + PGDE / teaching certificate
  'masters',                     -- Master's in Education or subject
  'degree_no_teaching_qual'      -- Degree, no formal teaching qualification
);

-- Curriculums a teacher knows / a job requires (intake Q4).
CREATE TYPE curriculum AS ENUM (
  'nigerian',                    -- WAEC / NECO
  'british_igcse',               -- British / IGCSE / Cambridge
  'ib',                          -- International Baccalaureate
  'american'
);

-- English-test status (intake Q5).
CREATE TYPE english_test_status AS ENUM (
  'has_score',                   -- already holds IELTS / TOEFL
  'can_take',                    -- willing to sit one
  'unknown'                      -- not sure what it is
);

-- Friction tier — the heart of the product. Lives on a MATCH, because the same
-- job can be a different tier for different teachers.
CREATE TYPE friction_tier AS ENUM (
  'apply_now',                   -- meets requirements today
  'apply_with_prep',             -- close; 1-2 concrete steps
  'plan_ahead'                   -- real but longer certification path
);

-- Lifecycle of a job listing — drives the freshness system.
CREATE TYPE job_status AS ENUM (
  'active',                      -- live and shown to users
  'expired',                     -- past freshness window or delisted
  'filled',                      -- known filled
  'unverified'                   -- ingested but not yet confirmed live
);

-- How a teacher is progressing on a saved/applied role.
CREATE TYPE application_status AS ENUM (
  'saved',
  'applied',
  'interviewing',
  'offer',
  'rejected',
  'withdrawn'
);

-- Where a job came from (sourcing layer from the spec).
CREATE TYPE source_kind AS ENUM (
  'aggregator_api',              -- Adzuna, JSearch
  'targeted_site',               -- specific school / recruiter site
  'partner_feed',                -- affiliate / partnership feed
  'manual'                       -- hand-added (admin)
);

-- --- Shared trigger: keep updated_at current ---------------------------------
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
