-- Give admin user (huruykid@gmail.com) 15 more invite codes
UPDATE public.user_invite_stats 
SET invites_remaining = invites_remaining + 15,
    updated_at = now()
WHERE user_id = (
  SELECT id FROM auth.users WHERE email = 'huruykid@gmail.com'
);