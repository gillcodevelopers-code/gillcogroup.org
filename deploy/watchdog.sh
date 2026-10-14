#!/usr/bin/env bash
# ============================================================
# GILLCO uptime watchdog (VPS). Cron runs it every 2 minutes.
# - Checks the website + database via /api/health
# - If down: restarts MongoDB / the website automatically
# - Emails you (via Resend) when the site goes DOWN, when it is
#   auto-fixed, and when it is back UP. Also warns at 90% disk.
# Recipients: ALERT_EMAIL (comma list) in .env.production, else LEAD_NOTIFY_EMAIL.
# Test it:   bash deploy/watchdog.sh --test
# ============================================================
set -uo pipefail
export PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin
APP_DIR="$(cd "$(dirname "$0")/.." && pwd)"
ENV_FILE="$APP_DIR/.env.production"
STATE_DIR=/var/lib/gillco; mkdir -p "$STATE_DIR"
STATE="$STATE_DIR/watchdog.state"; DISK_STATE="$STATE_DIR/disk.alerted"
HOST="$(hostname)"; NOW="$(date '+%d %b %Y %H:%M:%S %Z')"

getenv() { grep -E "^$1=" "$ENV_FILE" 2>/dev/null | tail -1 | cut -d= -f2- ; }
KEY="$(getenv RESEND_API_KEY)"
FROM="$(getenv RESEND_FROM)"; FROM="${FROM:-Gillco Monitor <onboarding@resend.dev>}"
TO="$(getenv ALERT_EMAIL)"; TO="${TO:-$(getenv LEAD_NOTIFY_EMAIL)}"
SITE="$(getenv NEXT_PUBLIC_SITE_URL)"; SITE="${SITE:-https://gillcogroup.org}"

send_mail() { # subject, html
  if [ -z "$KEY" ] || [ -z "$TO" ]; then echo "[$NOW] (email not configured) $1"; return 0; fi
  BODY="$(SUBJ="$1" HTML="$2" FROM="$FROM" TO="$TO" python3 -c 'import json,os;print(json.dumps({"from":os.environ["FROM"],"to":[x.strip() for x in os.environ["TO"].split(",") if x.strip()],"subject":os.environ["SUBJ"],"html":os.environ["HTML"]}))')"
  curl -fsS -m 20 -X POST https://api.resend.com/emails -H "Authorization: Bearer $KEY" -H 'Content-Type: application/json' -d "$BODY" >/dev/null \
    && echo "[$NOW] email sent: $1" || echo "[$NOW] !! email failed: $1"
}
check() { curl -fsS -m 15 http://127.0.0.1:3000/api/health 2>/dev/null | grep -q '"ok":true'; }
box() { echo "<div style=\"font-family:Arial;max-width:520px\"><h2 style=\"color:$1\">$2</h2><p>$3</p><p style=\"color:#64748b;font-size:12px\">Server: $HOST · $NOW · <a href=\"$SITE\">$SITE</a></p></div>"; }

if [ "${1:-}" = "--test" ]; then
  send_mail "✅ Gillco monitor test" "$(box '#0b4d3b' 'Uptime alerts are working' 'You will get an email here if gillcogroup.org goes down.')"; exit 0
fi

PREV="$(cat "$STATE" 2>/dev/null || echo up)"

if check; then
  if [ "$PREV" = "down" ]; then
    send_mail "✅ Gillco website is back UP" "$(box '#0b4d3b' 'Website is back up' "Everything is answering normally again at $SITE.")"
  fi
  echo up > "$STATE"
else
  # Try to self-heal before alerting
  FIX=""
  if ! systemctl is-active --quiet mongod; then systemctl restart mongod; FIX="database restarted; "; sleep 5; fi
  pm2 restart gillco-web >/dev/null 2>&1 && FIX="${FIX}website restarted"
  sleep 25
  if check; then
    send_mail "⚠️ Gillco website had a hiccup — fixed automatically" "$(box '#b45309' 'Recovered automatically' "The site stopped answering and was fixed by the server ($FIX). No action needed — if this repeats often, check: pm2 logs gillco-web")"
    echo up > "$STATE"
  elif [ "$PREV" != "down" ]; then
    send_mail "🚨 Gillco website is DOWN" "$(box '#b91c1c' 'Website is down' "The site is not answering and an automatic restart ($FIX) did not fix it. Log in to the VPS and run: <b>pm2 logs gillco-web</b> and <b>systemctl status mongod</b>.")"
    echo down > "$STATE"
  fi
fi

# Disk space warning (max once per day)
USE="$(df -P / | awk 'NR==2{gsub("%","",$5);print $5}')"
if [ "${USE:-0}" -ge 90 ]; then
  if [ ! -f "$DISK_STATE" ] || [ -n "$(find "$DISK_STATE" -mmin +1440 2>/dev/null)" ]; then
    send_mail "⚠️ Gillco server disk is ${USE}% full" "$(box '#b45309' "Disk ${USE}% full" 'Old backups live in /var/backups/gillco and uploads in public/uploads. Free some space soon so the site keeps working.')"
    touch "$DISK_STATE"
  fi
fi
