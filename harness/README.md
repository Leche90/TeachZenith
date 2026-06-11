# TeachZenith — Data Source Test Harness

Tests whether Adzuna + JSearch return enough fresh, genuine teaching jobs in your
priority markets (Gulf, Asia, UK). Prints volume, freshness, and role-quality.

## Setup
1. Create a `.env` in THIS harness folder (copy from .env.example) with your keys:
       ADZUNA_APP_ID=...
       ADZUNA_APP_KEY=...
       JSEARCH_API_KEY=...
       JSEARCH_HOST=api.openwebninja.com
   (Same keys as your backend/.env — you can copy them over.)

2. Install and run:
       npm install
       npm run harness

## What this run does (deliberately light)
- One query per market = ~8 API calls total. Well within your rate limits.
- JSearch uses the current /jsearch/search-v2 endpoint.
- Adzuna will be EMPTY for UAE/Qatar/Saudi (it has no endpoint there) — expected,
  not a bug. Adzuna is tested on Singapore and the UK only.

## Reading the report
Per market, per API: total returned, how many are fresh (<=14 days), how many
look like real teaching roles, and "fresh AND real" — the number that matters.

Send me the OVERALL section + a few sample titles and we'll decide whether the
API layer can carry the MVP or we lean on targeted sources.
