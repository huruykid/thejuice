-- Security Enhancement: Add additional security measures

-- 1. Create a security configuration tracking table
CREATE TABLE IF NOT EXISTS public.security_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_name text NOT NULL UNIQUE,
  is_enabled boolean NOT NULL DEFAULT false,
  configured_at timestamp with time zone DEFAULT now(),
  notes text
);

-- Enable RLS on security config
ALTER TABLE public.security_config ENABLE ROW LEVEL SECURITY;

-- Only admins can view security config
CREATE POLICY "Admins can manage security config" 
ON public.security_config 
FOR ALL 
USING (current_user_has_role('admin'::app_role));

-- 2. Insert current security status
INSERT INTO public.security_config (setting_name, is_enabled, notes) VALUES
('leaked_password_protection', false, 'Must be enabled manually in Supabase Auth settings'),
('pg_net_extension_public', true, 'pg_net extension cannot be moved from public schema - this is expected')
ON CONFLICT (setting_name) DO UPDATE SET 
  configured_at = now(),
  notes = EXCLUDED.notes;

-- 3. Add additional security constraints (check if they don't exist first)
DO $$
BEGIN
  -- Add username constraint if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.check_constraints 
    WHERE constraint_name = 'profiles_username_not_empty'
  ) THEN
    ALTER TABLE public.profiles 
    ADD CONSTRAINT profiles_username_not_empty 
    CHECK (length(trim(anonymous_username)) > 0);
  END IF;
  
  -- Add story content constraint if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.check_constraints 
    WHERE constraint_name = 'stories_content_not_empty'
  ) THEN
    ALTER TABLE public.stories 
    ADD CONSTRAINT stories_content_not_empty 
    CHECK (length(trim(content)) > 0);
  END IF;
END $$;