-- First, clean up duplicate verification records, keeping only the most recent one per user
WITH ranked_verifications AS (
  SELECT 
    id,
    user_id,
    ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY created_at DESC) as rn
  FROM user_verifications
),
duplicates_to_delete AS (
  SELECT id 
  FROM ranked_verifications 
  WHERE rn > 1
)
DELETE FROM user_verifications 
WHERE id IN (SELECT id FROM duplicates_to_delete);

-- Add unique constraint to prevent duplicate verifications per user
ALTER TABLE user_verifications 
ADD CONSTRAINT user_verifications_user_id_unique UNIQUE (user_id);