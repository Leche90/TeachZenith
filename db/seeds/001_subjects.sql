-- ============================================================================
-- TeachZenith — Seed: subjects vocabulary (Q1).
-- REVISED to align with the subject names international recruiters actually
-- advertise (verified against ingested job data), not just Nigerian/WAEC names.
-- Clarifying examples in labels help teachers self-identify. "Other" catches
-- the long tail (incl. Nigerian-specific subjects), stored low-signal.
-- is_shortage flags subjects that open more doors abroad (esp. UK).
-- ============================================================================

INSERT INTO subjects (id, slug, label, is_shortage) VALUES
  (1,  'mathematics',       'Mathematics',                                              true),
  (2,  'english',           'English Language & Literature',                            false),
  (3,  'esl_eal',           'ESL / EAL (English as a Second / Additional Language)',    false),
  (4,  'science_general',   'Science — General (combined Physics, Chemistry & Biology — primary/middle)', false),
  (5,  'physics',           'Physics',                                                  true),
  (6,  'chemistry',         'Chemistry',                                                true),
  (7,  'biology',           'Biology',                                                  false),
  (8,  'economics',         'Economics',                                                false),
  (9,  'business_studies',  'Business Studies',                                         false),
  (10, 'accounting',        'Accounting',                                               false),
  (11, 'computer_science',  'Computer Science / ICT',                                   true),
  (12, 'history',           'History',                                                  false),
  (13, 'geography',         'Geography',                                                false),
  (14, 'humanities',        'Humanities / Social Studies (History, Geography, Government/Civics)', false),
  (15, 'french',            'French',                                                   false),
  (16, 'religious_studies', 'Religious Studies (CRS / IRS / RE)',                       false),
  (17, 'physical_education','Physical Education (PE)',                                  false),
  (18, 'art_design',        'Art & Design',                                             false),
  (19, 'music',             'Music',                                                    false),
  (20, 'drama',             'Drama / Performing Arts',                                  false),
  (21, 'design_technology', 'Design & Technology (Technical Drawing, Basic Tech)',      false),
  (22, 'sen',               'Special Educational Needs (SEN / learning support)',       true),
  (23, 'early_years_primary','Early Years / Primary (general classroom teacher)',       false),
  (24, 'other',             'Other (specify)',                                          false)
ON CONFLICT (id) DO UPDATE
  SET slug = EXCLUDED.slug, label = EXCLUDED.label, is_shortage = EXCLUDED.is_shortage;
