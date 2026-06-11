// Validation for the 7-question intake payload. Validates BEFORE the database so
// bad input returns a clear 400 with field-level messages. Enums mirror the DB.

import { z } from "zod";

export const intakeSchema = z.object({
  // Q1 — subjects (at least one). IDs from /api/subjects.
  subjectIds: z.array(z.number().int().positive()).min(1, "Pick at least one subject"),
  otherSubject: z.string().max(120).nullable().optional(),

  // Q2 — highest qualification (single-select)
  qualification: z.enum([
    "bed_subject",
    "degree_plus_pgde",
    "masters_education",
    "degree_no_teaching_qual",
  ]),
  // Q2 add-ons
  trcnCertified: z.boolean().nullable().optional(),
  hasTeachingLicense: z.boolean().nullable().optional(),
  licenseCountry: z.string().max(100).nullable().optional(),

  // Q3 — experience band. max null = "15+".
  yearsExperienceMin: z.number().int().min(0).max(60),
  yearsExperienceMax: z.number().int().min(0).max(60).nullable(),

  // Q4 — willing to teach outside specialization?
  willingOutsideSpecialization: z.boolean().nullable().optional(),

  // Q5 — curriculums (at least one)
  curriculums: z
    .array(z.enum(["nigerian", "british_igcse", "ib", "american", "other"]))
    .min(1, "Pick at least one curriculum"),
  otherCurriculum: z.string().max(120).nullable().optional(),

  // Q6 — English proficiency (multi-select, no scores; at least one)
  englishStatuses: z
    .array(z.enum(["ielts", "toefl", "duolingo", "can_take", "native", "unsure"]))
    .min(1, "Pick at least one English option"),

  // Q7 — destination preferences (region codes, ranked order). At least one.
  destinations: z
    .array(z.enum([
      "gulf", "southeast_asia", "east_asia", "europe_uk",
      "north_america", "australia_nz", "africa_non_nigeria", "anywhere",
    ]))
    .min(1, "Pick at least one destination"),

  // Optional contact — profile can be created anonymously.
  email: z.string().email().nullable().optional(),
  fullName: z.string().min(1).max(200).nullable().optional(),
})
  .refine(
    (d) => d.yearsExperienceMax === null || d.yearsExperienceMax >= d.yearsExperienceMin,
    { message: "Max years must be >= min years", path: ["yearsExperienceMax"] },
  );

export type IntakePayload = z.infer<typeof intakeSchema>;
