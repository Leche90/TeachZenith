// Subjects route — returns the seeded subject vocabulary. Used by the intake
// form (Q2) so the options come from the database, not hardcoded in the UI.

import { Router } from "express";
import { listSubjects } from "../models/subjects.js";

export const subjectsRouter = Router();

subjectsRouter.get("/subjects", async (_req, res, next) => {
  try {
    const subjects = await listSubjects();
    res.json({ subjects });
  } catch (err) {
    next(err);
  }
});
