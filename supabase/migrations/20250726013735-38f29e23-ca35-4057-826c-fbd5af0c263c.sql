-- CRITICAL SECURITY FIX: Protect PII in verification selfies
-- Make verification-selfies bucket private to prevent unauthorized access to facial images

-- 1. Make verification-selfies bucket private (protects PII)
UPDATE storage.buckets 
SET public = false 
WHERE id = 'verification-selfies';

-- 2. Drop existing policies if they exist, then recreate them
DO $$ 
BEGIN
    -- Drop existing policies for verification-selfies
    DROP POLICY IF EXISTS "Users can upload their own verification selfies" ON storage.objects;
    DROP POLICY IF EXISTS "Users can view their own verification selfies" ON storage.objects;
    DROP POLICY IF EXISTS "Users can update their own verification selfies" ON storage.objects;
    DROP POLICY IF EXISTS "Users can delete their own verification selfies" ON storage.objects;
    DROP POLICY IF EXISTS "Admins can view all verification selfies" ON storage.objects;
    
    -- Drop existing policies for story-images
    DROP POLICY IF EXISTS "Users can upload their own story images" ON storage.objects;
    DROP POLICY IF EXISTS "Anyone can view story images" ON storage.objects;
    DROP POLICY IF EXISTS "Users can update their own story images" ON storage.objects;
    DROP POLICY IF EXISTS "Users can delete their own story images" ON storage.objects;
END $$;

-- Create RLS policies for verification-selfies bucket
CREATE POLICY "Users can upload their own verification selfies"
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'verification-selfies' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view their own verification selfies"
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'verification-selfies' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own verification selfies"
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'verification-selfies' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own verification selfies"
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'verification-selfies' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Admins can view all verification selfies (for moderation purposes)
CREATE POLICY "Admins can view all verification selfies"
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'verification-selfies' AND current_user_has_role('admin'::app_role));

-- Create RLS policies for story-images bucket
CREATE POLICY "Users can upload their own story images"
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'story-images' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Anyone can view story images"
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'story-images');

CREATE POLICY "Users can update their own story images"
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'story-images' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own story images"
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'story-images' AND auth.uid()::text = (storage.foldername(name))[1]);

-- 4. Create audit logging for sensitive file access (only if table doesn't exist)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'file_access_logs') THEN
        CREATE TABLE public.file_access_logs (
          id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
          user_id uuid NOT NULL,
          bucket_id text NOT NULL,
          object_path text NOT NULL,
          action text NOT NULL, -- 'view', 'upload', 'update', 'delete'
          ip_address inet,
          user_agent text,
          created_at timestamp with time zone NOT NULL DEFAULT now()
        );

        -- Enable RLS on audit logs
        ALTER TABLE public.file_access_logs ENABLE ROW LEVEL SECURITY;

        -- Only admins can view audit logs
        CREATE POLICY "Admins can view file access logs"
        ON public.file_access_logs 
        FOR SELECT 
        USING (current_user_has_role('admin'::app_role));

        -- System can insert audit logs
        CREATE POLICY "System can insert file access logs"
        ON public.file_access_logs 
        FOR INSERT 
        WITH CHECK (true);
    END IF;
END $$;

-- 5. Create function to log file access (for future audit trails)
CREATE OR REPLACE FUNCTION public.log_file_access(
  p_user_id uuid,
  p_bucket_id text,
  p_object_path text,
  p_action text,
  p_ip_address inet DEFAULT NULL,
  p_user_agent text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.file_access_logs (
    user_id, 
    bucket_id, 
    object_path, 
    action, 
    ip_address, 
    user_agent
  )
  VALUES (
    p_user_id, 
    p_bucket_id, 
    p_object_path, 
    p_action, 
    p_ip_address, 
    p_user_agent
  );
END;
$$;