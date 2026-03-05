# Deploy IFT Website

This guide covers deploying the frontend (Vercel) and backend (Railway, Render, etc.) when using the API for CMS content.

---

## Overview

| Component | Host | Notes |
|-----------|------|------|
| **Frontend** (React/Vite) | Vercel | Static + SPA |
| **Backend** (FastAPI) | Railway, Render, Fly.io | Needs persistent storage for `db/` |

Vercel cannot run the backend (no persistent disk). Deploy the backend first, then the frontend with `VITE_API_URL` pointing to it.

---

## Step 1: Deploy the Backend

The backend stores CMS data in `backend/db/` (JSON files). Choose a host with persistent storage.

### Option A: Railway

1. Go to [railway.app](https://railway.app) and create a project.
2. **Add Service** → **GitHub Repo** → select your repo.
3. Set **Root Directory**: `backend`
4. Add a start command or use a `Procfile`:
   ```
   web: uvicorn app.main:app --host 0.0.0.0 --port $PORT
   ```
5. Add environment variables (Settings → Variables):
   - `CORS_ORIGINS` = `https://your-app.vercel.app` (add your Vercel URL)
   - `FRONTEND_URL` = `https://your-app.vercel.app`
   - `JWT_SECRET` = generate a random string (e.g. `openssl rand -hex 32`)
6. Railway assigns a URL like `https://xxx.railway.app`. Note it.

### Option B: Render

1. Go to [render.com](https://render.com) → **New** → **Web Service**.
2. Connect your repo, set **Root Directory** to `backend`.
3. **Build Command**: `pip install -r requirements.txt`
4. **Start Command**: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
5. Add environment variables (same as Railway).
6. Use the provided `.onrender.com` URL.

### Option C: Fly.io

1. Install [flyctl](https://fly.io/docs/hands-on/install-flyctl/).
2. In `backend/`, run `fly launch`.
3. Add a `fly.toml` with a persistent volume for `db/` if needed.
4. Set secrets: `fly secrets set CORS_ORIGINS=... FRONTEND_URL=... JWT_SECRET=...`

---

## Step 2: Deploy the Frontend to Vercel

### Option A: Import from Git

1. Push your project to GitHub.
2. Go to [vercel.com](https://vercel.com) → **Add New** → **Project**.
3. Import your repository.
4. Build settings:
   - **Build Command**: `npm run build`
   - **Output Directory**: `build` (Vite is configured with `outDir: 'build'`)
   - **Install Command**: `npm install`
5. Add environment variables:

   | Variable | Value |
   |----------|-------|
   | `VITE_API_URL` | `https://your-backend.railway.app` (your backend URL from Step 1) |
   | `VITE_GATE_PASSWORD` | (optional) Password for edit access |
   | `VITE_ADMIN_EMAIL` | (optional) e.g. `admin@example.com` |

6. Click **Deploy**.

### Option B: Vercel CLI

```bash
npm i -g vercel
vercel

# When prompted, add:
# - VITE_API_URL = https://your-backend.railway.app
# - VITE_GATE_PASSWORD (optional)
# - VITE_ADMIN_EMAIL (optional)
```

---

## Step 3: Update Backend CORS

After the first Vercel deploy, you have a URL like `https://your-project.vercel.app`. Update the backend:

- Set `CORS_ORIGINS` = `https://your-project.vercel.app`
- Set `FRONTEND_URL` = `https://your-project.vercel.app`

Redeploy the backend if needed. For multiple origins (preview URLs), use a comma-separated list:

```
CORS_ORIGINS=https://your-project.vercel.app,https://your-project-*.vercel.app
```

---

## Step 4: Migrate Content (if needed)

If you have content in localStorage from local development:

1. Run migration locally first (backend + frontend running).
2. Copy `backend/db/` to your production backend, or deploy the backend from a commit that includes the migrated `db/` folder. Alternatively, run the migration once against the production API (you’d need to expose `/migrate` or run it locally with `VITE_API_URL` pointing to production — use with caution).

---

## Environment Variables Summary

### Frontend (Vercel)

| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_API_URL` | Yes (with backend) | Full backend URL, e.g. `https://api-xyz.railway.app` |
| `VITE_GATE_PASSWORD` | No | Password for edit access |
| `VITE_ADMIN_EMAIL` | No | Admin email shown in UI |

### Backend (Railway / Render / Fly)

| Variable | Required | Description |
|----------|----------|-------------|
| `CORS_ORIGINS` | Yes | Comma-separated frontend URLs |
| `FRONTEND_URL` | Yes | Frontend URL (for OAuth redirects) |
| `JWT_SECRET` | Yes | Random string for JWT signing |
| `DB_PATH` | No | Default `./db` |
| `DB_UPLOAD_BASE_PATH` | No | Default `./uploads` |

---

## Without Backend (localStorage only)

If you skip the backend and use localStorage:

- Leave `VITE_API_URL` empty.
- Deploy only the frontend to Vercel.
- Content is stored in the browser; changes are not shared across devices.
