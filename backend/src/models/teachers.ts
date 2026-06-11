// Teachers data access. Writes the teacher row plus child tables (subjects,
// curriculums, english statuses, destinations) in one transaction so a profile
// is always consistent.

import { pool, query, queryOne } from "../db/pool.js";
import type {
  Teacher,
  Curriculum,
  QualificationLevel,
  EnglishStatus,
  RegionCode,
} from "../../../shared/types/index.js";

interface TeacherRow {
  id: string;
  email: string | null;
  full_name: string | null;
  phone: string | null;
  qualification: QualificationLevel | null;
  trcn_certified: boolean | null;
  has_teaching_license: boolean | null;
  license_country: string | null;
  years_experience_min: number | null;
  years_experience_max: number | null;
  willing_outside_specialization: boolean | null;
  other_subject: string | null;
  other_curriculum: string | null;
  headline: string | null;
  bio: string | null;
  completed_intake_at: Date | null;
  created_at: Date;
  updated_at: Date;
}

function mapTeacher(r: TeacherRow): Teacher {
  return {
    id: r.id,
    email: r.email,
    fullName: r.full_name,
    phone: r.phone,
    qualification: r.qualification,
    trcnCertified: r.trcn_certified,
    hasTeachingLicense: r.has_teaching_license,
    licenseCountry: r.license_country,
    yearsExperienceMin: r.years_experience_min,
    yearsExperienceMax: r.years_experience_max,
    willingOutsideSpecialization: r.willing_outside_specialization,
    otherSubject: r.other_subject,
    otherCurriculum: r.other_curriculum,
    headline: r.headline,
    bio: r.bio,
    completedIntakeAt: r.completed_intake_at,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

export interface CreateTeacherInput {
  subjectIds: number[];
  otherSubject?: string | null;
  qualification: QualificationLevel;
  trcnCertified?: boolean | null;
  hasTeachingLicense?: boolean | null;
  licenseCountry?: string | null;
  yearsExperienceMin: number;
  yearsExperienceMax: number | null;
  willingOutsideSpecialization?: boolean | null;
  curriculums: Curriculum[];
  otherCurriculum?: string | null;
  englishStatuses: EnglishStatus[];
  destinations: RegionCode[];
  email?: string | null;
  fullName?: string | null;
}

export async function createTeacher(input: CreateTeacherInput): Promise<Teacher> {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const insert = await client.query<TeacherRow>(
      `INSERT INTO teachers
         (email, full_name, qualification, trcn_certified, has_teaching_license,
          license_country, years_experience_min, years_experience_max,
          willing_outside_specialization, other_subject, other_curriculum,
          completed_intake_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11, now())
       RETURNING *`,
      [
        input.email ?? null,
        input.fullName ?? null,
        input.qualification,
        input.trcnCertified ?? null,
        input.hasTeachingLicense ?? null,
        input.licenseCountry ?? null,
        input.yearsExperienceMin,
        input.yearsExperienceMax,
        input.willingOutsideSpecialization ?? null,
        input.otherSubject ?? null,
        input.otherCurriculum ?? null,
      ],
    );
    const teacher = insert.rows[0]!;

    for (const subjectId of input.subjectIds) {
      await client.query(
        `INSERT INTO teacher_subjects (teacher_id, subject_id)
         VALUES ($1,$2) ON CONFLICT DO NOTHING`,
        [teacher.id, subjectId],
      );
    }
    for (const c of input.curriculums) {
      await client.query(
        `INSERT INTO teacher_curriculums (teacher_id, curriculum)
         VALUES ($1,$2) ON CONFLICT DO NOTHING`,
        [teacher.id, c],
      );
    }
    for (const s of input.englishStatuses) {
      await client.query(
        `INSERT INTO teacher_english (teacher_id, status)
         VALUES ($1,$2) ON CONFLICT DO NOTHING`,
        [teacher.id, s],
      );
    }
    let rank = 1;
    for (const region of input.destinations) {
      await client.query(
        `INSERT INTO teacher_destinations (teacher_id, region, rank)
         VALUES ($1,$2,$3) ON CONFLICT DO NOTHING`,
        [teacher.id, region, rank++],
      );
    }

    await client.query("COMMIT");
    return mapTeacher(teacher);
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

export async function getTeacherById(id: string): Promise<Teacher | null> {
  const row = await queryOne<TeacherRow>("SELECT * FROM teachers WHERE id = $1", [id]);
  if (!row) return null;
  const teacher = mapTeacher(row);

  const subjects = await query<{ subject_id: number }>(
    "SELECT subject_id FROM teacher_subjects WHERE teacher_id = $1", [id]);
  const curriculums = await query<{ curriculum: Curriculum }>(
    "SELECT curriculum FROM teacher_curriculums WHERE teacher_id = $1", [id]);
  const english = await query<{ status: EnglishStatus }>(
    "SELECT status FROM teacher_english WHERE teacher_id = $1", [id]);
  const destinations = await query<{ region: RegionCode; rank: number }>(
    "SELECT region, rank FROM teacher_destinations WHERE teacher_id = $1 ORDER BY rank", [id]);

  teacher.subjects = subjects.map((s) => s.subject_id);
  teacher.curriculums = curriculums.map((c) => c.curriculum);
  teacher.englishStatuses = english.map((e) => e.status);
  teacher.destinations = destinations.map((d) => ({ region: d.region, rank: d.rank }));
  return teacher;
}
