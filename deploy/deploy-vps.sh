#!/usr/bin/env bash
# ============================================================
# ONE-SHOT DEPLOY SCRIPT for Hostinger VPS (Ubuntu 22.04+)
# Run on the VPS as root:  bash deploy-vps.sh
# ============================================================
set -e

APP_DIR=/var/www/gillco
DOMAIN=gillcogroup.org

echo '==> [1/8] System update'
apt-get update -y && apt-get upgrade -y

echo '==> [2/8] Install Node 20, Nginx, Certbot, Git, Ghostscript'
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt-get install -y nodejs nginx certbot python3-certbot-nginx git ghostscript build-essential
npm i -g yarn pm2

echo '==> [3/8] Install MongoDB 7.0'
curl -fsSL https://pgp.mongodb.com/server-7.0.asc | gpg -o /usr/share/keyrings/mongodb-server-7.0.gpg --dearmor
echo 'deb [ arch=amd64,arm64 signed-by=/usr/share/keyrings/mongodb-server-7.0.gpg ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/7.0 multiverse' > /etc/apt/sources.list.d/mongodb-org-7.0.list
apt-get update -y && apt-get install -y mongodb-org
systemctl enable --now mongod

echo '==> [4/8] Clone / update app'
mkdir -p $APP_DIR && cd $APP_DIR
if [ ! -d .git ]; then
  echo 'NOTE: Upload your code (git clone or rsync) to '$APP_DIR' first.'
  exit 1
fi

echo '==> [5/8] Install deps + build'
cd $APP_DIR
yarn install --frozen-lockfile
yarn build

echo '==> [6/8] Setup PM2'
mkdir -p /var/log/gillco
pm2 start ecosystem.config.js
pm2 save
pm2 startup systemd -u root --hp /root | tail -1 | bash || true

echo '==> [7/8] Nginx + SSL'
cp deploy/nginx.conf /etc/nginx/sites-available/gillcogroup
ln -sf /etc/nginx/sites-available/gillcogroup /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl reload nginx
certbot --nginx -d $DOMAIN -d www.$DOMAIN --non-interactive --agree-tos --register-unsafely-without-email --redirect

echo '==> [8/8] DONE'
echo "Visit: https://$DOMAIN"
pm2 status
