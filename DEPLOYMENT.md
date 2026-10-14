# 🚀 Gillco Group — Production Deployment Guide

You have **two publishing paths**. Pick the one that fits your Hostinger plan.

| Path | Best if… | Cost | Setup Time |
|------|----------|------|-----------:|
| **A. Vercel + Hostinger domain** *(recommended)* | You want free hosting + fastest CDN | **₹0/mo** | ~30 min |
| **B. Hostinger VPS (KVM 1+)** | You want everything on Hostinger | ~₹399/mo | ~1 hour |

> ❌ **Hostinger Business / Premium Web Hosting will NOT work** — it doesn't support Node.js.
> If that's your current plan, either upgrade to a VPS **or** use Path A (keep the domain on Hostinger, host the app on Vercel free tier).

---

## 🅰️ Path A — Deploy to Vercel (Free) & keep domain on Hostinger

### 1. Prepare accounts (all free)
- [ ] Create GitHub account → push this repo to a new private repo
- [ ] Create a Vercel account → https://vercel.com/signup (sign in with GitHub)
- [ ] Create MongoDB Atlas account → https://cloud.mongodb.com → build a **free M0 cluster**
- [ ] Create Cloudinary account → https://cloudinary.com (needed because Vercel has no persistent disk for `/uploads`)

### 2. Get connection strings
- **Atlas:** Cluster → Connect → Drivers → copy the `mongodb+srv://...` URL. Add your admin user + allow IPs `0.0.0.0/0` under Network Access.
- **Cloudinary:** Dashboard → copy **Cloud Name / API Key / API Secret**.

### 3. Import repo into Vercel
1. Vercel Dashboard → **Add New → Project** → select your GitHub repo.
2. Framework: **Next.js** (auto-detected). Root dir: `./`. Build cmd: `yarn build`.
3. Under **Environment Variables** paste every var from `.env.production.example` (fill real values).
4. Click **Deploy**. First build ≈ 3 min.

### 4. Point Hostinger domain to Vercel
1. In **Vercel → Project → Settings → Domains**, add `gillcogroup.org` and `www.gillcogroup.org`. Vercel shows DNS records.
2. In **Hostinger → hPanel → Domains → DNS Zone Editor**:
   - Delete existing `A` record for `@`.
   - Add `A` record: **@** → `76.76.21.21`
   - Add `CNAME`: **www** → `cname.vercel-dns.com`
3. Wait 5–30 min for DNS. Vercel auto-provisions SSL.

### 5. ⚠️ Move `/uploads` to Cloudinary
Vercel resets the filesystem on every deploy, so `/public/uploads` won't persist. In `/app/api/[[...path]]/route.js` the `POST /api/upload` handler must upload to Cloudinary instead of writing to disk. Ask the agent to swap this in once you have the Cloudinary keys ready.

---

## 🅱️ Path B — Deploy to Hostinger VPS (Ubuntu 22.04 KVM)

### 1. Buy & provision VPS
- Hostinger hPanel → VPS → **KVM 1** (or bigger). OS: **Ubuntu 22.04 with Node.js** template (or plain Ubuntu 22.04).
- Note the VPS IP.

### 2. Point domain to VPS
- Hostinger DNS Zone Editor: `A @ → <VPS_IP>` and `A www → <VPS_IP>`. Wait for DNS.

### 3. SSH in
```bash
ssh root@<VPS_IP>
```

### 4. Upload code (choose one)
```bash
# option 1: via git
apt-get install -y git
mkdir -p /var/www && cd /var/www
git clone <your-repo-url> gillco

# option 2: via scp from your Mac/PC
scp -r ./app root@<VPS_IP>:/var/www/gillco
```

### 5. Set env file
```bash
cd /var/www/gillco
cp .env.production.example .env.production
nano .env.production   # fill in values (Mongo, domain, admin password)
```

### 6. Run the one-shot deploy script
```bash
cd /var/www/gillco
bash deploy/deploy-vps.sh
```
This installs Node 20, MongoDB, Nginx, PM2, builds the app, wires up Nginx + auto SSL via Let's Encrypt.

### 7. Verify
- Visit `https://gillcogroup.org`
- `pm2 status` should show `gillco-web` online
- `pm2 logs gillco-web` for live logs

### 8. Redeploy on future changes
```bash
cd /var/www/gillco
git pull
yarn install --frozen-lockfile
yarn build
pm2 restart gillco-web
```

---

## 🛡️ Post-launch checklist
- [ ] Change admin password in `.env.production` (`ADMIN_PASSWORD`) — default is `gillco2025`
- [ ] Test Admin CMS login at `/admin` (or footer link)
- [ ] Submit `https://gillcogroup.org/sitemap.xml` to Google Search Console
- [ ] Add Google Analytics 4 ID (`NEXT_PUBLIC_GA_ID`) and re-deploy
- [ ] Test WhatsApp `wa.me` lead routing end-to-end from a real phone
- [ ] Backup MongoDB weekly: `mongodump --uri=$MONGO_URL --out=/backups/$(date +%F)`

---

## 🔥 Performance tuning already applied
- ✅ All `<img>` tags have `loading="lazy" decoding="async"`
- ✅ Long-cache headers (`immutable`) on `/uploads/*` and `/_next/static/*`
- ✅ Gzip/Brotli via Nginx
- ✅ Font preconnect + `display=swap` (no flash of invisible text)
- ✅ DNS-prefetch for YouTube / gillcogroup.com
- ✅ Meraqui brochure compressed 18 MB → 5.3 MB (70% smaller)
- ✅ Mobile viewport, theme color, apple-web-app meta tags
- ✅ Organization JSON-LD schema for rich Google results
- ✅ Dynamic sitemap + robots.txt
- ✅ Security headers (CSP, Referrer, Permissions-Policy, HSTS via Nginx)

---

## Need help?
Ask the AI agent with any of these:
- "Switch uploads to Cloudinary"
- "Add GA4 with ID G-XXXX"
- "Wire up Twilio WhatsApp instant-send (need SID/token)"
- "Set up Resend email notifications for new leads"

## Lead email alerts, auto-escalation & GA4 (added)

Vercel → Project → Settings → Environment Variables:
- `RESEND_API_KEY` — from resend.com → API Keys (emails are OFF until this is set)
- `RESEND_FROM` — e.g. `Gillco Leads <leads@gillcogroup.org>` (domain must be verified in Resend → Domains)
- `CRON_SECRET` — any long random string (protects the escalation URL)
- optional `LEAD_NOTIFY_EMAIL` — fallback recipient if none set in Admin → Settings

Exact 15-minute escalation (works on any Vercel plan): create a free job at cron-job.org that calls
`https://gillcogroup.org/api/cron/escalate?key=<CRON_SECRET>` every 1–5 minutes.

GA4: Admin CMS → Settings → "GA4 Measurement ID" (G-XXXXXXX). Events sent: page_view, generate_lead, click_call, click_whatsapp.
