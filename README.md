# Gillco Group — Corporate Website

A premium, SEO-first real-estate corporate website for **Gillco Group** (Punjab's leading luxury developer since 2001). Built with **Next.js 15 + MongoDB + Tailwind + shadcn/ui**.

**Live demo:** _pending deploy_

---

## ✨ Features

- 🏗️ **Project browsing** — delivered / ongoing / soft-launch projects with rich detail pages, image galleries and compare view
- ⏳ **Soft-launch priority countdown** — live-ticking timer + slot counter for the Meraqui launch
- 🎬 **YouTube video playlist** — curated Meraqui reels + full playlist gallery
- 💬 **Smart WhatsApp routing** — round-robin lead distribution across sales team with 15-min manager escalation
- 📄 **PDF brochure export** — compressed (18 MB → 5.3 MB) for fast downloads
- 🛠️ **In-app Admin CMS** — drag-and-drop media uploader, full project/team/news CRUD, change-history with undo
- 📱 **Fully mobile responsive** with proper viewport, theme color, apple-web-app tags
- 🔍 **SEO ready** — dynamic sitemap, robots.txt, Open Graph, Twitter cards, JSON-LD Organization schema
- ⚡ **Performance** — lazy-load images, long-cache headers, font `display=swap`, DNS-prefetch, gzip via Nginx

---

## 🚀 Deploy

Full step-by-step guide in **[`DEPLOYMENT.md`](./DEPLOYMENT.md)**. Two paths:

| Path | Cost | Time |
|------|-----:|-----:|
| **Vercel free + Hostinger domain** *(recommended)* | ₹0/mo | 30 min |
| **Hostinger VPS KVM 1** | ~₹399/mo | 1 hour |

### One-shot Hostinger VPS deploy
```bash
ssh root@<VPS_IP>
git clone <this-repo> /var/www/gillco && cd /var/www/gillco
cp .env.production.example .env.production && nano .env.production
bash deploy/deploy-vps.sh
```

---

## 🧑‍💻 Local development

```bash
yarn install
cp .env.production.example .env
# edit MONGO_URL to mongodb://localhost:27017
yarn dev
```

Open **http://localhost:3000**. Admin CMS: footer → **Admin CMS** (default password: `<ADMIN_PASSWORD>`).

---

## 📁 Project structure

```
app/
├── app/
│   ├── api/[[...path]]/route.js  # Monolithic API (projects, uploads, enquiries, history)
│   ├── page.js                   # Monolithic frontend + Admin CMS
│   ├── layout.js                 # SEO metadata, JSON-LD, fonts
│   ├── robots.js / sitemap.js    # SEO
│   └── globals.css
├── public/uploads/               # Persistent media (images, videos, brochures)
├── deploy/                       # nginx.conf + deploy-vps.sh
├── ecosystem.config.js           # PM2 config for VPS
├── vercel.json                   # Vercel config
├── next.config.js                # Caching, security headers, image config
└── DEPLOYMENT.md
```

---

## 🔐 Environment variables

See **`.env.production.example`** for the full list. Minimum required:

```
MONGO_URL=mongodb+srv://...
DB_NAME=gillco
NEXT_PUBLIC_SITE_URL=https://gillcogroup.org
ADMIN_PASSWORD=change-me
```

Optional integrations (add whenever ready):
- `TWILIO_*` — server-side instant WhatsApp
- `RESEND_API_KEY` — email lead notifications
- `CLOUDINARY_*` — media uploads on Vercel (no persistent disk)
- `NEXT_PUBLIC_GA_ID` — Google Analytics 4

---

## 📜 License

© Gillco Group. All rights reserved.
