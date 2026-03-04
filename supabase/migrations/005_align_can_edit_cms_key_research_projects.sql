-- IFT v2.1: Align DB can_edit_cms_key with client cmsPermissions
-- research-projects maps to section "featured" in client; staff cannot edit featured.
-- Staff must NOT edit research-projects / research-project-ids (DB was previously more permissive).

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
    -- research-projects maps to "featured" section; staff cannot edit featured
    RETURN (p_key LIKE 'about-%' OR p_key LIKE 'team-%' OR p_key LIKE 'arts-%'
      OR p_key LIKE 'edu-%' OR p_key LIKE 'education-%' OR p_key LIKE 'events-%'
      OR (p_key LIKE 'research-%' AND p_key NOT LIKE 'research-projects%'));
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
