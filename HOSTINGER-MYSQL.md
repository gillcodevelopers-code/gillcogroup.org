# Gillco Group: Next.js on Hostinger with a Hostinger MySQL database

The site is a **Next.js** app. It can now store everything in **Hostinger's own MySQL database**: projects, settings, leads, blog posts, testimonials, history **and uploaded images/PDFs**. The Admin CMS login uses **`ADMIN_USERNAME`** and **`ADMIN_PASSWORD`** from the environment variables.

---

## 1. Create the MySQL database (hPanel, 2 min)
1. hPanel → **Websites** → your site → **Databases → MySQL Databases**.
2. Create a new database:
   - Database name: `gillco` → hPanel makes it **`u123456789_gillco`**.
   - Username: `gillco` → **`u123456789_gillco`**.
   - Password: a strong one **without** spaces or quotes. Save it.
3. Write down the **full** database name and username, including the `u123456789_` part.

## 2. Environment variables (hPanel → Node.js app → Settings → Environment Variables)
| Name | Value |
|---|---|
| `MYSQL_HOST` | **`127.0.0.1`**. Not `localhost`, and not the `srvXXXX.hstgr.io` name |
| `MYSQL_PORT` | `3306` |
| `MYSQL_DATABASE` | `u123456789_gillco` |
| `MYSQL_USER` | `u123456789_gillco` |
| `MYSQL_PASSWORD` | the password from step 1 |
| `ADMIN_USERNAME` | the Admin CMS username you want, e.g. `gillcoadmin` |
| `ADMIN_PASSWORD` | a strong Admin CMS password (12+ characters) |
| `ADMIN_EMAIL` | `support@gillcogroup.org`. You can log in with this email **or** the username, using the same password |
| `NEXT_PUBLIC_SITE_URL` | `https://gillcogroup.org` |
| `NEXT_PUBLIC_BASE_URL` | `https://gillcogroup.org` |
| `CORS_ORIGINS` | `https://gillcogroup.org,https://www.gillcogroup.org` |
| `CRON_SECRET` | any long random text |

**Remove** `DATABASE_URL`, `MONGO_URL` and `DB_NAME`, or leave them empty, so the site doesn't try another database. The full commented list is in `.env.hostinger.example`.

Click **Save**, then **Redeploy**. The site creates its tables (`app_docs`, `app_media`, `app_media_chunks`) by itself on first start.

## 3. Check it
- Open `https://gillcogroup.org/api/health`. It should show `"provider":"mysql","media":"mysql"`.
- Open the **Admin CMS** and log in with `ADMIN_USERNAME` / `ADMIN_PASSWORD`.

An empty database starts with the built-in sample projects. To bring in your real data, do step 4.

## 4. Bring your existing data into MySQL (pick one)
**⭐ Easiest: the Import button (data + images, about 1 minute):**
1. MongoDB Atlas → **Network Access**: make sure `0.0.0.0/0` is allowed. It already is if Vercel worked.
2. Open the new site → **Admin CMS** → log in → **Import from MongoDB**.
3. Paste your Atlas link (`mongodb+srv://user:password@cluster0.xxxx.mongodb.net/`) and the database name (Atlas → **Browse Collections**, e.g. `gillco`).
4. Click **1. Check**. It shows how many projects, leads, posts and images it found.
5. Type **IMPORT** and click **2. Import now**. A backup of the current data downloads first, then everything is copied and the page reloads with your real content.
   The link is used once and never saved. You don't need the Remote MySQL setting.

**A. From a backup file:** if you have a `gillco-backup-….json` from **Admin → Download Backup**, log in to the new site, choose **Restore Backup**, pick the file and type RESTORE. Uploaded images aren't inside that file; re-upload them in the Admin CMS.

**B. Full copy from MongoDB Atlas (data and images):**
1. hPanel → **Databases → Remote MySQL** → add the IP address of the computer running the copy, or ask your developer for theirs. Select your database.
2. Use the **remote host** shown there (e.g. `srv1234.hstgr.io`) for this copy only:
```bash
SOURCE_MONGO_URL="mongodb+srv://USER:PASS@cluster0.xxxx.mongodb.net/" SOURCE_DB_NAME="gillco" \
MYSQL_HOST="srv1234.hstgr.io" MYSQL_DATABASE="u123456789_gillco" \
MYSQL_USER="u123456789_gillco" MYSQL_PASSWORD="your-db-password" \
node scripts/migrate-to-mysql.mjs
```
It prints a count for each collection with `OK`, plus the number of files copied. It's safe to run again.
3. Afterwards, remove the IP from **Remote MySQL**.

## 5. Admin login security (what changed)
- There's **no default password** anymore. If `ADMIN_USERNAME` or `ADMIN_PASSWORD` is missing, the Admin CMS stays locked.
- The server checks your login and gives the browser a secure session that lasts **12 hours**. **Every** edit, upload, delete, undo, backup, restore, and the leads list require that session. Visitors can still browse and send enquiries.
- **5 wrong attempts** from the same internet connection lock the login for **15 minutes**.
- To change the password, edit `ADMIN_PASSWORD` in hPanel and redeploy. Everyone is logged out automatically.

## 6. Good to know
- **Backups:** Hostinger takes automatic backups of MySQL. **Admin → Download Backup** still works too.
- **Uploads** are stored inside MySQL in small pieces, so they survive every redeploy. Keep single files under **50 MB** and use YouTube for videos.
- Check database size in hPanel → Databases. The Cloud Startup plan allows several GB.
