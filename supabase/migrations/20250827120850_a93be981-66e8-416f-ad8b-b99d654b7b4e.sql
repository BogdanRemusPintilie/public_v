-- Create database functions for chart data calculation with filter support

-- Function to get maturity distribution data
CREATE OR REPLACE FUNCTION public.get_maturity_distribution(
  dataset_name_param text,
  min_loan_amount numeric DEFAULT NULL,
  max_loan_amount numeric DEFAULT NULL,
  min_interest_rate numeric DEFAULT NULL,
  max_interest_rate numeric DEFAULT NULL,
  min_remaining_term numeric DEFAULT NULL,
  max_remaining_term numeric DEFAULT NULL,
  min_pd numeric DEFAULT NULL,
  max_pd numeric DEFAULT NULL,
  min_lgd numeric DEFAULT NULL,
  max_lgd numeric DEFAULT NULL
)
RETURNS TABLE(range_name text, count bigint)
LANGUAGE sql
STABLE
AS $function$
  WITH filtered_data AS (
    SELECT term
    FROM loan_data ld
    WHERE ld.dataset_name = dataset_name_param
      AND ld.user_id = auth.uid()
      AND (min_loan_amount IS NULL OR ld.loan_amount >= min_loan_amount)
      AND (max_loan_amount IS NULL OR ld.loan_amount <= max_loan_amount)
      AND (min_interest_rate IS NULL OR ld.interest_rate >= min_interest_rate)
      AND (max_interest_rate IS NULL OR ld.interest_rate <= max_interest_rate)
      AND (min_remaining_term IS NULL OR ld.remaining_term >= min_remaining_term)
      AND (max_remaining_term IS NULL OR ld.remaining_term <= max_remaining_term)
      AND (min_pd IS NULL OR COALESCE(ld.pd, 0) >= min_pd)
      AND (max_pd IS NULL OR COALESCE(ld.pd, 0) <= max_pd)
      AND (min_lgd IS NULL OR COALESCE(ld.lgd, 0) >= min_lgd)
      AND (max_lgd IS NULL OR COALESCE(ld.lgd, 0) <= max_lgd)
  ),
  buckets AS (
    SELECT 'Up to 36 months' as range_name, 0 as min_val, 36 as max_val
    UNION ALL
    SELECT '37-60 months', 37, 60
    UNION ALL  
    SELECT '61-84 months', 61, 84
    UNION ALL
    SELECT 'More than 84 months', 85, 1000
  )
  SELECT 
    b.range_name,
    COUNT(fd.term) as count
  FROM buckets b
  LEFT JOIN filtered_data fd ON fd.term >= b.min_val AND fd.term <= b.max_val
  GROUP BY b.range_name, b.min_val
  ORDER BY b.min_val;
$function$;

-- Function to get loan size distribution data  
CREATE OR REPLACE FUNCTION public.get_loan_size_distribution(
  dataset_name_param text,
  min_loan_amount numeric DEFAULT NULL,
  max_loan_amount numeric DEFAULT NULL,
  min_interest_rate numeric DEFAULT NULL,
  max_interest_rate numeric DEFAULT NULL,
  min_remaining_term numeric DEFAULT NULL,
  max_remaining_term numeric DEFAULT NULL,
  min_pd numeric DEFAULT NULL,
  max_pd numeric DEFAULT NULL,
  min_lgd numeric DEFAULT NULL,
  max_lgd numeric DEFAULT NULL
)
RETURNS TABLE(range_name text, count bigint)
LANGUAGE sql
STABLE
AS $function$
  WITH filtered_data AS (
    SELECT opening_balance
    FROM loan_data ld
    WHERE ld.dataset_name = dataset_name_param
      AND ld.user_id = auth.uid()
      AND (min_loan_amount IS NULL OR ld.loan_amount >= min_loan_amount)
      AND (max_loan_amount IS NULL OR ld.loan_amount <= max_loan_amount)
      AND (min_interest_rate IS NULL OR ld.interest_rate >= min_interest_rate)
      AND (max_interest_rate IS NULL OR ld.interest_rate <= max_interest_rate)
      AND (min_remaining_term IS NULL OR ld.remaining_term >= min_remaining_term)
      AND (max_remaining_term IS NULL OR ld.remaining_term <= max_remaining_term)
      AND (min_pd IS NULL OR COALESCE(ld.pd, 0) >= min_pd)
      AND (max_pd IS NULL OR COALESCE(ld.pd, 0) <= max_pd)
      AND (min_lgd IS NULL OR COALESCE(ld.lgd, 0) >= min_lgd)
      AND (max_lgd IS NULL OR COALESCE(ld.lgd, 0) <= max_lgd)
  ),
  buckets AS (
    SELECT 'Up to €10k' as range_name, 0 as min_val, 10000 as max_val
    UNION ALL
    SELECT '€10k-€25k', 10000, 25000
    UNION ALL  
    SELECT '€25k-€50k', 25000, 50000
    UNION ALL
    SELECT '€50k-€100k', 50000, 100000
    UNION ALL
    SELECT 'More than €100k', 100000, 99999999999
  )
  SELECT 
    b.range_name,
    COUNT(fd.opening_balance) as count
  FROM buckets b
  LEFT JOIN filtered_data fd ON fd.opening_balance > b.min_val AND fd.opening_balance <= b.max_val
  GROUP BY b.range_name, b.min_val
  ORDER BY b.min_val;
$function$;