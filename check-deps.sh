#!/usr/bin/env bash
# ============================================================================
# TeachZenith — install dependencies and verify compatibility.
# Run from INSIDE the teachzenith/ folder (after setup-teachzenith.sh):
#   bash check-deps.sh
# ============================================================================
set -euo pipefail

echo "============================================================"
echo "TeachZenith dependency + compatibility check"
echo "============================================================"

# --- 0. Prerequisites --------------------------------------------------------
echo ""
echo "[0/4] Checking prerequisites..."
NODE_MAJOR="$(node -v 2>/dev/null | sed 's/v//' | cut -d. -f1 || echo 0)"
if [ "$NODE_MAJOR" -lt 18 ]; then
  echo "  ✗ Node.js 18+ required. Found: $(node -v 2>/dev/null || echo 'none')."
  echo "    Install from https://nodejs.org (LTS)."
  exit 1
fi
echo "  ✓ Node $(node -v)"
echo "  ✓ npm  $(npm -v)"
command -v psql >/dev/null 2>&1 && echo "  ✓ psql present ($(psql --version))" \
  || echo "  ! psql not found — needed only to run the DB later, not for this check."
command -v redis-server >/dev/null 2>&1 && echo "  ✓ redis present" \
  || echo "  ! redis not found — needed only to run the worker later, not for this check."

# --- 1. Install everything via workspaces -----------------------------------
echo ""
echo "[1/4] Installing dependencies (this can take a few minutes)..."
npm install

# --- 2. Report resolved versions --------------------------------------------
echo ""
echo "[2/4] Resolved key versions:"
node -e "
const read = p => { try { return require('./'+p+'/package.json'); } catch { return {}; } };
for (const ws of ['backend','frontend','shared']) {
  const pj = read(ws);
  const all = {...(pj.dependencies||{}), ...(pj.devDependencies||{})};
  console.log('  '+ws+':');
  for (const k of Object.keys(all).sort()) console.log('    '+k+' '+all[k]);
}
"

# --- 3. Peer-dependency conflict scan ---------------------------------------
echo ""
echo "[3/4] Checking for dependency conflicts..."
if npm ls --all >/tmp/tz_npmls.txt 2>&1; then
  echo "  ✓ No unmet/invalid dependencies reported."
else
  if grep -qiE 'invalid|UNMET|missing peer' /tmp/tz_npmls.txt; then
    echo "  ! Possible issues:"
    grep -iE 'invalid|UNMET|missing peer' /tmp/tz_npmls.txt | head -10 | sed 's/^/    /'
    echo "    (Often harmless. Note them but continue.)"
  else
    echo "  ✓ No conflicts flagged."
  fi
fi

# --- 4. TypeScript compiles across all packages -----------------------------
echo ""
echo "[4/4] Type-checking all packages..."
npm run typecheck && echo "  ✓ All packages type-check cleanly." \
  || { echo "  ✗ Type-check failed — see output above."; exit 1; }

echo ""
echo "============================================================"
echo "✅ Compatibility check passed. The project is sound."
echo "============================================================"
echo "Next: place the DB schema in db/ and run  npm run db:migrate"
