# Moving Gillco Group from Vercel to Hostinger (VPS + MongoDB on the same server)

**Plan:** set the new server up on a test address (`new.gillcogroup.org`) and check everything there.
Vercel stays live during the test. Then switch `gillcogroup.org` over.

Total time: about 1 hour. Downtime: none. During the switch, some visitors still reach Vercel for a few minutes while DNS updates.

---

## 0. Before you start (10 min)

1. **Code on GitHub** – In Emergent, click **"Save to GitHub"** in the chat input to push the latest code to a private repo.
2. **Copy your Vercel settings** – Vercel → Project → Settings → Environment Variables. Note down `ADMIN_PASSWORD`, `DB_NAME`, `MONGO_URL` (Atlas), and any `RESEND_*` values.
3. **Buy the VPS** – hPanel → VPS → **KVM 2** (recommended; KVM 1 also works) → OS template **Ubuntu 24.04** (plain). Note the **VPS IP**.

## 1. Point the test address at the VPS (2 min)

hPanel → Domains → gillcogroup.org → **DNS / Nameservers** → add the record below:

| Type | Name | Points to | TTL |
|------|------|-----------|-----|
| A | `new` | `<VPS IP>` | 300 |

While you're there, also set the **TTL of the existing `@` and `www` records to 300**. That makes the final switch quick.

## 2. Install everything with one command (15–20 min)

Open hPanel → VPS → **Browser terminal** (or `ssh root@<VPS IP>`), then run:

```bash
apt-get update -y && apt-get install -y git
mkdir -p /var/www && cd /var/www
git clone https://github.com/<you>/<repo>.git gillco      # use a GitHub token if the repo is private
cd gillco
DOMAIN=new.gillcogroup.org EMAIL=you@gillcogroup.org bash deploy/deploy-vps.sh
```

The script asks for the **Admin CMS password**. Type the same one you use on Vercel.
Avoid the characters `&`, `|` and `\` in it.

The script sets up:
- Node 22, the website build and PM2 (restarts the site automatically, including after a reboot)
- **MongoDB 8 on the same server.** It only listens locally and is protected by a password the script generates and saves in `.env.production`.
- Nginx and a free SSL certificate
- A firewall (only SSH and web ports are open)
- Two scheduled jobs:
  - the 15-minute lead escalation check, every minute
  - a nightly backup of the database and uploads (kept 14 days in `/var/backups/gillco`)

## 3. Copy your live data from Atlas (5 min)

1. MongoDB Atlas → **Network Access** → *Add IP Address* → enter the **VPS IP**.
2. On the VPS, run:

```bash
cd /var/www/gillco
ATLAS_URI='mongodb+srv://USER:PASS@cluster0.xxxx.mongodb.net' ATLAS_DB=<DB_NAME from Vercel> bash deploy/migrate-from-atlas.sh
```

It prints every collection with its count (projects, settings, enquiries, testimonials, news…).

## 4. Test on https://new.gillcogroup.org

- [ ] Home page, projects, project popup, Awards Wall, blog, EMI calculator and legal pages all load
- [ ] Enquiry form: matching projects appear, submitting opens WhatsApp
- [ ] Admin CMS log-in works and you see your real projects and enquiries
- [ ] **Upload a test image in the Admin CMS** and check that it shows on the site. Uploads are now stored permanently on the server.
- [ ] Settings → **Send test email** works (only if you added `RESEND_API_KEY` to `.env.production`)

> Images uploaded while the site ran on Vercel may already have been lost, because Vercel does not keep uploaded files. Re-upload any image that shows as a blank placeholder.

## 5. Switch gillcogroup.org to Hostinger

1. **Copy the data again** so you catch any leads that came in since step 3: run the same `migrate-from-atlas.sh` command.
2. In the hPanel DNS settings:
   - **Delete** the Vercel records: `A @ → 76.76.21.21` and `CNAME www → cname.vercel-dns.com`
   - **Add** `A @ → <VPS IP>` and `A www → <VPS IP>`
3. Wait 5–30 minutes. You can check progress at https://dnschecker.org with `gillcogroup.org`.
4. Re-run the setup for the real domain. This rebuilds the site with the new address and adds SSL for both `gillcogroup.org` and `www`:

```bash
cd /var/www/gillco
DOMAIN=gillcogroup.org WWW=1 EMAIL=you@gillcogroup.org bash deploy/deploy-vps.sh
```

5. After about 3 days with no issues:
   - In Vercel → Settings → Domains, remove the domain, then pause or delete the project.
   - Optionally delete the `new` DNS record.
   - Optionally pause the Atlas cluster.

## 6. Turn on email alerts (leads + "site is down")

1. Create a free account at https://resend.com.
2. Go to **Domains → Add `gillcogroup.org`** and add the DNS records it shows in hPanel. Wait until it says *Verified*.
3. Go to **API Keys → Create** and copy the key (starts with `re_`).
4. On the VPS run `nano /var/www/gillco/.env.production` and add:
   ```
   RESEND_API_KEY=re_xxxxxxxx
   RESEND_FROM=Gillco Alerts <alerts@gillcogroup.org>
   LEAD_NOTIFY_EMAIL=sales@gillcogroup.org
   ALERT_EMAIL=you@gillcogroup.org
   ```
5. Run `pm2 restart gillco-web`. Then run `bash deploy/watchdog.sh --test`; you should receive a test email.
6. In Admin CMS → Settings → *Email Alerts*, add the lead emails and click **Send test email**.

**How the "site is down" alert works:**
- **On the server:** every 2 minutes it checks the website and the database. If either stops answering, it restarts them by itself and emails you that it went down and whether the restart fixed it. When the site is back, you get a "back UP" email. It also warns you when the disk is 90% full.
- **Outside watcher, for when the whole VPS is off:** create a free account at https://uptimerobot.com.
  - Add a new monitor: type **HTTP(s)**, URL `https://gillcogroup.org/api/health`, check every 5 minutes, alert by email.
  - Optional: install the UptimeRobot mobile app to get push notifications.

