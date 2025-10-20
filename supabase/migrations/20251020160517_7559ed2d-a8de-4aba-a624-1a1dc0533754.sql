-- Create function to auto-grant data access when NDA is accepted
CREATE OR REPLACE FUNCTION public.auto_grant_data_access_on_nda_acceptance()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  v_dataset_name TEXT;
  v_investor_email TEXT;
BEGIN
  -- Only proceed if status changed to 'accepted'
  IF NEW.status = 'accepted' AND (OLD.status IS NULL OR OLD.status != 'accepted') THEN
    -- Get the dataset name from the offer
    SELECT ts.dataset_name INTO v_dataset_name
    FROM offers o
    JOIN tranche_structures ts ON o.structure_id = ts.id
    WHERE o.id = NEW.offer_id;
    
    -- Get investor email from auth.users
    SELECT email INTO v_investor_email
    FROM auth.users
    WHERE id = NEW.investor_id;
    
    -- Only create share if we have a dataset and email
    IF v_dataset_name IS NOT NULL AND v_investor_email IS NOT NULL THEN
      -- Create dataset share (ignore if already exists)
      INSERT INTO dataset_shares (
        owner_id,
        dataset_name,
        shared_with_user_id,
        shared_with_email
      )
      VALUES (
        NEW.issuer_id,
        v_dataset_name,
        NEW.investor_id,
        v_investor_email
      )
      ON CONFLICT DO NOTHING;
      
      RAISE NOTICE 'Auto-granted data access for investor % to dataset %', v_investor_email, v_dataset_name;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger on ndas table
DROP TRIGGER IF EXISTS trigger_auto_grant_data_access ON ndas;

CREATE TRIGGER trigger_auto_grant_data_access
  AFTER UPDATE OF status ON ndas
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_grant_data_access_on_nda_acceptance();