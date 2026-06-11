# ============================================================================
# TeachZenith — project setup for Windows PowerShell
# Run from the directory where you want the "teachzenith" folder created:
#   powershell -ExecutionPolicy Bypass -File setup-teachzenith.ps1
# Then run check-deps (use Git Bash for check-deps.sh, or run the npm commands
# in SETUP-NEXT-STEPS.txt manually).
# ============================================================================
$ErrorActionPreference = "Stop"
$root = "teachzenith"
Write-Host "Creating TeachZenith project in .\$root ..."

$dirs = @(
  "$root\backend\src\config","$root\backend\src\db","$root\backend\src\models",
  "$root\backend\src\routes","$root\backend\src\services\matching",
  "$root\backend\src\services\ingestion","$root\backend\src\services\sources",
  "$root\backend\src\workers","$root\backend\src\lib","$root\backend\src\middleware",
  "$root\backend\tests",
  "$root\frontend\src\app\intake","$root\frontend\src\app\results",
  "$root\frontend\src\app\jobs","$root\frontend\src\app\applications",
  "$root\frontend\src\components\ui","$root\frontend\src\components\intake",
  "$root\frontend\src\components\results",
  "$root\frontend\src\lib","$root\frontend\src\hooks","$root\frontend\src\styles",
  "$root\frontend\public","$root\shared\types",
  "$root\db\migrations","$root\db\seeds","$root\harness"
)
foreach ($d in $dirs) { New-Item -ItemType Directory -Force -Path $d | Out-Null }

# Root package.json
@'
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
'@ | Set-Content "$root\package.json"

@'
node_modules/
.env
.env.local
*.log
dist/
.next/
build/
coverage/
pgdata/
'@ | Set-Content "$root\.gitignore"

@'
DATABASE_URL=postgres://localhost:5432/teachzenith
REDIS_URL=redis://localhost:6379
ANTHROPIC_API_KEY=
ADZUNA_APP_ID=
ADZUNA_APP_KEY=
JSEARCH_API_KEY=
JSEARCH_HOST=api.openwebninja.com
FRESHNESS_DAYS=14
'@ | Set-Content "$root\.env.example"

Write-Host ""
Write-Host "Folder structure created under .\$root"
Write-Host "NOTE: For the per-package package.json/tsconfig files, the bash script"
Write-Host "writes them automatically. On Windows, easiest path is to run the bash"
Write-Host "setup script via Git Bash. Otherwise copy them from SETUP-NEXT-STEPS.txt."
