
-- 1) Clear phone_number on profile when verification becomes approved
CREATE OR REPLACE FUNCTION public.clear_profile_phone_on_approval()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.verification_status = 'approved'
     AND (TG_OP = 'INSERT' OR OLD.verification_status IS DISTINCT FROM 'approved') THEN
    UPDATE public.profiles
       SET phone_number = NULL
     WHERE id = NEW.user_id
       AND phone_number IS NOT NULL;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_clear_profile_phone_on_approval ON public.user_verifications;
CREATE TRIGGER trg_clear_profile_phone_on_approval
AFTER INSERT OR UPDATE OF verification_status ON public.user_verifications
FOR EACH ROW EXECUTE FUNCTION public.clear_profile_phone_on_approval();

-- 2) Backfill: remove phone numbers from already-approved users
UPDATE public.profiles p
   SET phone_number = NULL
  FROM public.user_verifications v
 WHERE v.user_id = p.id
   AND v.verification_status = 'approved'
   AND p.phone_number IS NOT NULL;

-- 3) Let users read their own suspension record
DROP POLICY IF EXISTS "Users can view their own suspension" ON public.user_suspensions;
CREATE POLICY "Users can view their own suspension"
ON public.user_suspensions
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);
