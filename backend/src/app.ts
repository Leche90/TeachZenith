// Builds the Express app (separate from starting it, so tests can import the
// app without binding a port). Wires JSON parsing, routes, and error handling.

import express from "express";
import { healthRouter } from "./routes/health.js";
import { subjectsRouter } from "./routes/subjects.js";
import { intakeRouter } from "./routes/intake.js";
import { errorHandler, notFound } from "./middleware/error.js";

export function createApp() {
  const app = express();

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
      },
      docs: "See /api/health for basic status",
    });
  });

  // API routes under /api.
  app.use("/api", healthRouter);
  app.use("/api", subjectsRouter);
  app.use("/api", intakeRouter);

  // 404 + error handling last.
  app.use(notFound);
  app.use(errorHandler);

  return app;
}
