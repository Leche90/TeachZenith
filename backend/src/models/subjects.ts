// Subjects data access. Subjects are a small, seeded, read-mostly vocabulary.

import { query } from "../db/pool.js";
import type { Subject } from "../../../shared/types/index.js";

// DB returns snake_case columns; we map to our camelCase Subject type.
interface SubjectRow {
  id: number;
  slug: string;
  label: string;
  is_shortage: boolean;
}

function mapSubject(r: SubjectRow): Subject {
  return { id: r.id, slug: r.slug, label: r.label, isShortage: r.is_shortage };
}

export async function listSubjects(): Promise<Subject[]> {
  const rows = await query<SubjectRow>(
    "SELECT id, slug, label, is_shortage FROM subjects ORDER BY id",
  );
  return rows.map(mapSubject);
}

export async function listShortageSubjects(): Promise<Subject[]> {
  const rows = await query<SubjectRow>(
    "SELECT id, slug, label, is_shortage FROM subjects WHERE is_shortage = true ORDER BY id",
  );
  return rows.map(mapSubject);
}
