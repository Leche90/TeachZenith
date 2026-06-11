-- ============================================================================
-- TeachZenith — Migration 005: Matches & Applications
-- ----------------------------------------------------------------------------
-- matches      — the AI matching ENGINE's output (spec 4.2). A match is a
--                relationship between a teacher and a job, holding the score,
--                the reasoning, the gap analysis, AND the friction tier — the
--                tier lives here, not on the job, because the same job can be
--                'apply_now' for one teacher and 'apply_with_prep' for another.
-- applications — what the teacher SAVES / APPLIES to and tracks (spec 4.6).
-- ============================================================================

CREATE TABLE matches (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id       UUID NOT NULL REFERENCES teachers(id) ON DELETE CASCADE,
  job_id           UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,

  -- The three outputs the AI returns per job (spec 4.2).
  score            SMALLINT NOT NULL,          -- 0..100 match score
  tier             friction_tier NOT NULL,     -- apply_now / with_prep / plan_ahead
  reasoning        TEXT,                        -- plain-language "why it fits"

  -- Gap analysis as structured steps, e.g.
  -- [{"requirement":"QTS","status":"missing","action":"Apply via TRA route"},
  --  {"requirement":"IELTS","status":"missing","action":"Sit IELTS, target 7.0"}]
  -- JSONB so the UI can render the gap checklist and we can query by gap type.
  gaps             JSONB NOT NULL DEFAULT '[]'::jsonb,

  -- Which model/version produced this, so we can re-score when prompts change.
  model_version    TEXT,
  scored_at        TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- One current match per (teacher, job); re-scoring updates in place.
  CONSTRAINT matches_teacher_job_unique UNIQUE (teacher_id, job_id),
  CONSTRAINT score_range_valid CHECK (score BETWEEN 0 AND 100)
);

-- Fetch a teacher's matches, best first, filtered by tier — the results screen.
CREATE INDEX idx_matches_teacher
  ON matches (teacher_id, tier, score DESC);

CREATE INDEX idx_matches_job ON matches (job_id);

-- Query gaps (e.g. "how many teachers are blocked only by IELTS?") for product
-- insight and gap-closing guidance content.
CREATE INDEX idx_matches_gaps ON matches USING gin (gaps);

-- --- Applications ------------------------------------------------------------
CREATE TABLE applications (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id     UUID NOT NULL REFERENCES teachers(id) ON DELETE CASCADE,
  job_id         UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,

  status         application_status NOT NULL DEFAULT 'saved',
  notes          TEXT,                          -- teacher's private notes

  -- Timeline.
  saved_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  applied_at     TIMESTAMPTZ,
  last_status_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- A teacher tracks a given job once.
  CONSTRAINT applications_teacher_job_unique UNIQUE (teacher_id, job_id)
);

CREATE TRIGGER trg_applications_updated
  BEFORE UPDATE ON applications
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE INDEX idx_applications_teacher
  ON applications (teacher_id, status, last_status_at DESC);

-- --- Status history: an audit trail of an application's journey -------------
-- Optional but cheap, and useful for the tracker timeline + analytics.
CREATE TABLE application_events (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  from_status    application_status,
  to_status      application_status NOT NULL,
  changed_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_application_events_app
  ON application_events (application_id, changed_at);
