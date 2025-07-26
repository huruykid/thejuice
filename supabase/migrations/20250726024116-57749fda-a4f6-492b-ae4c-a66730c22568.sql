-- Enable required extensions for cron jobs
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Create cron job to generate blog posts hourly
SELECT cron.schedule(
  'auto-generate-blog-posts',
  '0 * * * *', -- Every hour at minute 0
  $$
  SELECT
    net.http_post(
        url:='https://mccehajzdnpkpusffhco.supabase.co/functions/v1/viral-content-generator',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1jY2VoYWp6ZG5wa3B1c2ZmaGNvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMzMDg2MTQsImV4cCI6MjA2ODg4NDYxNH0.W3ZvDkGaw2riwKiA5WuHCoaAwOMAh9rsu6_5J_4ucJY"}'::jsonb,
        body:='{"prompt": "Men are revolutionizing dating culture", "contentType": "blog", "keywords": ["dating advice for men", "male dating community", "men dating revolution"], "targetAudience": "men seeking dating advice"}'::jsonb
    ) as request_id;
  $$
);