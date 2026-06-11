// Central error handler. Routes call next(err); this turns it into a clean JSON
// response and logs the detail server-side. In the interface's voice — explains
// what happened without leaking internals.

import type { Request, Response, NextFunction } from "express";

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  const message = err instanceof Error ? err.message : "Unknown error";
  console.error("Request error:", message);
  res.status(500).json({
    error: "Something went wrong handling that request.",
  });
}

export function notFound(_req: Request, res: Response): void {
  res.status(404).json({ error: "Not found." });
}
