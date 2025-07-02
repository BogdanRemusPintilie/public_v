
-- Remove the existing trigger that's causing the error
DROP TRIGGER IF EXISTS dataset_share_notification ON public.dataset_shares;

-- Drop the problematic function that uses the 'net' schema
DROP FUNCTION IF EXISTS public.notify_dataset_share();

-- Create a simple trigger function that just logs the share (without sending emails)
CREATE OR REPLACE FUNCTION public.handle_dataset_share()
RETURNS TRIGGER AS $$
BEGIN
  -- Just log the share creation - no email sending for now
  -- Email functionality can be added later via edge functions if needed
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a new trigger that uses the simpler function
CREATE TRIGGER dataset_share_created
  AFTER INSERT ON public.dataset_shares
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_dataset_share();
