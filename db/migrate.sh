#!/usr/bin/env bash
# ============================================================================
# TeachZenith — apply all migrations + seeds in order.
# Usage:
#   DATABASE_URL=postgres://user:pass@localhost:5432/teachzenith ./db/migrate.sh
# or set PGHOST/PGPORT/PGUSER/PGDATABASE and run with no args.
# ============================================================================
set -euo pipefail

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PSQL_ARGS="-v ON_ERROR_STOP=1"

if [[ -n "${DATABASE_URL:-}" ]]; then
  RUN() { psql $PSQL_ARGS "$DATABASE_URL" -f "$1"; }
else
  RUN() { psql $PSQL_ARGS -f "$1"; }
fi

echo "Applying migrations..."
for f in "$DIR"/migrations/*.sql; do
  echo "  -> $(basename "$f")"
  RUN "$f"
done

echo "Applying seeds..."
for f in "$DIR"/seeds/*.sql; do
  echo "  -> $(basename "$f")"
  RUN "$f"
done

echo "Done. Schema is ready."
