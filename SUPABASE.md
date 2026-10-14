# Switch Gillco Group to Supabase (Postgres + Storage)

The site now supports **two databases**:

| If this is set on Hostinger | The site uses |
|---|---|
| `DATABASE_URL` (Supabase) | **Supabase Postgres**. Uploads go to **Supabase Storage** |
| only `MONGO_URL` + `DB_NAME` | MongoDB Atlas (old setup) |

Nothing changes until you add `DATABASE_URL`, so you can switch without downtime.

---

## 1. Create the Supabase project (5 min)
1. Go to https://supabase.com, sign in, then click **New project**.
   - Name: `gillco`.
   - Database password: create a strong one, **save it**.
   - Region: **South Asia (Mumbai)**, the closest to your buyers.
2. Wait about 2 minutes until the project is ready.

## 2. Copy 3 values from Supabase
| Value | Where to find it |
|---|---|
| **Database connection string** | Top bar **Connect** → **Session pooler** → copy the `postgresql://postgres.xxxx:[YOUR-PASSWORD]@aws-0-ap-south-1.pooler.supabase.com:5432/postgres` string and replace `[YOUR-PASSWORD]` with your database password |
| **Project URL** | **Project Settings → Data API** (e.g. `https://xxxx.supabase.co`) |
| **Secret key** | **Project Settings → API Keys → Secret keys** (`sb_secret_…`). The older `service_role` key also works |

> If your database password contains `@ : / ? #` or spaces, change it to one without those characters (Supabase → Database → Settings → Reset password). Otherwise the connection string breaks.

## 3. Copy your data from MongoDB Atlas into Supabase
Send the values from step 2 plus your Atlas connection link to your developer (Emergent chat), or run this yourself from the project folder:
```bash
SOURCE_MONGO_URL="mongodb+srv://USER:PASS@cluster0.xxxx.mongodb.net/" \
SOURCE_DB_NAME="gillco" \
DATABASE_URL="postgresql://postgres.xxxx:PASS@aws-0-ap-south-1.pooler.supabase.com:5432/postgres" \
SUPABASE_URL="https://xxxx.supabase.co" \
SUPABASE_SECRET_KEY="sb_secret_xxxx" \
node scripts/migrate-to-supabase.mjs
```
It copies **every collection** (projects, settings, enquiries, news, team, posts, testimonials, history) and **every uploaded image and PDF**, then prints a count for each with `OK`. You can safely run it again; each run replaces the Supabase copy with the latest data.

*No Atlas access?* Skip this step. After step 4, open **Admin → Restore Backup** and pick a backup `.json` file. Uploaded images aren't in that file and would need re-uploading.

## 4. Switch the website (hPanel)
hPanel → your Node.js app → **Settings → Environment Variables**:

| Add / change | Value |
|---|---|
| `DATABASE_URL` | the Session pooler string from step 2 |
| `SUPABASE_URL` | `https://xxxx.supabase.co` |
| `SUPABASE_SECRET_KEY` | `sb_secret_…` |
| `STORAGE_BUCKET` | `gillco-media` |

Keep `MONGO_URL` and `DB_NAME` for now as a fallback. Click **Save**, then **Redeploy**.

## 5. Check it
Open `https://gillcogroup.org/api/health`. It should show:
```json
{"ok":true,"db":"up","provider":"supabase","media":"supabase-storage", ...}
```
Then check that the projects, images, blog and Admin CMS all work. Upload one test image in Admin.

**To roll back:** delete `DATABASE_URL` in hPanel and redeploy. The site goes back to MongoDB straight away.

## 6. After a week with no problems
- Remove `MONGO_URL` and `DB_NAME` from hPanel.
- Keep your Atlas cluster paused or deleted. Download one last backup first.

## Good to know
- **The database is protected.** The tables have Row Level Security switched on with no public rules, so Supabase's public API keys can't read your leads. Only the website server, using the database password, can.
- **Free plan limits:** 500 MB database, 1 GB storage, and 50 MB per file. Use YouTube links for videos.
- **Free projects pause after about 7 days with no activity.** Regular visitors and the every-minute escalation job keep it active. If it ever pauses, click **Restore** in the Supabase dashboard. The Pro plan never pauses.
- **Backups:** Admin → **Download Backup** works exactly as before.
