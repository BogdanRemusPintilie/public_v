-- Drop the existing function
DROP FUNCTION IF EXISTS public.get_dataset_summaries_optimized();

-- Recreate the function to include both loan_data and corporate_term_loans_data
CREATE OR REPLACE FUNCTION public.get_dataset_summaries_optimized()
RETURNS TABLE(
  dataset_name text,
  record_count bigint,
  total_value numeric,
  avg_interest_rate numeric,
  high_risk_count bigint,
  created_at timestamp with time zone,
  loan_type text
)
LANGUAGE sql
SET search_path TO 'public'
AS $function$
  -- Get datasets from loan_data table (consumer loans)
  SELECT 
    COALESCE(ld.dataset_name, 'Unnamed Dataset') as dataset_name,
    COUNT(*) as record_count,
    COALESCE(SUM(ld.opening_balance), 0) as total_value,
    COALESCE(AVG(ld.interest_rate), 0) as avg_interest_rate,
    COUNT(CASE WHEN COALESCE(ld.pd, 0) > 0.10 THEN 1 END) as high_risk_count,
    MIN(ld.created_at) as created_at,
    COALESCE(ld.loan_type, 'consumer_finance')::text as loan_type
  FROM loan_data ld
  WHERE ld.dataset_name IS NOT NULL 
    AND ld.dataset_name != ''
    AND ld.user_id = auth.uid()
  GROUP BY ld.dataset_name, ld.loan_type
  
  UNION ALL
  
  -- Get datasets from corporate_term_loans_data table
  SELECT 
    COALESCE(ctl.dataset_name, 'Unnamed Dataset') as dataset_name,
    COUNT(*) as record_count,
    COALESCE(SUM(ctl.current_balance), 0) as total_value,
    COALESCE(AVG(ctl.interest_rate), 0) as avg_interest_rate,
    COUNT(CASE WHEN COALESCE(ctl.pd, 0) > 10 THEN 1 END) as high_risk_count,
    MIN(ctl.created_at) as created_at,
    'corporate_term_loans'::text as loan_type
  FROM corporate_term_loans_data ctl
  WHERE ctl.dataset_name IS NOT NULL 
    AND ctl.dataset_name != ''
    AND ctl.user_id = auth.uid()
  GROUP BY ctl.dataset_name
  
  ORDER BY created_at DESC;
$function$;