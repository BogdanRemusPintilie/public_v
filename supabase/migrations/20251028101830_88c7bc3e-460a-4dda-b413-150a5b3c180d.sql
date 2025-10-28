-- Fix get_ctl_portfolio_summary to use correct column name
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
  SELECT
    COALESCE(SUM(current_balance), 0) AS total_exposure,
    COALESCE(AVG(interest_rate), 0) AS avg_interest_rate,
    COUNT(*) FILTER (WHERE pd > 10) AS high_risk_loans,
    COUNT(*) AS total_records,
    COALESCE(AVG(leverage_ratio), 0) AS avg_leverage_ratio,
    COUNT(*) FILTER (WHERE performing_status = 'performing') AS performing_count,
    COUNT(*) FILTER (WHERE performing_status != 'performing' OR performing_status IS NULL) AS non_performing_count,
    COALESCE(SUM(pd * current_balance) / NULLIF(SUM(current_balance), 0), 0) AS weighted_avg_pd,
    COALESCE(SUM(lgd * current_balance) / NULLIF(SUM(current_balance), 0), 0) AS weighted_avg_lgd,
    COALESCE(SUM((pd / 100) * (lgd / 100) * current_balance), 0) AS expected_loss,
    COALESCE(AVG(loan_amount), 0) AS avg_loan_size
  FROM corporate_term_loans_data
  WHERE dataset_name = dataset_name_param
    AND user_id = auth.uid()
    AND (min_loan_amount IS NULL OR loan_amount >= min_loan_amount)
    AND (max_loan_amount IS NULL OR loan_amount <= max_loan_amount)
    AND (min_leverage_ratio IS NULL OR leverage_ratio >= min_leverage_ratio)
    AND (max_leverage_ratio IS NULL OR leverage_ratio <= max_leverage_ratio)
    AND (credit_rating_filter IS NULL OR credit_rating = credit_rating_filter);
END;
$$;