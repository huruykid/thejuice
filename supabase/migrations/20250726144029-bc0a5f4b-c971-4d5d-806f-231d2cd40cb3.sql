-- Update the check constraint on reactions table to allow red_flag and green_flag
ALTER TABLE reactions DROP CONSTRAINT IF EXISTS check_reaction_type;

-- Add new constraint that allows the flag reaction types
ALTER TABLE reactions ADD CONSTRAINT check_reaction_type 
CHECK (reaction_type IN ('like', 'red_flag', 'green_flag'));