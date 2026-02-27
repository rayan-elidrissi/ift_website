# Deploy IFT Website to Vercel with Online CMS

This guide walks you through deploying the site to Vercel and enabling online content editing via Supabase.

## 1. Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and create a free account.
2. Create a new project (choose a region close to your users).
3. Wait for the project to be ready, then go to **Project Settings** → **API**.
4. Copy:
   - **Project URL** → `VITE_SUPABASE_URL`
   - **anon public** key → `VITE_SUPABASE_ANON_KEY`

## 2. Create the CMS Table

1. In Supabase, open **SQL Editor**.
2. Click **New query**.
3. Paste the contents of `supabase/migrations/001_create_cms_content.sql`.
4. Click **Run**.

This creates the `cms_content` table and Row Level Security (RLS) policies so that:
- Everyone can read content.
- Only authenticated users can create, update, or delete content.

## 3. Configure Supabase Auth URLs

1. Go to **Authentication** → **URL Configuration**.
2. Set **Site URL** to your Vercel deployment (e.g. `https://your-project.vercel.app`).
3. Add `https://your-project.vercel.app/**` to **Redirect URLs** (for email confirmation links).

## 4. Enable Email Auth (Optional)

By default, Supabase email confirmation is enabled. For faster setup:

1. Go to **Authentication** → **Providers** → **Email**.
2. You can disable **Confirm email** for testing (not recommended for production).

To add your first editor:
1. Go to **Authentication** → **Users**.
2. Click **Add user** → **Create new user**.
3. Enter email and password, then create the user.
4. Or use the **Sign up** link on the Login page of your deployed site.

## 5. Deploy to Vercel

### Option A: Import from Git

1. Push your project to GitHub.
2. Go to [vercel.com](https://vercel.com) and **Add New** → **Project**.
3. Import your repository.
4. Vercel will auto-detect Vite. The build settings should be:
   - **Build Command:** `npm run build`
   - **Output Directory:** `build`
5. Add Environment Variables (see below).
6. Click **Deploy**.

### Option B: Vercel CLI

```bash
npm i -g vercel
vercel
# Follow prompts, add env vars when asked
```

## 6. Environment Variables on Vercel

In your Vercel project: **Settings** → **Environment Variables**:

| Name | Value | Environments |
|------|-------|--------------|
| `VITE_SUPABASE_URL` | `https://your-project.supabase.co` | Production, Preview |
| `VITE_SUPABASE_ANON_KEY` | Your anon key from Supabase | Production, Preview |

Redeploy after adding env vars for them to take effect.

## 7. Using the CMS Online

1. Visit your deployed site (e.g. `https://your-project.vercel.app`).
2. Go to **Login** and sign in with a Supabase account that has edit access.
3. The green **Edit** button appears; click it to enter edit mode.
4. Click editable fields to change content.
5. Click **Save Changes** in modals to save. Content is stored in Supabase and shared for all visitors.

## Fallback Without Supabase

If `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are not set, the app uses **localStorage** for the CMS. Changes stay only in that browser and are not shared or persistent across deployments.
