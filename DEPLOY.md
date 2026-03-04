# Deploy IFT Website to Vercel with Online CMS

This guide walks you through deploying the site to Vercel and enabling online content editing via Supabase.

## 1. Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and create a free account.
2. Create a new project (choose a region close to your users).
3. Wait for the project to be ready, then go to **Project Settings** → **API**.
4. Copy:
   - **Project URL** → `VITE_SUPABASE_URL`
   - **anon public** key → `VITE_SUPABASE_ANON_KEY`

## 2. Create the Database Schema

Run the migrations in order (SQL Editor → New query):

1. **001_create_cms_content.sql** – Creates `cms_content` table.
2. **002_create_profiles_and_roles.sql** – Creates `profiles` table and auto-creates a profile on signup.
3. **003_cms_content_require_admin.sql** – Restricts CMS edits to admins (temporary, superseded by 004).
4. **004_add_role_admin_staff_students.sql** – Adds 3 roles with section-based permissions.
5. **005_align_can_edit_cms_key_research_projects.sql** – Aligns DB permissions with client (research-projects → featured section).
6. **006_seed_cms_content_defaults.sql** – Seeds default CMS content keys (optional; skips keys that already exist).

### Role permissions

| Role      | Sections modifiable                                                         |
|-----------|------------------------------------------------------------------------------|
| **admin**   | All (hero, featured, about, research, arts, education, events, collaborate, footer) |
| **staff**   | About, Research, Arts, Education, Events                                     |
| **students** | Education only                                                             |

- Only users with a role can edit the CMS.
- Only **admin** can access `/dashboard` and assign roles.

### Assign roles

```sql
-- Promote to admin
UPDATE public.profiles SET role = 'admin' WHERE email = 'your@email.com';

-- Assign staff (about, research, arts, education, events)
UPDATE public.profiles SET role = 'staff' WHERE email = 'staff@ift.edu';

-- Assign students (education only)
UPDATE public.profiles SET role = 'students' WHERE email = 'student@ift.edu';
```

## 3. Configure Supabase Auth URLs

1. Go to **Authentication** → **URL Configuration**.
2. Set **Site URL** to your Vercel deployment (e.g. `https://your-project.vercel.app`).
3. Add to **Redirect URLs**:
   - `https://your-project.vercel.app/**` (email confirmation links)
   - `https://your-project.vercel.app/auth/callback` (Google OAuth callback)

For **Google OAuth**, also enable the provider in **Authentication** → **Providers** → **Google** and add the callback URL above.

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

## 6. Environment Variables

**Local development**: Copy `.env.example` to `.env` and fill in your Supabase values:

```bash
cp .env.example .env
```

**Vercel**: In your project **Settings** → **Environment Variables**:

| Name | Value | Environments |
|------|-------|--------------|
| `VITE_SUPABASE_URL` | `https://your-project.supabase.co` | Production, Preview |
| `VITE_SUPABASE_ANON_KEY` | Your anon key from Supabase | Production, Preview |
| `VITE_GATE_PASSWORD` | (optional) Single password for gate; if set with `VITE_ADMIN_EMAIL`, replaces Login form | Production, Preview |
| `VITE_ADMIN_EMAIL` | (optional) Email used when gate password is validated | Production, Preview |

**Password Gate**: If both `VITE_GATE_PASSWORD` and `VITE_ADMIN_EMAIL` are set, visitors see a single password prompt instead of the Login form. After entering the correct password, the app signs in with that email. Leave both empty to use the standard Login form.

Redeploy after adding env vars for them to take effect.

## 7. Using the CMS Online

1. Visit your deployed site (e.g. `https://your-project.vercel.app`).
2. Go to **Login** and sign in with an account that has a role (see "Assign roles" above).
3. Users with a role (admin, staff, or students) see the green **Edit** button; click it to enter edit mode.
4. Click editable fields to change content.
5. Click **Save Changes** in modals to save. Content is stored in Supabase and shared for all visitors.

## Fallback Without Supabase

If `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are not set, the app uses **localStorage** for the CMS. Changes stay only in that browser and are not shared or persistent across deployments.
