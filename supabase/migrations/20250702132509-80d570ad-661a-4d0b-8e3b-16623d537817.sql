
-- Create table for dataset shares
CREATE TABLE IF NOT EXISTS public.dataset_shares (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dataset_name TEXT NOT NULL,
  owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  shared_with_email TEXT NOT NULL,
  shared_with_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.dataset_shares ENABLE ROW LEVEL SECURITY;

-- Policies for dataset shares
CREATE POLICY "Users can view shares they own or are shared with"
  ON public.dataset_shares
  FOR SELECT
  USING (
    auth.uid() = owner_id OR 
    auth.uid() = shared_with_user_id OR
    auth.email() = shared_with_email
  );

CREATE POLICY "Users can create shares for their own datasets"
  ON public.dataset_shares
  FOR INSERT
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Users can delete shares they own"
  ON public.dataset_shares
  FOR DELETE
  USING (auth.uid() = owner_id);

-- Create edge function for sending share notification emails
CREATE OR REPLACE FUNCTION public.notify_dataset_share()
RETURNS TRIGGER AS $$
BEGIN
  -- This will be handled by the edge function
  PERFORM net.http_post(
    url := current_setting('app.supabase_url') || '/functions/v1/send-share-notification',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.supabase_anon_key')
    ),
    body := jsonb_build_object(
      'dataset_name', NEW.dataset_name,
      'owner_email', (SELECT email FROM auth.users WHERE id = NEW.owner_id),
      'shared_with_email', NEW.shared_with_email
    )
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for email notifications
CREATE TRIGGER dataset_share_notification
  AFTER INSERT ON public.dataset_shares
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_dataset_share();
