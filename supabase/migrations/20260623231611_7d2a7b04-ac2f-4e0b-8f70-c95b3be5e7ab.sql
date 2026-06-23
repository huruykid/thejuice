
-- 1. Harden stories update policy with WITH CHECK and extend trigger to protect is_seed
DROP POLICY IF EXISTS "Users can update their own stories" ON public.stories;
CREATE POLICY "Users can update their own stories"
ON public.stories FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (
  auth.uid() = user_id
  AND status = 'pending'
  AND is_seed = false
);

CREATE OR REPLACE FUNCTION public.protect_story_moderation_fields()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF public.current_user_has_role('admin'::public.app_role) THEN
    IF NEW.status IS DISTINCT FROM OLD.status THEN
      IF NEW.status = 'approved' THEN
        NEW.approved_at := now();
        NEW.approved_by := auth.uid();
      ELSE
        NEW.approved_at := NULL;
        NEW.approved_by := NULL;
      END IF;
    END IF;
  ELSE
    -- non-admins cannot alter moderation/seed fields
    NEW.status := OLD.status;
    NEW.approved_at := OLD.approved_at;
    NEW.approved_by := OLD.approved_by;
    NEW.is_seed := OLD.is_seed;
  END IF;
  RETURN NEW;
END;
$function$;

-- 2. Remove hardcoded ORANGE-2024 master invite code
CREATE OR REPLACE FUNCTION public.validate_invite_code(code_param text)
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO ''
AS $function$
BEGIN
  IF code_param IS NULL OR length(trim(code_param)) = 0 THEN
    RETURN false;
  END IF;

  RETURN EXISTS (
    SELECT 1 FROM public.invite_codes
    WHERE code = upper(code_param)
      AND used_by IS NULL
      AND expires_at > now()
  );
END;
$function$;

CREATE OR REPLACE FUNCTION public.use_invite_code(invite_code text, new_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
  invite_record RECORD;
  creator_id UUID;
BEGIN
  SELECT * INTO invite_record 
  FROM public.invite_codes 
  WHERE code = invite_code 
    AND used_by IS NULL 
    AND expires_at > now()
    AND created_by IS NOT NULL;
  
  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;
  
  creator_id := invite_record.created_by;
  
  UPDATE public.invite_codes 
  SET used_by = new_user_id, used_at = now()
  WHERE id = invite_record.id;
  
  UPDATE public.user_invite_stats 
  SET invites_used = invites_used + 1,
      updated_at = now()
  WHERE user_id = creator_id;
  
  RETURN TRUE;
END;
$function$;

DELETE FROM public.invite_codes WHERE upper(code) = 'ORANGE-2024';
