-- Fix get_dataset_summaries_optimized to use SECURITY INVOKER instead of SECURITY DEFINER
-- This ensures auth.uid() returns the current authenticated user's ID

CREATE OR REPLACE FUNCTION public.get_dataset_summaries_optimized()
RETURNS TABLE(dataset_name text, record_count bigint, total_value numeric, avg_interest_rate numeric, high_risk_count bigint, created_at timestamp with time zone)
LANGUAGE sql
SECURITY INVOKER
SET search_path = public
AS $$
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
    AND ld.user_id = auth.uid()
  GROUP BY ld.dataset_name
  ORDER BY MIN(ld.created_at) DESC;
$$;