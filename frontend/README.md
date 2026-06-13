# TeachZenith — Frontend (Next.js)

Mobile-first UI for the TeachZenith product. Wired to the backend API.

## Setup
1. Install: `npm install`
2. Point at your backend: `cp .env.local.example .env.local`
   (default is http://localhost:4000)
3. Make sure the backend allows the frontend origin (CORS — see backend setup).
4. Run: `npm run dev` then open http://localhost:3000

## Structure
- `src/app/` — pages (splash, intake, results) using the Next.js App Router
- `src/components/` — UI primitives and screen components
- `src/lib/api.ts` — typed client for the backend
- `src/lib/constants.ts` — intake options + tier copy (mirrors backend enums)
- `src/types/` — shared response types

## Flow
splash (`/`) → intake (`/intake`) → results (`/results/[teacherId]`)
