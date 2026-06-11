-- ============================================================================
-- TeachZenith — Seed: subjects vocabulary (Q1). REVISED to match agreed wording.
-- is_shortage flags subjects that open more doors abroad (esp. UK shortage
-- subjects), used as a hint by tiering. Idempotent.
-- ============================================================================

INSERT INTO subjects (id, slug, label, is_shortage) VALUES
  (1,  'mathematics',       'Mathematics',                    true),
  (2,  'physics',           'Physics',                        true),
  (3,  'chemistry',         'Chemistry',                      true),
  (4,  'biology',           'Biology',                        false),
  (5,  'english',           'English Language & Literature',  false),
  (6,  'computer_science',  'Computer Science / ICT',         true),
  (7,  'economics_business','Economics / Business Studies',   false),
  (8,  'primary_general',   'Primary / General Education',    false),
  (9,  'other',             'Other',                          false)
ON CONFLICT (id) DO UPDATE
  SET slug = EXCLUDED.slug,
      label = EXCLUDED.label,
      is_shortage = EXCLUDED.is_shortage;
