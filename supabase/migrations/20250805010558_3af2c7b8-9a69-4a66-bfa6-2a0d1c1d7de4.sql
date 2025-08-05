-- Give admin user 50 additional invites
UPDATE public.user_invite_stats 
SET invites_remaining = invites_remaining + 50,
    updated_at = now()
WHERE user_id IN (
  SELECT user_id 
  FROM public.user_roles 
  WHERE role = 'admin'
);