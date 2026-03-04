-- IFT v2.1: Restrict CMS edits to global admins only
-- Only users with profiles.global_admin = TRUE can insert/update/delete cms_content

-- Drop existing insert/update/delete policies
DROP POLICY IF EXISTS "cms_content_insert_policy" ON public.cms_content;
DROP POLICY IF EXISTS "cms_content_update_policy" ON public.cms_content;
DROP POLICY IF EXISTS "cms_content_delete_policy" ON public.cms_content;

-- New policies: only global admins can modify
CREATE POLICY "cms_content_insert_policy"
  ON public.cms_content FOR INSERT
  TO authenticated
  WITH CHECK (public.is_global_admin());

CREATE POLICY "cms_content_update_policy"
  ON public.cms_content FOR UPDATE
  TO authenticated
  USING (public.is_global_admin())
  WITH CHECK (public.is_global_admin());

CREATE POLICY "cms_content_delete_policy"
  ON public.cms_content FOR DELETE
  TO authenticated
  USING (public.is_global_admin());

-- NOTE: To promote your first admin, run in Supabase SQL Editor:
-- UPDATE public.profiles SET global_admin = TRUE WHERE email = 'your@email.com';
