// Intake routes — the product's front door.
//   POST /api/intake        create a teacher profile from the 6 answers
//   GET  /api/teachers/:id   fetch a profile back (with child rows)
// No auth here by design: profiles are created anonymously, matching the
// product promise of "see your matches with no sign-up".

import { Router } from "express";
import { intakeSchema } from "./intake.validation.js";
import { createTeacher, getTeacherById } from "../models/teachers.js";

export const intakeRouter = Router();

intakeRouter.post("/intake", async (req, res, next) => {
  // 1. Validate the incoming body. On failure, return a clean 400 with details.
  const parsed = intakeSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      error: "Some answers need fixing.",
      issues: parsed.error.issues.map((i) => ({
        field: i.path.join("."),
        message: i.message,
      })),
    });
  }

  // 2. Create the profile (model writes teacher + child rows in a transaction).
  try {
    const teacher = await createTeacher(parsed.data);
    return res.status(201).json({ teacher });
  } catch (err) {
    return next(err);
  }
});

intakeRouter.get("/teachers/:id", async (req, res, next) => {
  try {
    const teacher = await getTeacherById(req.params.id);
    if (!teacher) {
      return res.status(404).json({ error: "No teacher with that id." });
    }
    return res.json({ teacher });
  } catch (err) {
    return next(err);
  }
});