## 7. Backups

- **Admin CMS → Download Backup** (top right) downloads a fresh `.json` copy of every project, enquiry, setting, team member, news item, post and testimonial. Do this once a week and keep the file in Google Drive.
- The server also takes an automatic nightly backup, kept 14 days in `/var/backups/gillco`.

## 8. Day-to-day

| Task | Command (run inside `/var/www/gillco`) |
|------|------------------------------|
| Publish new code from GitHub | `bash deploy/update.sh` (makes a backup first) |
| See live logs | `pm2 logs gillco-web` |
| Restart the site | `pm2 restart gillco-web` |
| Edit keys (Resend, GA4 fallback…) | `nano .env.production` then `pm2 restart gillco-web` (`NEXT_PUBLIC_*` keys need `bash deploy/update.sh`) |
| Manual backup | `bash deploy/backup-mongo.sh` |
| Restore a backup | `mongorestore --uri="$(grep ^MONGO_URL .env.production \| cut -d= -f2-)" --archive=/var/backups/gillco/db-XXXX.gz --gzip --drop` |

---

## Alternative: Hostinger Business / Cloud plan (Node.js Web App)

Use this only if you don't want a VPS. These plans **cannot run MongoDB themselves**, so the database stays on **MongoDB Atlas**.

1. hPanel → Websites → **Add website → Node.js app** → connect your GitHub repo.
2. Framework **Next.js**, Node **22**, build command `yarn build`, start command `yarn start`.
3. Add the environment variables: `MONGO_URL` (Atlas), `DB_NAME`, `ADMIN_PASSWORD`, `NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_BASE_URL`, `CORS_ORIGINS`, `CRON_SECRET`, plus `RESEND_*` if you use email alerts.
4. In Atlas → Network Access, allow `0.0.0.0/0` (the plan has no fixed outgoing IP).
5. Exact 15-minute escalation: create a free job at https://cron-job.org that calls `https://gillcogroup.org/api/cron/escalate?key=<CRON_SECRET>` every minute.
6. ⚠ Uploaded files may be wiped on each redeploy on this plan. **The VPS route above is recommended for this site.**
