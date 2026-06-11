# TeachZenith Backend

Node + TypeScript API server, connected to your PostgreSQL database.

## What's here so far (scaffolding milestone)
- `config/env.ts`  — validates environment variables at startup (fails loudly).
- `db/pool.ts`     — the single Postgres connection pool + query helpers.
- `models/`        — typed data access. `subjects.ts` and `teachers.ts` set the
                     pattern; more entities follow the same shape.
- `routes/`        — `health.ts` (incl. a real DB check) and `subjects.ts`.
- `middleware/`    — central error handling.
- `app.ts`         — builds the Express app.
- `index.ts`       — starts the server + graceful shutdown.

Shared types live in `../shared/types` and are imported by both backend and
frontend, so the API and UI can't disagree on data shapes.

## Run it

1. Create `backend/.env` (copy from `.env.example`) and set your DATABASE_URL.
   On local WSL that's the socket form (no host, no password):

       DATABASE_URL=postgres:///teachzenith
       PORT=4000

2. Install (from the repo root, workspaces handles it):

       npm install

3. Start in watch mode:

       npm --workspace backend run dev

   You should see:
       TeachZenith backend listening on http://localhost:4000
         Database: connected ✓

4. Verify in another terminal:

       curl http://localhost:4000/api/health
       curl http://localhost:4000/api/health/db
       curl http://localhost:4000/api/subjects

   /api/subjects returns all 13 seeded subjects from the database.

## Notes
- Type-check anytime with:  npm --workspace backend run typecheck
- Match scores are stored as plain numbers; the "%" is added in the FRONTEND.
- node-pg-migrate is included for future schema changes (versioned migrations),
  separate from the initial raw-SQL schema you've already applied.
