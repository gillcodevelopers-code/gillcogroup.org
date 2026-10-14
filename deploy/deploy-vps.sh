#!/usr/bin/env bash
# ============================================================
# GILLCO GROUP — ONE-SHOT SETUP for a Hostinger VPS (Ubuntu 22.04 / 24.04)
# Installs: Node 22, MongoDB 8 (password-protected, local only), Nginx,
#           free SSL, PM2, firewall, lead-escalation cron, nightly DB backup.
#
# Run as root from the app folder:
#   DOMAIN=new.gillcogroup.org bash deploy/deploy-vps.sh        # test address first
#   DOMAIN=gillcogroup.org WWW=1 bash deploy/deploy-vps.sh      # final domain
# Safe to re-run (it skips what is already done).
# ============================================================
set -euo pipefail

APP_DIR="$(cd "$(dirname "$0")/.." && pwd)"
DOMAIN="${DOMAIN:-gillcogroup.org}"
WWW="${WWW:-0}"                       # 1 = also serve www.$DOMAIN
EMAIL="${EMAIL:-}"                      # optional: SSL expiry notices
DB_NAME="${DB_NAME:-gillco}"
ENV_FILE="$APP_DIR/.env.production"

[ "$(id -u)" -eq 0 ] || { echo 'Run as root (sudo -i)'; exit 1; }
SERVER_NAMES="$DOMAIN"; [ "$WWW" = "1" ] && SERVER_NAMES="$DOMAIN www.$DOMAIN"
echo "==> App folder: $APP_DIR | Domain(s): $SERVER_NAMES"

echo '==> [1/9] System packages'
export DEBIAN_FRONTEND=noninteractive
apt-get update -y
apt-get install -y curl gnupg ca-certificates lsb-release nginx certbot python3-certbot-nginx git ufw build-essential openssl

echo '==> [2/9] Node.js 22 + yarn + pm2'
if ! command -v node >/dev/null || [ "$(node -v | cut -d. -f1 | tr -d v)" -lt 20 ]; then
  curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
  apt-get install -y nodejs
fi
command -v yarn >/dev/null || npm i -g yarn
command -v pm2  >/dev/null || npm i -g pm2

echo '==> [3/9] MongoDB 8.0'
if ! command -v mongod >/dev/null; then
  CODENAME="$(lsb_release -cs)"; case "$CODENAME" in jammy|noble) ;; *) CODENAME=noble ;; esac
  curl -fsSL https://www.mongodb.org/static/pgp/server-8.0.asc | gpg --dearmor -o /usr/share/keyrings/mongodb-server-8.0.gpg
  echo "deb [ arch=amd64,arm64 signed-by=/usr/share/keyrings/mongodb-server-8.0.gpg ] https://repo.mongodb.org/apt/ubuntu $CODENAME/mongodb-org/8.0 multiverse" > /etc/apt/sources.list.d/mongodb-org-8.0.list
  apt-get update -y && apt-get install -y mongodb-org
fi
systemctl enable --now mongod
sleep 3

echo '==> [4/9] Environment file'
if [ ! -f "$ENV_FILE" ]; then
  cp "$APP_DIR/.env.production.example" "$ENV_FILE"
  echo "   Created $ENV_FILE from the example."
fi
setenv() { # setenv KEY VALUE  (adds or replaces a line)
  if grep -q "^$1=" "$ENV_FILE"; then sed -i "s|^$1=.*|$1=$2|" "$ENV_FILE"; else echo "$1=$2" >> "$ENV_FILE"; fi
}
getenv() { grep -E "^$1=" "$ENV_FILE" | tail -1 | cut -d= -f2- || true; }

# Local MongoDB user (created once). The DB only listens on 127.0.0.1.
if ! grep -q '^security:' /etc/mongod.conf; then
  DB_PASS="$(openssl rand -hex 24)"
  mongosh --quiet --eval "db.getSiblingDB('$DB_NAME').createUser({user:'gillco',pwd:'$DB_PASS',roles:[{role:'readWrite',db:'$DB_NAME'}]})"
  ADMIN_PASS="$(openssl rand -hex 24)"
  mongosh --quiet --eval "db.getSiblingDB('admin').createUser({user:'root',pwd:'$ADMIN_PASS',roles:['root']})"
  printf 'security:\n  authorization: enabled\n' >> /etc/mongod.conf
  systemctl restart mongod; sleep 3
  echo "MONGO_ROOT_USER=root" > /root/.gillco-mongo-root
  echo "MONGO_ROOT_PASS=$ADMIN_PASS" >> /root/.gillco-mongo-root
  chmod 600 /root/.gillco-mongo-root
  setenv MONGO_URL "mongodb://gillco:$DB_PASS@127.0.0.1:27017/$DB_NAME?authSource=$DB_NAME"
  echo '   MongoDB password protection ON (root login saved in /root/.gillco-mongo-root)'
