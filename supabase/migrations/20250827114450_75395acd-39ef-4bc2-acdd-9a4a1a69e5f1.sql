-- Update the get_portfolio_summary function to handle optional filters
CREATE OR REPLACE FUNCTION public.get_portfolio_summary(
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
RETURNS TABLE(total_value numeric, avg_interest_rate numeric, high_risk_loans bigint, total_records bigint)
LANGUAGE sql
STABLE
AS $function$
  SELECT 
    COALESCE(SUM(ld.opening_balance), 0) as total_value,
    COALESCE(AVG(ld.interest_rate), 0) as avg_interest_rate,
    COUNT(CASE WHEN COALESCE(ld.pd, 0) > 0.10 THEN 1 END) as high_risk_loans,
    COUNT(*) as total_records
  FROM loan_data ld
  WHERE ld.dataset_name = dataset_name_param
    AND ld.user_id = auth.uid()
    AND (min_loan_amount IS NULL OR ld.loan_amount >= min_loan_amount)
    AND (max_loan_amount IS NULL OR ld.loan_amount <= max_loan_amount)
    AND (min_interest_rate IS NULL OR ld.interest_rate >= min_interest_rate)
    AND (max_interest_rate IS NULL OR ld.interest_rate <= max_interest_rate)
    AND (min_remaining_term IS NULL OR CAST(ld.remaining_term AS numeric) >= min_remaining_term)
    AND (max_remaining_term IS NULL OR CAST(ld.remaining_term AS numeric) <= max_remaining_term)
    AND (min_pd IS NULL OR COALESCE(ld.pd, 0) >= min_pd)
    AND (max_pd IS NULL OR COALESCE(ld.pd, 0) <= max_pd)
    AND (min_lgd IS NULL OR COALESCE(ld.lgd, 0) >= min_lgd)
    AND (max_lgd IS NULL OR COALESCE(ld.lgd, 0) <= max_lgd);
$function$