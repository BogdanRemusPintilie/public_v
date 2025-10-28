-- Drop and recreate get_ctl_portfolio_summary with unit-safe logic and COALESCE
DROP FUNCTION IF EXISTS public.get_ctl_portfolio_summary(text, numeric, numeric, numeric, numeric, text);

CREATE OR REPLACE FUNCTION public.get_ctl_portfolio_summary(
  dataset_name_param text,
  min_loan_amount numeric DEFAULT NULL,
  max_loan_amount numeric DEFAULT NULL,
  min_leverage_ratio numeric DEFAULT NULL,
  max_leverage_ratio numeric DEFAULT NULL,
  credit_rating_filter text DEFAULT NULL
)
RETURNS TABLE(
  total_exposure numeric,
  avg_interest_rate numeric,
  high_risk_loans bigint,
  total_records bigint,
  avg_leverage_ratio numeric,
  performing_count bigint,
  non_performing_count bigint,
  weighted_avg_pd numeric,
  weighted_avg_lgd numeric,
  expected_loss numeric,
  avg_loan_size numeric
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  WITH normalized_data AS (
    SELECT
      current_balance,
      loan_amount,
      leverage_ratio,
      performing_status,
      -- Normalize PD to percentage (0-100 range)
      CASE 
        WHEN COALESCE(pd, probability_of_default) <= 1 
        THEN COALESCE(pd, probability_of_default, 0) * 100 
        ELSE COALESCE(pd, probability_of_default, 0)
      END as pd_pct,
      -- Normalize LGD to fraction (0-1 range)
      CASE 
        WHEN lgd > 1 THEN lgd / 100 
        ELSE lgd 
      END as lgd_frac,
      -- Normalize interest rate to percentage (0-100 range)
      CASE 
        WHEN interest_rate <= 1 THEN interest_rate * 100 
        ELSE interest_rate 
      END as ir_pct
    FROM corporate_term_loans_data
    WHERE dataset_name = dataset_name_param
      AND user_id = auth.uid()
      AND (min_loan_amount IS NULL OR loan_amount >= min_loan_amount)
      AND (max_loan_amount IS NULL OR loan_amount <= max_loan_amount)
      AND (min_leverage_ratio IS NULL OR leverage_ratio >= min_leverage_ratio)
      AND (max_leverage_ratio IS NULL OR leverage_ratio <= max_leverage_ratio)
      AND (credit_rating_filter IS NULL OR credit_rating = credit_rating_filter)
  )
  SELECT
    COALESCE(SUM(current_balance), 0) AS total_exposure,
    COALESCE(AVG(ir_pct), 0) AS avg_interest_rate,
    COUNT(*) FILTER (WHERE pd_pct > 10) AS high_risk_loans,
    COUNT(*) AS total_records,
    COALESCE(AVG(leverage_ratio), 0) AS avg_leverage_ratio,
    COUNT(*) FILTER (WHERE performing_status = 'performing') AS performing_count,
    COUNT(*) FILTER (WHERE performing_status != 'performing' OR performing_status IS NULL) AS non_performing_count,
    COALESCE(SUM(pd_pct * current_balance) / NULLIF(SUM(current_balance), 0), 0) AS weighted_avg_pd,
    COALESCE(100 * SUM(lgd_frac * current_balance) / NULLIF(SUM(current_balance), 0), 0) AS weighted_avg_lgd,
    COALESCE(SUM((pd_pct / 100) * lgd_frac * current_balance), 0) AS expected_loss,
    COALESCE(AVG(loan_amount), 0) AS avg_loan_size
  FROM normalized_data;
END;
$$;