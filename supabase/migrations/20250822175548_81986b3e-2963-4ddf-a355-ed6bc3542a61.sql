-- Remove phone number columns from profiles and stories tables
ALTER TABLE public.profiles DROP COLUMN IF EXISTS phone_number;
ALTER TABLE public.stories DROP COLUMN IF EXISTS subject_phone;

-- Drop invite code related tables
DROP TABLE IF EXISTS public.invite_codes;
DROP TABLE IF EXISTS public.user_invite_stats;

-- Drop invite code related functions
DROP FUNCTION IF EXISTS public.check_invite_generation_rate_limit(uuid);
DROP FUNCTION IF EXISTS public.generate_invite_code();
DROP FUNCTION IF EXISTS public.handle_new_user_invite_stats();
DROP FUNCTION IF EXISTS public.use_invite_code(text, uuid);

-- Remove triggers related to invite codes
DROP TRIGGER IF EXISTS tr_handle_new_user_invite_stats ON auth.users;