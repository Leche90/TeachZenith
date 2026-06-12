-- ============================================================================
-- TeachZenith — Migration 002: Teachers  (REVISED for 7-question intake)
-- ----------------------------------------------------------------------------
-- teachers              account + single-value intake answers
-- teacher_subjects      Q1 (multi)         -> subjects vocabulary
-- teacher_curriculums   Q5 (multi)
-- teacher_english       Q6 (multi, no scores)
-- teacher_destinations  Q7 (multi, ranked) -> region_code enum
-- ============================================================================

CREATE TABLE teachers (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  email                 CITEXT UNIQUE,
  full_name             TEXT,
  phone                 TEXT,

  -- Q2 — highest qualification (single-select)
  qualification         qualification_level,

  -- Q2 add-ons
  trcn_certified        BOOLEAN,            -- TRCN registered? (yes/no)
  has_pgde              BOOLEAN,            -- holds PGDE / PGCE?
  has_qts               BOOLEAN,            -- holds UK Qualified Teacher Status?
  has_teaching_license  BOOLEAN,            -- license/cert in another country?
  license_country       TEXT,              -- if yes, which country

  -- Q3 — experience band (we store the numeric range; max NULL = open-ended "15+")
  years_experience_min  SMALLINT,
  years_experience_max  SMALLINT,

  -- Q4 — willing to teach outside subject specialization?
  willing_outside_specialization BOOLEAN,

  -- Q1 / Q5 "Other (specify)" free text — stored, low-signal for matching
  other_subject         TEXT,
  other_curriculum      TEXT,

  -- Profile extras (fuller profile later)
  headline              TEXT,
  bio                   TEXT,
  profile_embedding     vector(1536),

  completed_intake_at   TIMESTAMPTZ,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT years_range_valid
    CHECK (years_experience_max IS NULL
           OR years_experience_min IS NULL
           OR years_experience_max >= years_experience_min)
);

CREATE TRIGGER trg_teachers_updated
  BEFORE UPDATE ON teachers
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE INDEX idx_teachers_qualification ON teachers (qualification);
CREATE INDEX idx_teachers_completed     ON teachers (completed_intake_at);

-- --- Subjects vocabulary (Q1) ------------------------------------------------
CREATE TABLE subjects (
  id    SMALLINT PRIMARY KEY,
  slug  TEXT UNIQUE NOT NULL,
  label TEXT NOT NULL,
  is_shortage BOOLEAN NOT NULL DEFAULT false
);

CREATE TABLE teacher_subjects (
  teacher_id UUID NOT NULL REFERENCES teachers(id) ON DELETE CASCADE,
  subject_id SMALLINT NOT NULL REFERENCES subjects(id) ON DELETE RESTRICT,
  PRIMARY KEY (teacher_id, subject_id)
);
CREATE INDEX idx_teacher_subjects_subject ON teacher_subjects (subject_id);

-- --- Curriculums (Q5) --------------------------------------------------------
CREATE TABLE teacher_curriculums (
  teacher_id  UUID NOT NULL REFERENCES teachers(id) ON DELETE CASCADE,
  curriculum  curriculum NOT NULL,
  PRIMARY KEY (teacher_id, curriculum)
);

-- --- English proficiency statuses (Q6, multi-select, no scores) --------------
CREATE TABLE teacher_english (
  teacher_id UUID NOT NULL REFERENCES teachers(id) ON DELETE CASCADE,
  status     english_status NOT NULL,
  PRIMARY KEY (teacher_id, status)
);

-- --- Teaching levels (multi-select): early_years / primary / junior / senior --
CREATE TABLE teacher_levels (
  teacher_id UUID NOT NULL REFERENCES teachers(id) ON DELETE CASCADE,
  level      teaching_level NOT NULL,
  PRIMARY KEY (teacher_id, level)
);

-- --- Destination preferences (Q7, ranked) ------------------------------------
CREATE TABLE teacher_destinations (
  teacher_id   UUID NOT NULL REFERENCES teachers(id) ON DELETE CASCADE,
  region       region_code NOT NULL,
  rank         SMALLINT NOT NULL DEFAULT 1,
  PRIMARY KEY (teacher_id, region)
);
