// Match routes — the bridge between the matching engine and the frontend.
//   GET  /api/teachers/:id/matches   grouped results for the results screen
//   POST /api/teachers/:id/match     trigger a fresh matching run
// (POST is synchronous for now; it becomes a background job with the worker layer.)

import { Router } from "express";
import { getGroupedMatchesForTeacher } from "../models/matches.js";
import { matchTeacher } from "../services/matching/service.js";

export const matchesRouter = Router();

matchesRouter.get("/teachers/:id/matches", async (req, res, next) => {
  try {
    const minScore = req.query.minScore ? Number(req.query.minScore) : 40;
    const grouped = await getGroupedMatchesForTeacher(req.params.id, minScore);
    res.json(grouped);
  } catch (err) {
    next(err);
  }
});

matchesRouter.post("/teachers/:id/match", async (req, res, next) => {
  try {
    const result = await matchTeacher(req.params.id);
    res.json({
      message: "Matching complete.",
      ...result,
    });
  } catch (err) {
    next(err);
  }
});
