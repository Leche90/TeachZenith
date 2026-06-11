-- ============================================================================
-- TeachZenith — Migration 002: Teachers
-- ----------------------------------------------------------------------------
-- The teacher profile is the single source everything matches against (spec 4.1).
-- We split it into:
--   teachers              — the account + the 6-question intake answers
--   teacher_subjects      — many subjects per teacher
--   teacher_curriculums   — many curriculums per teacher
--   teacher_destinations  — preferred destinations (ordering only, per spec)
-- Splitting the many-valued fields into child tables (rather than arrays) keeps
-- matching queries simple and indexable.
-- ============================================================================

CREATE TABLE teachers (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Account basics. Email is optional at first: the spec promises results with
  -- "no sign-up to see results", so a teacher can complete intake anonymously
  -- and attach an email later when they save.
  email                 CITEXT UNIQUE,
  full_name             TEXT,
  phone                 TEXT,

  -- --- Intake answers (the 6 questions) ---
  qualification         qualification_level,           -- Q1
  -- Q2 (subjects) and Q4 (curriculums) are in child tables below.
  years_experience_min  SMALLINT,                      -- Q3 lower bound, e.g. 5
  years_experience_max  SMALLINT,                      -- Q3 upper bound, e.g. 9 (NULL = "10+")
  english_test          english_test_status DEFAULT 'unknown', -- Q5
  english_band          NUMERIC(3,1),                  -- optional IELTS score e.g. 7.5
  -- Q6 (destination prefs) is in a child table below.

  -- Free-form extras we may collect on the fuller profile later.
  headline              TEXT,                          -- e.g. "IGCSE Physics teacher, 7 yrs"
  bio                   TEXT,

  -- Semantic representation of the profile for vector matching (filled later).
  profile_embedding     vector(1536),

  -- Housekeeping.
  completed_intake_at   TIMESTAMPTZ,                   -- when the 6 Qs were finished
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT years_range_valid
    CHECK (years_experience_max IS NULL
           OR years_experience_min IS NULL
           OR years_experience_max >= years_experience_min),
  CONSTRAINT english_band_valid
    CHECK (english_band IS NULL OR (english_band >= 0 AND english_band <= 9))
);

CREATE TRIGGER trg_teachers_updated
  BEFORE UPDATE ON teachers
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE INDEX idx_teachers_qualification ON teachers (qualification);
CREATE INDEX idx_teachers_completed     ON teachers (completed_intake_at);

-- --- Subjects (Q2): many per teacher ----------------------------------------
-- Subjects are a controlled vocabulary kept in its own table so we can match
-- jobs to teachers reliably and add subjects without a schema change.
CREATE TABLE subjects (
  id    SMALLINT PRIMARY KEY,
  slug  TEXT UNIQUE NOT NULL,        -- 'maths', 'physics', 'computer_science'
  label TEXT NOT NULL,              -- 'Maths', 'Computer Science / ICT'
  -- Shortage subjects open more doors (esp. UK) — flag drives tiering hints.
  is_shortage BOOLEAN NOT NULL DEFAULT false
);

CREATE TABLE teacher_subjects (
  teacher_id UUID NOT NULL REFERENCES teachers(id) ON DELETE CASCADE,
  subject_id SMALLINT NOT NULL REFERENCES subjects(id) ON DELETE RESTRICT,
  PRIMARY KEY (teacher_id, subject_id)
);

CREATE INDEX idx_teacher_subjects_subject ON teacher_subjects (subject_id);

-- --- Curriculums (Q4): many per teacher -------------------------------------
CREATE TABLE teacher_curriculums (
  teacher_id  UUID NOT NULL REFERENCES teachers(id) ON DELETE CASCADE,
  curriculum  curriculum NOT NULL,
  PRIMARY KEY (teacher_id, curriculum)
);

-- --- Destination preferences (Q6): ordering only ----------------------------
-- Per spec, prefs only ORDER results — every qualifying role still shows.
CREATE TABLE teacher_destinations (
  teacher_id   UUID NOT NULL REFERENCES teachers(id) ON DELETE CASCADE,
  region_code  TEXT NOT NULL,        -- 'gulf','asia','uk','canada_australia','any'
  rank         SMALLINT NOT NULL DEFAULT 1,
  PRIMARY KEY (teacher_id, region_code)
);
