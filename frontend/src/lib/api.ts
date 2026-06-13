// Typed client for the TeachZenith backend. All network calls live here, so
// screens never touch fetch directly. Base URL comes from env.

import type { IntakePayload, Teacher, GroupedMatches } from "@/types";

const BASE = process.env.NEXT_PUBLIC_API_BASE ?? "http://localhost:4000";

async function json<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new ApiError(body?.error ?? `Request failed (${res.status})`, res.status, body);
  }
  return res.json() as Promise<T>;
}

export class ApiError extends Error {
  constructor(message: string, public status: number, public body?: unknown) {
    super(message);
  }
}

// Create a teacher profile from the intake answers.
export async function createTeacher(payload: IntakePayload): Promise<Teacher> {
  const res = await fetch(`${BASE}/api/intake`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await json<{ teacher: Teacher }>(res);
  return data.teacher;
}

// Trigger a matching run for a teacher (synchronous on the backend for now).
export async function runMatch(teacherId: string): Promise<void> {
  await json(await fetch(`${BASE}/api/teachers/${teacherId}/match`, { method: "POST" }));
}

// Fetch grouped, tiered matches for the results screen.
export async function getMatches(teacherId: string): Promise<GroupedMatches> {
  return json<GroupedMatches>(await fetch(`${BASE}/api/teachers/${teacherId}/matches`));
}
