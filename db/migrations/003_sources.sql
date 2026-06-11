-- ============================================================================
-- TeachZenith — Migration 003: Sources & ingestion
-- ----------------------------------------------------------------------------
-- The layered feed from the spec (4.7). 'sources' is the catalogue of where
-- jobs come from; 'ingestion_runs' logs each pull so we can monitor feed
-- health in the admin layer and tune the refresh cadence.
--
-- NOTE: these tables are intentionally flexible because the harness results
-- may change how heavily we lean on each source kind. Adding source-specific
-- config via JSONB avoids a redesign either way.
-- ============================================================================

CREATE TABLE sources (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kind            source_kind NOT NULL,
  name            TEXT NOT NULL,               -- 'Adzuna', 'JSearch', 'Edvectus'
  slug            TEXT UNIQUE NOT NULL,        -- 'adzuna', 'jsearch', 'edvectus'

  -- Where it lives / how we reach it.
  base_url        TEXT,
  -- Per-source settings without schema churn: API host, query templates,
  -- which countries it covers, polite rate limits, etc.
  config          JSONB NOT NULL DEFAULT '{}'::jsonb,

  -- ToS posture — we recorded that we only ingest where terms allow (spec).
  tos_checked_at  TIMESTAMPTZ,
  tos_allows_ingest BOOLEAN,                   -- NULL = not yet reviewed
  tos_notes       TEXT,

  -- Refresh cadence for THIS source, in minutes. Lets us pull aggregators
  -- every ~6h but a cheap targeted site more or less often.
  refresh_interval_minutes INTEGER NOT NULL DEFAULT 360,

  is_enabled      BOOLEAN NOT NULL DEFAULT true,
  last_run_at     TIMESTAMPTZ,

  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER trg_sources_updated
  BEFORE UPDATE ON sources
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE INDEX idx_sources_enabled ON sources (is_enabled) WHERE is_enabled;

-- --- Ingestion run log -------------------------------------------------------
-- One row per pull from a source. Powers the admin "feed health" view and lets
-- us see freshness/volume trends over time.
CREATE TABLE ingestion_runs (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id      UUID NOT NULL REFERENCES sources(id) ON DELETE CASCADE,

  started_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  finished_at    TIMESTAMPTZ,
  ok             BOOLEAN,                      -- did it complete cleanly?

  -- Volume accounting for the run.
  jobs_seen      INTEGER NOT NULL DEFAULT 0,   -- raw results returned
  jobs_inserted  INTEGER NOT NULL DEFAULT 0,   -- new jobs added
  jobs_updated   INTEGER NOT NULL DEFAULT 0,   -- existing jobs refreshed
  jobs_rejected  INTEGER NOT NULL DEFAULT 0,   -- dropped (stale / not teaching)

  api_calls_used INTEGER NOT NULL DEFAULT 0,   -- to track paid-plan budget
  error_message  TEXT
);

CREATE INDEX idx_ingestion_runs_source ON ingestion_runs (source_id, started_at DESC);
