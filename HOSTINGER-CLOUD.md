> **Using Hostinger's MySQL database (recommended)? Follow [`HOSTINGER-MYSQL.md`](./HOSTINGER-MYSQL.md).**

> **Moving the database to Supabase? Follow [`SUPABASE.md`](./SUPABASE.md).** The Hostinger steps below stay the same.

# Gillco Group on Hostinger **Cloud Startup** (Node.js Web App + MongoDB Atlas)

The Cloud Startup plan runs Node.js apps, but you get **no server login and no MongoDB of its own**. So:
- **The database stays on MongoDB Atlas**, the same one the live site uses today. No data move is needed.
- **Uploaded images and PDFs are saved inside MongoDB.** Hostinger deletes the app's files on every redeploy, so files saved anywhere else would be lost.
- You test on Hostinger's free temporary address first, then switch `gillcogroup.org`.

Time: about 30 minutes. Downtime: none.

---

## 1. Before you start
1. In Emergent, click **"Save to GitHub"** to push the latest code.
2. Open Vercel → Project → Settings → **Environment Variables** and copy every value.
3. MongoDB Atlas → **Network Access**: make sure `0.0.0.0/0` is allowed. Hostinger Cloud doesn't use one fixed IP for outgoing connections.

## 2. Create the app (hPanel)
1. hPanel → **Websites → Add website → Node.js Apps** (Web App).
2. Choose **Import Git repository** → connect GitHub → pick the repo and the `main` branch.
3. Build settings (Hostinger normally fills these in when it detects Next.js):

| Setting | Value |
|---|---|
| Framework | Next.js |
| Node version | **22** |
| Install | `yarn install` (or leave the default) |
| Build command | `yarn build` |
| Start command | `yarn start` (`next start` picks up Hostinger's port automatically) |

4. **Environment Variables**: add the values below *before* the first build. The full commented list is in **`.env.hostinger.example`**. Variables starting with `NEXT_PUBLIC_` are baked in when the site is built.

| Name | Value |
|---|---|
| `MONGO_URL` | your Atlas `mongodb+srv://…` connection string (same as Vercel) |
| `DB_NAME` | same as Vercel |
| `ADMIN_PASSWORD` | same as Vercel (your Admin CMS password) |
| `NEXT_PUBLIC_SITE_URL` | `https://gillcogroup.org` |
| `NEXT_PUBLIC_BASE_URL` | `https://gillcogroup.org` |
| `CORS_ORIGINS` | `https://gillcogroup.org,https://www.gillcogroup.org` |
| `CRON_SECRET` | any long random text, e.g. from https://www.uuidgenerator.net |
| `UPLOAD_STORAGE` | `db` (saves uploads inside MongoDB so they survive redeploys) |
| `RESEND_API_KEY`, `RESEND_FROM`, `LEAD_NOTIFY_EMAIL` | *(optional, add them when you're ready for email alerts)* |
| `NEXT_PUBLIC_GA4_ID` | *(optional; you can paste the GA4 ID in Admin → Settings instead)* |

5. Click **Deploy**. The first build takes 3–5 minutes.

## 3. Test on the temporary address
Hostinger gives the app a free address (something like `xxxx.hostingersite.com`). Open it and check:
- [ ] The home page, projects, Awards Wall, blog and EMI calculator load. Your real data is there because it comes from Atlas.
- [ ] Enquiry form: matching projects appear and WhatsApp opens on submit.
- [ ] Admin CMS log-in works and **Download Backup** saves a file.
- [ ] **Upload a test image** in the Admin CMS. Click **Redeploy** in hPanel, then check the image still shows.

> Links, logos and canonical URLs on the temporary address point to `gillcogroup.org`. That's expected, because the site is built for the real domain.

## 4. Switch gillcogroup.org
1. hPanel → your Web App → **Domains → Connect domain** → `gillcogroup.org`, then add `www` too.
2. The domain is registered at Hostinger, so hPanel offers to update the DNS for you. Accept it. If you do it by hand, **remove the Vercel records** (`A @ 76.76.21.21` and `CNAME www cname.vercel-dns.com`) and add the records hPanel shows.
3. Wait 5–30 minutes. SSL is switched on automatically.
4. After about 3 days with no problems, remove the domain from Vercel and pause the Vercel project.

## 5. Scheduled jobs and alerts
- **Exact 15-minute lead escalation:** hPanel → **Advanced → Cron Jobs** → *Custom command*, every minute:
  ```
  curl -fsS -m 50 "https://gillcogroup.org/api/cron/escalate?key=YOUR_CRON_SECRET" >/dev/null
  ```
  If hPanel doesn't allow every minute, use the free https://cron-job.org with the same URL.
- **"Site is down" alerts:** create a free https://uptimerobot.com monitor on `https://gillcogroup.org/api/health`, every 5 minutes, with email alerts and push notifications in their app. Hostinger restarts the app by itself if it crashes.
- **Email alerts:** add the Resend values from the table above, redeploy, then use Admin → Settings → **Send test email**.

## 6. Backups
- The free Atlas tier (M0) **has no automatic backups**. Use **Admin → Download Backup** every week and keep the file in Google Drive. **Restore Backup** brings everything back in one click.
- The backup file covers all content and leads. **Uploaded images and PDFs aren't in it**; they stay safe in Atlas.
- Atlas free tier storage is **512 MB**. That's plenty for images and a few brochures, but don't upload videos; use YouTube links instead. If you get close to the limit, upgrade Atlas to the Flex tier.

## 7. Publishing changes
Make changes in Emergent → **Save to GitHub** → Hostinger rebuilds automatically if auto-deploy is on. Otherwise click **Redeploy** in hPanel.

## Your other 9 apps
Cloud Startup lets you add more Node.js apps the same way: one GitHub repo each, its own environment variables and its own domain.
