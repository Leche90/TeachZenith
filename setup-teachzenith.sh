#!/usr/bin/env bash
# ============================================================================
# TeachZenith — project setup (macOS / Linux / WSL / Git Bash on Windows)
# Creates the full folder structure and the package.json files.
# Run from the directory where you want the "teachzenith" folder created:
#   bash setup-teachzenith.sh
# Then follow the printed next steps to install dependencies.
# ============================================================================
set -euo pipefail

ROOT="teachzenith"
echo "Creating TeachZenith project in ./$ROOT ..."

# --- Top-level + backend + frontend + shared folders ------------------------
mkdir -p "$ROOT"/backend/src/{config,db,models,routes,services/matching,services/ingestion,services/sources,workers,lib,middleware}
mkdir -p "$ROOT"/backend/tests
mkdir -p "$ROOT"/frontend/src/app/{intake,results,jobs,applications}
mkdir -p "$ROOT"/frontend/src/components/{ui,intake,results}
mkdir -p "$ROOT"/frontend/src/{lib,hooks,styles}
mkdir -p "$ROOT"/frontend/public
mkdir -p "$ROOT"/shared/types
mkdir -p "$ROOT"/db/{migrations,seeds}
mkdir -p "$ROOT"/harness

cd "$ROOT"

# --- Root package.json (npm workspaces tie the three packages together) -----
cat > package.json << 'JSON'
{
  "name": "teachzenith",
  "private": true,
  "version": "0.1.0",
  "description": "AI-powered international teaching job matching for Nigerian teachers.",
  "workspaces": ["shared", "backend", "frontend"],
  "scripts": {
    "db:migrate": "cd db && bash migrate.sh",
    "backend:dev": "npm --workspace backend run dev",
    "frontend:dev": "npm --workspace frontend run dev",
    "typecheck": "npm --workspace shared run typecheck && npm --workspace backend run typecheck && npm --workspace frontend run typecheck"
  }
}
JSON

# --- shared/package.json (types shared by both sides) -----------------------
cat > shared/package.json << 'JSON'
{
  "name": "@teachzenith/shared",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "main": "types/index.ts",
  "scripts": {
    "typecheck": "tsc --noEmit"
  },
  "devDependencies": {
    "typescript": "5.9.3"
  }
}
JSON
cat > shared/tsconfig.json << 'JSON'
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "strict": true,
    "declaration": true,
    "skipLibCheck": true,
    "esModuleInterop": true
  },
  "include": ["types/**/*.ts"]
}
JSON
cat > shared/types/index.ts << 'TS'
// Shared TypeScript types for TeachZenith — imported by BOTH backend and frontend.
// These mirror the database schema so the API can't drift from the UI.
// (Filled in during backend scaffolding.)
export {};
TS

# --- backend/package.json ----------------------------------------------------
cat > backend/package.json << 'JSON'
{
  "name": "@teachzenith/backend",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "tsx watch src/index.ts",
    "start": "node dist/index.js",
    "build": "tsc",
    "typecheck": "tsc --noEmit"
  },
  "dependencies": {
    "@anthropic-ai/sdk": "0.104.1",
    "bullmq": "5.78.0",
    "dotenv": "16.6.1",
    "express": "4.22.2",
    "ioredis": "5.11.1",
    "pg": "8.21.0",
    "zod": "4.4.3"
  },
  "devDependencies": {
    "@types/express": "4.17.23",
    "@types/node": "22.9.0",
    "@types/pg": "8.20.0",
    "tsx": "4.22.4",
    "typescript": "5.9.3"
  }
}
JSON
cat > backend/tsconfig.json << 'JSON'
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "outDir": "dist",
    "rootDir": "src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "resolveJsonModule": true,
    "types": ["node"]
  },
  "include": ["src/**/*.ts"]
}
JSON
cat > backend/src/index.ts << 'TS'
// TeachZenith backend entrypoint. (Scaffolding — filled in next step.)
console.log("TeachZenith backend: scaffolding OK");
TS

# --- frontend/package.json ---------------------------------------------------
cat > frontend/package.json << 'JSON'
{
  "name": "@teachzenith/frontend",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "typecheck": "tsc --noEmit"
  },
  "dependencies": {
    "next": "15.5.19",
    "react": "19.2.7",
    "react-dom": "19.2.7"
  },
  "devDependencies": {
    "@types/node": "22.9.0",
    "@types/react": "19.2.17",
    "@types/react-dom": "19.2.3",
    "autoprefixer": "10.5.0",
    "postcss": "8.5.15",
    "tailwindcss": "3.4.19",
    "typescript": "5.9.3"
  }
}
JSON
cat > frontend/tsconfig.json << 'JSON'
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["dom", "dom.iterable", "esnext"],
    "module": "esnext",
    "moduleResolution": "Bundler",
    "jsx": "preserve",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "allowJs": true,
    "noEmit": true,
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "paths": { "@/*": ["./src/*"] }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
JSON

# Minimal placeholder page so the project type-checks before we build the UI.
cat > frontend/src/app/page.tsx << 'TSX'
// TeachZenith home (placeholder — rebuilt from the wireframe during the frontend step).
export default function Home() {
  return <main>TeachZenith</main>;
}
TSX
cat > frontend/src/app/layout.tsx << 'TSX'
import type { ReactNode } from "react";
export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
TSX
# next-env.d.ts is normally generated by `next dev`; create a stub so the
# standalone type-check has it before the first dev run.
cat > frontend/next-env.d.ts << 'DTS'
/// <reference types="next" />
/// <reference types="next/image-types/global" />
DTS

# --- root config files -------------------------------------------------------
cat > .gitignore << 'GI'
node_modules/
.env
.env.local
*.log
dist/
.next/
build/
coverage/
pgdata/
GI

cat > .env.example << 'ENV'
# Copy to .env and fill in. Never commit the real .env.
DATABASE_URL=postgres://localhost:5432/teachzenith
REDIS_URL=redis://localhost:6379
ANTHROPIC_API_KEY=
ADZUNA_APP_ID=
ADZUNA_APP_KEY=
JSEARCH_API_KEY=
JSEARCH_HOST=api.openwebninja.com
FRESHNESS_DAYS=14
ENV

cat > README.md << 'MD'
# TeachZenith
AI-powered international teaching job matching for Nigerian teachers.

Layout: backend/ (API + AI matching + ingestion worker), frontend/ (Next.js app),
db/ (PostgreSQL schema), shared/ (TS types both sides import), harness/ (API test).

See SETUP-NEXT-STEPS.txt for how to install dependencies and verify the project.
MD

echo ""
echo "✅ Folder structure and package files created under ./$ROOT"
echo "Now run the dependency install + compatibility check (see SETUP-NEXT-STEPS.txt)."
