// Thin wrapper around the Anthropic SDK for matching. Uses Haiku 4.5 — fast and
// cheap ($1/$5 per M tokens), ideal for high-volume scoring. Keeps the model
// name and client config in one place.

import Anthropic from "@anthropic-ai/sdk";
import { env } from "../../config/env.js";

// Current fast/cheap model for matching-style classification work.
export const MATCHING_MODEL = "claude-haiku-4-5-20251001";

let client: Anthropic | null = null;

export function getAnthropic(): Anthropic {
  if (!env.ANTHROPIC_API_KEY) {
    throw new Error("ANTHROPIC_API_KEY is not set — add it to backend/.env to run matching.");
  }
  if (!client) {
    client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });
  }
  return client;
}
