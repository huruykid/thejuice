-- Security Enhancement: Add additional security measures
-- Note: Some security settings must be configured through the Supabase dashboard

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

-- 3. Add additional security constraints
ALTER TABLE public.profiles 
ADD CONSTRAINT IF NOT EXISTS profiles_username_not_empty 
CHECK (length(trim(anonymous_username)) > 0);

ALTER TABLE public.stories 
ADD CONSTRAINT IF NOT EXISTS stories_content_not_empty 
CHECK (length(trim(content)) > 0);

-- 4. Create function to log extension status
CREATE OR REPLACE FUNCTION public.get_public_extensions()
RETURNS TABLE(extension_name text, can_be_moved boolean)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT 
    extname::text as extension_name,
    CASE 
      WHEN extname = 'pg_net' THEN false
      ELSE true
    END as can_be_moved
  FROM pg_extension e 
  JOIN pg_namespace n ON e.extnamespace = n.oid 
  WHERE nspname = 'public';
$$;