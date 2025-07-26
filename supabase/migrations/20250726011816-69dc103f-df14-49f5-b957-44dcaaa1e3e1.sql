-- Enable leaked password protection in auth settings
-- This updates the auth configuration to enable password breach protection
UPDATE auth.config SET leaked_password_protection = true;