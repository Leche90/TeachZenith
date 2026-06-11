// Teachers data access. Handles the teacher row plus its child tables
// (subjects, curriculums, destinations) in single transactions so a profile is
// always written consistently.

import { pool, query, queryOne } from "../db/pool.js";
import type {
  Teacher,
  Curriculum,
  QualificationLevel,
  EnglishTestStatus,
} from "../../../shared/types/index.js";

interface TeacherRow {
  id: string;
  email: string | null;
  full_name: string | null;
  phone: string | null;
  qualification: QualificationLevel | null;
  years_experience_min: number | null;
  years_experience_max: number | null;
  english_test: EnglishTestStatus;
  english_band: string | null;       // numeric comes back as string in pg
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
    yearsExperienceMin: r.years_experience_min,
    yearsExperienceMax: r.years_experience_max,
    englishTest: r.english_test,
    englishBand: r.english_band === null ? null : Number(r.english_band),
    headline: r.headline,
    bio: r.bio,
    completedIntakeAt: r.completed_intake_at,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

// The 6-question intake payload used to create a profile.
export interface CreateTeacherInput {
  qualification: QualificationLevel;
  subjectIds: number[];
  yearsExperienceMin: number;
  yearsExperienceMax: number | null;   // null = "10+"
  curriculums: Curriculum[];
  englishTest: EnglishTestStatus;
  englishBand?: number | null;
  destinations: string[];              // region codes, in preference order
  email?: string | null;
  fullName?: string | null;
}

// Create a teacher and all child rows atomically.
export async function createTeacher(input: CreateTeacherInput): Promise<Teacher> {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const insert = await client.query<TeacherRow>(
      `INSERT INTO teachers
         (email, full_name, qualification, years_experience_min,
          years_experience_max, english_test, english_band, completed_intake_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7, now())
       RETURNING *`,
      [
        input.email ?? null,
        input.fullName ?? null,
        input.qualification,
        input.yearsExperienceMin,
        input.yearsExperienceMax,
        input.englishTest,
        input.englishBand ?? null,
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
    let rank = 1;
    for (const region of input.destinations) {
      await client.query(
        `INSERT INTO teacher_destinations (teacher_id, region_code, rank)
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
    "SELECT subject_id FROM teacher_subjects WHERE teacher_id = $1",
    [id],
  );
  const curriculums = await query<{ curriculum: Curriculum }>(
    "SELECT curriculum FROM teacher_curriculums WHERE teacher_id = $1",
    [id],
  );
  const destinations = await query<{ region_code: string; rank: number }>(
    "SELECT region_code, rank FROM teacher_destinations WHERE teacher_id = $1 ORDER BY rank",
    [id],
  );

  teacher.subjects = subjects.map((s) => s.subject_id);
  teacher.curriculums = curriculums.map((c) => c.curriculum);
  teacher.destinations = destinations.map((d) => ({ regionCode: d.region_code, rank: d.rank }));
  return teacher;
}
