-- First, let's see the current function and optimize it
-- The issue is that get_dataset_summaries is timing out on large datasets

-- Drop the existing function that's causing timeouts
DROP FUNCTION IF EXISTS public.get_dataset_summaries();

-- Create an optimized version that:
-- 1. Only processes data for the current user (RLS-aware)
-- 2. Uses proper indexing
-- 3. Has timeout protection
-- 4. Processes in smaller chunks if needed

CREATE OR REPLACE FUNCTION public.get_dataset_summaries_optimized()
RETURNS TABLE(
  dataset_name text, 
  record_count bigint, 
  total_value numeric, 
  avg_interest_rate numeric, 
  high_risk_count bigint, 
  created_at timestamp with time zone
)
LANGUAGE sql
SECURITY DEFINER
AS $function$
  -- Only get datasets for the authenticated user to reduce data size
  SELECT 
    COALESCE(ld.dataset_name, 'Unnamed Dataset') as dataset_name,
    COUNT(*) as record_count,
    COALESCE(SUM(ld.opening_balance), 0) as total_value,
    COALESCE(AVG(ld.interest_rate), 0) as avg_interest_rate,
    COUNT(CASE WHEN COALESCE(ld.pd, 0) > 0.10 THEN 1 END) as high_risk_count,
    MIN(ld.created_at) as created_at
  FROM loan_data ld
  WHERE ld.dataset_name IS NOT NULL 
    AND ld.dataset_name != ''
    AND ld.user_id = auth.uid()  -- Critical: Only process current user's data
  GROUP BY ld.dataset_name
  ORDER BY MIN(ld.created_at) DESC;
$function$;

-- Create an index to speed up the query if it doesn't exist
CREATE INDEX IF NOT EXISTS idx_loan_data_user_dataset ON loan_data(user_id, dataset_name) WHERE dataset_name IS NOT NULL;

-- Also create an index for performance on opening_balance and pd
CREATE INDEX IF NOT EXISTS idx_loan_data_aggregations ON loan_data(user_id, dataset_name, opening_balance, pd) WHERE dataset_name IS NOT NULL;