#!/usr/bin/env bash
# ============================================================
# Copy ALL live data from MongoDB Atlas into the VPS MongoDB.
# Usage (on the VPS, from the app folder):
#   ATLAS_URI='mongodb+srv://USER:PASS@cluster.xxxx.mongodb.net' ATLAS_DB=gillco bash deploy/migrate-from-atlas.sh
# ATLAS_DB = the DB_NAME you used on Vercel. Local data with the same
# collection names is REPLACED (a safety backup is taken first).
# ============================================================
set -euo pipefail
APP_DIR="$(cd "$(dirname "$0")/.." && pwd)"
ENV_FILE="$APP_DIR/.env.production"
: "${ATLAS_URI:?Set ATLAS_URI to your Atlas connection string}"
ATLAS_DB="${ATLAS_DB:-gillco}"
LOCAL_URL="$(grep -E '^MONGO_URL=' "$ENV_FILE" | cut -d= -f2-)"
LOCAL_DB="$(grep -E '^DB_NAME=' "$ENV_FILE" | cut -d= -f2-)"
STAMP="$(date +%Y%m%d-%H%M%S)"
WORK="/var/backups/gillco/atlas-$STAMP"
mkdir -p "$WORK"

echo "==> Safety backup of current local DB"
mongodump --uri="$LOCAL_URL" --db="$LOCAL_DB" --archive="$WORK/local-before.gz" --gzip || true

echo "==> Downloading from Atlas ($ATLAS_DB)"
mongodump --uri="$ATLAS_URI" --db="$ATLAS_DB" --archive="$WORK/atlas.gz" --gzip

echo "==> Restoring into local ($LOCAL_DB)"
mongorestore --uri="$LOCAL_URL" --archive="$WORK/atlas.gz" --gzip --drop \
  --nsFrom="$ATLAS_DB.*" --nsTo="$LOCAL_DB.*"

echo "==> Collections now on the VPS:"
mongosh "$LOCAL_URL" --quiet --eval 'db.getCollectionNames().forEach(c => print("  " + c + ": " + db[c].countDocuments()))'
pm2 restart gillco-web >/dev/null 2>&1 || true
echo "DONE. Backup files kept in $WORK"
