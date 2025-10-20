-- Drop and recreate the trigger function with proper permissions
DROP TRIGGER IF EXISTS trigger_auto_grant_data_access ON ndas;
DROP FUNCTION IF EXISTS public.auto_grant_data_access_on_nda_acceptance();

-- Create improved function to auto-grant data access when NDA is accepted
CREATE OR REPLACE FUNCTION public.auto_grant_data_access_on_nda_acceptance()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public, auth
LANGUAGE plpgsql
AS $$
DECLARE
  v_dataset_name TEXT;
  v_investor_email TEXT;
  v_share_exists BOOLEAN;
BEGIN
  -- Only proceed if status changed to 'accepted'
  IF NEW.status = 'accepted' AND (OLD.status IS NULL OR OLD.status != 'accepted') THEN
    -- Get the dataset name from the offer
    SELECT ts.dataset_name INTO v_dataset_name
    FROM public.offers o
    JOIN public.tranche_structures ts ON o.structure_id = ts.id
    WHERE o.id = NEW.offer_id;
    
    -- Get investor email from auth.users using auth schema
    SELECT email INTO v_investor_email
    FROM auth.users
    WHERE id = NEW.investor_id;
    
    RAISE NOTICE 'NDA Accepted - Dataset: %, Email: %', v_dataset_name, v_investor_email;
    
    -- Only create share if we have a dataset and email
    IF v_dataset_name IS NOT NULL AND v_investor_email IS NOT NULL THEN
      -- Check if share already exists
      SELECT EXISTS(
        SELECT 1 FROM public.dataset_shares
        WHERE owner_id = NEW.issuer_id
          AND dataset_name = v_dataset_name
          AND shared_with_user_id = NEW.investor_id
      ) INTO v_share_exists;
      
      IF NOT v_share_exists THEN
        -- Create dataset share
        INSERT INTO public.dataset_shares (
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
        );
        
        RAISE NOTICE 'Auto-granted data access for investor % to dataset %', v_investor_email, v_dataset_name;
      ELSE
        RAISE NOTICE 'Data access already exists for investor % to dataset %', v_investor_email, v_dataset_name;
      END IF;
    ELSE
      RAISE WARNING 'Cannot grant data access - Dataset: %, Email: %', v_dataset_name, v_investor_email;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger on ndas table
CREATE TRIGGER trigger_auto_grant_data_access
  AFTER UPDATE OF status ON ndas
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_grant_data_access_on_nda_acceptance();

-- Manually grant access for existing accepted NDAs
DO $$
DECLARE
  nda_record RECORD;
  v_dataset_name TEXT;
  v_investor_email TEXT;
BEGIN
  FOR nda_record IN 
    SELECT * FROM public.ndas WHERE status = 'accepted'
  LOOP
    -- Get dataset name
    SELECT ts.dataset_name INTO v_dataset_name
    FROM public.offers o
    JOIN public.tranche_structures ts ON o.structure_id = ts.id
    WHERE o.id = nda_record.offer_id;
    
    -- Get investor email
    SELECT email INTO v_investor_email
    FROM auth.users
    WHERE id = nda_record.investor_id;
    
    -- Create share if we have the data
    IF v_dataset_name IS NOT NULL AND v_investor_email IS NOT NULL THEN
      INSERT INTO public.dataset_shares (
        owner_id,
        dataset_name,
        shared_with_user_id,
        shared_with_email
      )
      VALUES (
        nda_record.issuer_id,
        v_dataset_name,
        nda_record.investor_id,
        v_investor_email
      )
      ON CONFLICT DO NOTHING;
    END IF;
  END LOOP;
END $$;