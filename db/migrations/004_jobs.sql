-- ============================================================================
-- TeachZenith — Migration 004: Jobs (with the freshness system)
-- ----------------------------------------------------------------------------
-- A normalized teaching vacancy. The freshness columns are first-class here,
-- because "no dead listings" is the core trust promise (spec 4.4):
--   posted_at        — the source's claimed posting date (may be unreliable)
--   first_seen_at    — when WE first ingested it (the date we trust)
--   last_verified_at — last time we confirmed the link/listing is still live
--   status           — active / expired / filled / unverified
-- The 14-day rule is enforced against first_seen_at by the worker, not here,
-- so the window can be tuned without a migration.
-- ============================================================================

CREATE TABLE jobs (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id          UUID NOT NULL REFERENCES sources(id) ON DELETE CASCADE,

  -- Dedupe key: the same vacancy can appear under multiple queries/pages.
  -- We hash (source + external id or apply URL) so re-ingesting updates rather
  -- than duplicates. Unique per source.
  external_key       TEXT NOT NULL,

  -- --- Core listing fields ---
  title              TEXT NOT NULL,
  school_name        TEXT,
  description        TEXT,
  apply_url          TEXT,

  -- --- Location ---
  country_code       TEXT,                 -- ISO-ish: 'ae','qa','sa','gb','sg'
  region_code        TEXT,                 -- our grouping: 'gulf','asia','uk'...
  city               TEXT,

  -- --- Compensation / perks (often what makes Gulf roles attractive) ---
  salary_min         NUMERIC(12,2),
  salary_max         NUMERIC(12,2),
  salary_currency    TEXT,                 -- 'AED','QAR','GBP'...
  is_tax_free        BOOLEAN,
  housing_provided   BOOLEAN,
  flights_provided   BOOLEAN,
  visa_sponsored     BOOLEAN,

  -- --- Requirements (used by matching + tiering) ---
  required_curriculums curriculum[] DEFAULT '{}',   -- e.g. {british_igcse,ib}
  min_years_experience SMALLINT,
  requires_qts        BOOLEAN DEFAULT false,         -- UK gate
  requires_english_test BOOLEAN DEFAULT false,
  requires_local_license BOOLEAN DEFAULT false,      -- Canada/Australia/US gate

  -- Semantic vector of the description for similarity matching (filled later).
  description_embedding vector(1536),

  -- --- Freshness system ---
  posted_at          TIMESTAMPTZ,          -- source-claimed date (untrusted)
  first_seen_at      TIMESTAMPTZ NOT NULL DEFAULT now(),  -- trusted
  last_verified_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  verify_attempts    SMALLINT NOT NULL DEFAULT 0,
  status             job_status NOT NULL DEFAULT 'unverified',

  -- Freshness score (0..1), recomputed by the worker; decays across the window
  -- so fresher roles rank higher without hiding still-live older ones.
  freshness_score    NUMERIC(4,3) NOT NULL DEFAULT 1.000,

  created_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT jobs_external_key_unique UNIQUE (source_id, external_key),
  CONSTRAINT salary_range_valid
    CHECK (salary_max IS NULL OR salary_min IS NULL OR salary_max >= salary_min)
);

CREATE TRIGGER trg_jobs_updated
  BEFORE UPDATE ON jobs
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- --- Indexes for the queries we'll actually run -----------------------------
-- Only ever show live, fresh jobs: this partial index keeps that query fast.
CREATE INDEX idx_jobs_active_fresh
  ON jobs (region_code, first_seen_at DESC)
  WHERE status = 'active';

-- Worker needs to find what to re-verify (oldest verification first).
CREATE INDEX idx_jobs_reverify
  ON jobs (last_verified_at)
  WHERE status IN ('active','unverified');

CREATE INDEX idx_jobs_country     ON jobs (country_code);
CREATE INDEX idx_jobs_source      ON jobs (source_id);

-- Vector similarity index (cosine). Built now so semantic matching is ready;
-- harmless while embeddings are NULL.
CREATE INDEX idx_jobs_embedding
  ON jobs USING ivfflat (description_embedding vector_cosine_ops)
  WITH (lists = 100);

-- Full-text search over title+description for keyword fallback / admin search.
CREATE INDEX idx_jobs_fts
  ON jobs USING gin (to_tsvector('english', coalesce(title,'') || ' ' || coalesce(description,'')));