fi
setenv DB_NAME "$DB_NAME"
setenv NEXT_PUBLIC_SITE_URL "https://$DOMAIN"
setenv NEXT_PUBLIC_BASE_URL "https://$DOMAIN"
CORS="https://$DOMAIN"; [ "$WWW" = "1" ] && CORS="$CORS,https://www.$DOMAIN"
setenv CORS_ORIGINS "$CORS"
[ -n "$(getenv CRON_SECRET)" ] || setenv CRON_SECRET "$(openssl rand -hex 24)"
if [ -z "$(getenv ADMIN_PASSWORD)" ] || [ "$(getenv ADMIN_PASSWORD)" = "CHANGE_ME_STRONG_PASSWORD" ]; then
  read -rsp '   Choose the Admin CMS password (same as on Vercel if you want to keep it): ' AP; echo
  [ -n "$AP" ] || { echo '   Password cannot be empty'; exit 1; }
  setenv ADMIN_PASSWORD "$AP"
fi
chmod 600 "$ENV_FILE"

echo '==> [5/9] Install & build the website'
cd "$APP_DIR"
mkdir -p public/uploads /var/log/gillco /var/backups/gillco
yarn install --frozen-lockfile || yarn install
yarn build

echo '==> [6/9] Start with PM2 (auto-restart + start on boot)'
pm2 startOrReload ecosystem.config.js --update-env
pm2 save
pm2 startup systemd -u root --hp /root >/dev/null 2>&1 || true

echo '==> [7/9] Nginx + free SSL'
sed -e "s|__SERVER_NAMES__|$SERVER_NAMES|g" -e "s|__APP_DIR__|$APP_DIR|g" "$APP_DIR/deploy/nginx.conf" > /etc/nginx/sites-available/gillco
ln -sf /etc/nginx/sites-available/gillco /etc/nginx/sites-enabled/gillco
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl reload nginx
CERT_ARGS="-d $DOMAIN"; [ "$WWW" = "1" ] && CERT_ARGS="$CERT_ARGS -d www.$DOMAIN"
if [ -n "$EMAIL" ]; then MAIL_ARG="-m $EMAIL"; else MAIL_ARG="--register-unsafely-without-email"; fi
certbot --nginx $CERT_ARGS --non-interactive --agree-tos $MAIL_ARG --redirect --expand \
  || echo '   !! SSL failed — is the DNS A record pointing to this server yet? Re-run this script once it is.'

echo '==> [8/9] Firewall + scheduled jobs'
ufw allow OpenSSH >/dev/null; ufw allow 'Nginx Full' >/dev/null; ufw --force enable >/dev/null
chmod +x "$APP_DIR"/deploy/*.sh
cat > /etc/cron.d/gillco <<CRON
# Lead auto-escalation check every minute
* * * * * root curl -fsS -m 50 -H "Authorization: Bearer $(getenv CRON_SECRET)" http://127.0.0.1:3000/api/cron/escalate >/dev/null 2>&1
# Uptime watchdog every 2 minutes (auto-restart + email alerts)
*/2 * * * * root bash $APP_DIR/deploy/watchdog.sh >> /var/log/gillco/watchdog.log 2>&1
# Nightly database backup at 02:30 (keeps 14 days)
30 2 * * * root bash $APP_DIR/deploy/backup-mongo.sh >> /var/log/gillco/backup.log 2>&1
CRON
chmod 644 /etc/cron.d/gillco

echo '==> [9/9] Health check'
sleep 4
curl -fsS -o /dev/null -w '   Website: HTTP %{http_code}\n' http://127.0.0.1:3000/ || echo '   !! App not answering — check: pm2 logs gillco-web'
curl -fsS -o /dev/null -w '   API:     HTTP %{http_code}\n' http://127.0.0.1:3000/api/settings || true
pm2 status
echo "DONE → https://$DOMAIN"
