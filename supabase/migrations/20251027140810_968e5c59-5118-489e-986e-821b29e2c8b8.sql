-- Update get_user_unique_datasets to query both loan_data and corporate_term_loans_data tables
DROP FUNCTION IF EXISTS public.get_user_unique_datasets(uuid);

CREATE OR REPLACE FUNCTION public.get_user_unique_datasets(input_user_id uuid)
RETURNS TABLE(dataset_name text, user_id uuid, loan_type text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $function$
  -- Get datasets from loan_data table
  SELECT 
    ld.dataset_name,
    ld.user_id,
    ld.loan_type::text as loan_type
  FROM loan_data ld
  WHERE ld.user_id = input_user_id
    AND ld.dataset_name IS NOT NULL
    AND ld.dataset_name != ''
  GROUP BY ld.dataset_name, ld.user_id, ld.loan_type
  
  UNION
  
  -- Get datasets from corporate_term_loans_data table
  SELECT 
    ctl.dataset_name,
    ctl.user_id,
    'corporate_term_loans'::text as loan_type
  FROM corporate_term_loans_data ctl
  WHERE ctl.user_id = input_user_id
    AND ctl.dataset_name IS NOT NULL
    AND ctl.dataset_name != ''
  GROUP BY ctl.dataset_name, ctl.user_id
  
  ORDER BY dataset_name;
$function$;