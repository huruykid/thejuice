-- Admin "all members" view (applied to prod 2026-06-27): one row per profile with email
-- (from auth), verification status, and whether they've posted. Self-gated to admins (raises
-- if caller isn't an admin), so it's safe to grant to authenticated. Lets admins see every
-- signup — including those who haven't started verification yet and are otherwise invisible.
CREATE OR REPLACE FUNCTION public.admin_list_members()
RETURNS TABLE (
  user_id uuid,
  email text,
  anonymous_username text,
  city text,
  created_at timestamptz,
  verification_status text,
  has_post boolean
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'forbidden';
  END IF;
  RETURN QUERY
    SELECT
      p.user_id,
      u.email::text,
      p.anonymous_username,
      p.city,
      p.created_at,
      (SELECT v.verification_status FROM public.user_verifications v
         WHERE v.user_id = p.user_id ORDER BY v.created_at DESC LIMIT 1)::text,
      EXISTS (SELECT 1 FROM public.stories s
                WHERE s.user_id = p.user_id AND COALESCE(s.is_seed, false) = false)
    FROM public.profiles p
    LEFT JOIN auth.users u ON u.id = p.user_id
    ORDER BY p.created_at DESC;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_list_members() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_list_members() TO authenticated;
