#!/usr/bin/env bash
# Back up the RBC Supabase database (schema + all data) to a dated file.
#
# One-time setup:
#   brew install libpq && brew link --force libpq     # provides pg_dump
#   Supabase dashboard → Connect → "Session pooler" connection string
#   (postgresql://postgres.<ref>:<password>@...pooler.supabase.com:5432/postgres)
#
# Usage:
#   SUPABASE_DB_URL='postgresql://...' ./scripts/backup-db.sh [output-dir]
#
# Never commit the connection string: it contains the database password.
set -euo pipefail

if [[ -z "${SUPABASE_DB_URL:-}" ]]; then
  echo "Set SUPABASE_DB_URL to the Supabase session-pooler connection string." >&2
  exit 1
fi
if ! command -v pg_dump >/dev/null; then
  echo "pg_dump not found. Install it with: brew install libpq && brew link --force libpq" >&2
  exit 1
fi

out_dir="${1:-$HOME/RBC-backups}"
mkdir -p "$out_dir"
file="$out_dir/rbc-$(date +%Y-%m-%d_%H%M).dump"

# Custom format is compressed and restorable with pg_restore.
# public = all app data; auth = logins (profiles reference auth.users, so a
# restore without it leaves records nobody can sign in to).
# NOT included: uploaded files (submissions, modules, photos). Those live in
# Supabase Storage, not the database — download them separately if needed.
pg_dump "$SUPABASE_DB_URL" --format=custom --no-owner --no-privileges \
  --schema=public --schema=auth --file="$file"

echo "Backup written: $file ($(du -h "$file" | cut -f1))"
echo "Restore (into an empty database): pg_restore --no-owner --dbname=\"\$TARGET_DB_URL\" \"$file\""
