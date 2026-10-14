#!/usr/bin/env bash
# Nightly MongoDB + uploads backup (runs from /etc/cron.d/gillco). Keeps 14 days.
set -euo pipefail
APP_DIR="$(cd "$(dirname "$0")/.." && pwd)"
ENV_FILE="$APP_DIR/.env.production"
URL="$(grep -E '^MONGO_URL=' "$ENV_FILE" | cut -d= -f2-)"
DB="$(grep -E '^DB_NAME=' "$ENV_FILE" | cut -d= -f2-)"
DEST=/var/backups/gillco
STAMP="$(date +%Y%m%d-%H%M)"
mkdir -p "$DEST"
mongodump --uri="$URL" --db="$DB" --archive="$DEST/db-$STAMP.gz" --gzip
tar -czf "$DEST/uploads-$STAMP.tgz" -C "$APP_DIR/public" uploads 2>/dev/null || true
find "$DEST" -maxdepth 1 -type f \( -name 'db-*.gz' -o -name 'uploads-*.tgz' \) -mtime +14 -delete
echo "$(date) backup ok: $DEST/db-$STAMP.gz"
