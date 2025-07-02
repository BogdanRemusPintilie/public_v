-- Drop the old trigger if it exists and create the correct one
DROP TRIGGER IF EXISTS dataset_share_created ON public.dataset_shares;
DROP TRIGGER IF EXISTS dataset_share_notification ON public.dataset_shares;

-- Create the trigger with the correct name that calls our function
CREATE TRIGGER dataset_share_notification
  AFTER INSERT ON public.dataset_shares
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_dataset_share();