// Builds the Express app (separate from starting it, so tests can import the
// app without binding a port). Wires JSON parsing, routes, and error handling.

import express from "express";
import cors from "cors";
import { env } from "./config/env.js";
import { healthRouter } from "./routes/health.js";
import { subjectsRouter } from "./routes/subjects.js";
import { intakeRouter } from "./routes/intake.js";
import { matchesRouter } from "./routes/matches.js";
import { errorHandler, notFound } from "./middleware/error.js";

export function createApp() {
  const app = express();

  // Allow the frontend (different origin/port) to call this API. CORS_ORIGIN can
  // be a comma-separated list; we split it into an allow-list.
  const allowedOrigins = env.CORS_ORIGIN.split(",").map((o) => o.trim());
  app.use(cors({ origin: allowedOrigins, credentials: true }));

  app.use(express.json());

  app.get("/", (_req, res) => {
    res.json({
      name: "TeachZenith API",
      version: "0.1.0",
      status: "running",
      endpoints: {
        health: "/api/health",
        dbHealth: "/api/health/db",
        subjects: "/api/subjects",
        matches: "/api/teachers/:id/matches",
      },
      docs: "See /api/health for basic status",
    });
  });

  // API routes under /api.
  app.use("/api", healthRouter);
  app.use("/api", subjectsRouter);
  app.use("/api", intakeRouter);
  app.use("/api", matchesRouter);

  // 404 + error handling last.
  app.use(notFound);
  app.use(errorHandler);

  return app;
}
