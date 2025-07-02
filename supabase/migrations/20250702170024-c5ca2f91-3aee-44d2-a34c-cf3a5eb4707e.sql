-- Enable the pg_net extension for HTTP requests
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Update the trigger function to use proper net.http_post with pg_net
CREATE OR REPLACE FUNCTION public.handle_dataset_share()
RETURNS TRIGGER AS $$
DECLARE
  owner_email TEXT;
  request_id BIGINT;
BEGIN
  -- Get the owner's email
  SELECT email INTO owner_email
  FROM auth.users 
  WHERE id = NEW.owner_id;
  
  -- Call the edge function to send email notification using pg_net
  SELECT net.http_post(
    url := 'https://oaormiiytqivgahmtxfj.supabase.co/functions/v1/send-share-notification',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9hb3JtaWl5dHFpdmdhaG10eGZqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA2ODc0NTMsImV4cCI6MjA2NjI2MzQ1M30.XKAPReT-dl0858PkmUktOM0T8_ERwYH8O9ndWc_IVes'
    ),
    body := jsonb_build_object(
      'dataset_name', NEW.dataset_name,
      'owner_email', owner_email,
      'shared_with_email', NEW.shared_with_email
    )
  ) INTO request_id;
  
  -- Log the request for debugging
  RAISE NOTICE 'Email notification request sent with ID: %', request_id;
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log the error but don't prevent the share from being created
    RAISE NOTICE 'Failed to send email notification: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;