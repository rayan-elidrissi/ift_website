-- IFT v2.1: 3 roles (admin, staff, students) with section-based CMS permissions
-- Run after 002 and 003

-- Add role column
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS role TEXT CHECK (role IN ('admin', 'staff', 'students'));

-- Migrate existing global_admin to role (admins keep admin; others stay NULL until assigned)
UPDATE public.profiles SET role = 'admin' WHERE global_admin = TRUE;

-- Drop old RLS that relied on global_admin (we'll use role for profiles)
-- Keep profile policies but update for role-based admin check
DROP POLICY IF EXISTS "profiles_select_global_admin" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_global_admin" ON public.profiles;

CREATE POLICY "profiles_select_admin"
  ON public.profiles FOR SELECT
  USING (
    auth.uid() = id
    OR EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  );

CREATE POLICY "profiles_update_admin"
  ON public.profiles FOR UPDATE
  USING (         -- Only admins can update other admins' profiles
    auth.uid() = id
    OR EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  );

-- Users cannot change their own role (only admins can assign roles)
DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
CREATE POLICY "profiles_update_own"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id
    AND (role IS NOT DISTINCT FROM (SELECT p.role FROM public.profiles p WHERE p.id = auth.uid()))
  );

-- Function: can user with their role edit this CMS key?
CREATE OR REPLACE FUNCTION public.can_edit_cms_key(p_key TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_role TEXT;
BEGIN
  SELECT role INTO v_role FROM public.profiles WHERE id = auth.uid();
  IF v_role IS NULL THEN RETURN FALSE; END IF;
  IF v_role = 'admin' THEN RETURN TRUE; END IF;

  IF v_role = 'staff' THEN
    RETURN p_key LIKE 'about-%' OR p_key LIKE 'team-%' OR p_key LIKE 'research-%'
      OR p_key LIKE 'arts-%' OR p_key LIKE 'edu-%' OR p_key LIKE 'education-%'
      OR p_key LIKE 'events-%';
  END IF;

  IF v_role = 'students' THEN
    RETURN p_key LIKE 'edu-%' OR p_key LIKE 'education-%';
  END IF;

  RETURN FALSE;
END;
$$;

ALTER FUNCTION public.can_edit_cms_key(TEXT) SET row_security = on;
REVOKE ALL ON FUNCTION public.can_edit_cms_key(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.can_edit_cms_key(TEXT) TO authenticated;

-- Function: does user have any CMS role?
CREATE OR REPLACE FUNCTION public.has_cms_role()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role IN ('admin', 'staff', 'students')
  );
END;
$$;

ALTER FUNCTION public.has_cms_role() SET row_security = on;
REVOKE ALL ON FUNCTION public.has_cms_role() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.has_cms_role() TO authenticated;

-- Update cms_content policies: any user with a role can read; can_edit_cms_key for write
DROP POLICY IF EXISTS "cms_content_insert_policy" ON public.cms_content;
DROP POLICY IF EXISTS "cms_content_update_policy" ON public.cms_content;
DROP POLICY IF EXISTS "cms_content_delete_policy" ON public.cms_content;

CREATE POLICY "cms_content_insert_policy"
  ON public.cms_content FOR INSERT TO authenticated
  WITH CHECK (public.can_edit_cms_key(key));

CREATE POLICY "cms_content_update_policy"
  ON public.cms_content FOR UPDATE TO authenticated
  USING (public.can_edit_cms_key(key))
  WITH CHECK (public.can_edit_cms_key(key));

CREATE POLICY "cms_content_delete_policy"
  ON public.cms_content FOR DELETE TO authenticated
  USING (public.can_edit_cms_key(key));

-- Update handle_new_user: set default role for new users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', NEW.email),
    'students'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;
