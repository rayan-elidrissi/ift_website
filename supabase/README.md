# Supabase Migrations

Run these migrations in order in the Supabase SQL Editor (Project → SQL Editor → New query).

## Run Order Checklist

| # | File | Purpose |
|---|------|---------|
| 1 | `001_create_cms_content.sql` | Creates `cms_content` table and RLS |
| 2 | `002_create_profiles_and_roles.sql` | Creates `profiles`, trigger, `is_global_admin()` |
| 3 | `003_cms_content_require_admin.sql` | Restricts CMS write to admins (superseded by 004) |
| 4 | `004_add_role_admin_staff_students.sql` | Role column, `can_edit_cms_key`, role-based policies |
| 5 | `005_align_can_edit_cms_key_research_projects.sql` | Aligns DB with client (research-projects → featured) |

## Dependencies

- **001** – No dependencies
- **002** – Depends on 001 (cms_content can exist independently; profiles uses auth.users)
- **003** – Depends on 002 (uses `is_global_admin()` and `profiles`)
- **004** – Depends on 002, 003 (replaces admin policies, adds role)
- **005** – Depends on 004 (updates `can_edit_cms_key`)

## Notes

- Do not skip or reorder migrations; RLS policies build on each other.
- After running 004, assign roles: `UPDATE public.profiles SET role = 'admin' WHERE email = 'your@email.com';`
