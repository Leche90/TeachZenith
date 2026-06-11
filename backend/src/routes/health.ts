// Health route. /health is a liveness check; /health/db actually queries the
// database so we can confirm the whole chain (server -> pool -> Postgres) works.

import { Router } from "express";
import { ping } from "../db/pool.js";

export const healthRouter = Router();

healthRouter.get("/health", (_req, res) => {
  res.json({ status: "ok", service: "teachzenith-backend" });
});

healthRouter.get("/health/db", async (_req, res) => {
  const dbOk = await ping();
  res.status(dbOk ? 200 : 503).json({
    status: dbOk ? "ok" : "unavailable",
    database: dbOk ? "connected" : "unreachable",
  });
});
