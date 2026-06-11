-- ============================================================================
-- TeachZenith — Seed: subjects controlled vocabulary
-- ----------------------------------------------------------------------------
-- Mirrors intake Q2. is_shortage flags subjects that open more doors abroad
-- (especially UK Skilled Worker shortage subjects), which the tiering logic
-- uses as a hint. Safe to re-run: ON CONFLICT keeps it idempotent.
-- ============================================================================

INSERT INTO subjects (id, slug, label, is_shortage) VALUES
  (1,  'maths',            'Maths',                       true),
  (2,  'physics',          'Physics',                     true),
  (3,  'chemistry',        'Chemistry',                   true),
  (4,  'biology',          'Biology',                     false),
  (5,  'computer_science', 'Computer Science / ICT',      true),
  (6,  'english',          'English',                     false),
  (7,  'primary_general',  'Primary / general',           false),
  (8,  'geography',        'Geography',                   false),
  (9,  'history',          'History',                     false),
  (10, 'economics',        'Economics',                   false),
  (11, 'french',           'French',                      false),
  (12, 'art',              'Art',                         false),
  (13, 'other',            'Other',                       false)
ON CONFLICT (id) DO UPDATE
  SET slug = EXCLUDED.slug,
      label = EXCLUDED.label,
      is_shortage = EXCLUDED.is_shortage;
