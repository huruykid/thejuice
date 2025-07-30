-- Add audit fields to user_verifications table for tracking selfie deletion
ALTER TABLE public.user_verifications 
ADD COLUMN selfie_deleted_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN deleted_by UUID;