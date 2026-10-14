#!/usr/bin/env bash
# Pull the latest code and restart with zero fuss. Usage: bash deploy/update.sh
set -euo pipefail
APP_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$APP_DIR"
bash deploy/backup-mongo.sh || true
git pull --ff-only
yarn install --frozen-lockfile || yarn install
yarn build
pm2 startOrReload ecosystem.config.js --update-env
pm2 save
echo "Updated ✔  $(git log -1 --pretty='%h %s')"
