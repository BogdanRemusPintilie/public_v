-- Drop the old function and recreate with additional metrics
DROP FUNCTION IF EXISTS get_ctl_portfolio_summary(text, numeric, numeric, numeric, numeric, text);

CREATE OR REPLACE FUNCTION get_ctl_portfolio_summary(
  dataset_name_param TEXT,
  min_loan_amount NUMERIC DEFAULT NULL,
  max_loan_amount NUMERIC DEFAULT NULL,
  min_leverage_ratio NUMERIC DEFAULT NULL,
  max_leverage_ratio NUMERIC DEFAULT NULL,
  credit_rating_filter TEXT DEFAULT NULL
)
RETURNS TABLE (
  total_exposure NUMERIC,
  avg_interest_rate NUMERIC,
  high_risk_loans BIGINT,
  total_records BIGINT,
  avg_leverage_ratio NUMERIC,
  performing_count BIGINT,
  non_performing_count BIGINT,
  weighted_avg_pd NUMERIC,
  weighted_avg_lgd NUMERIC,
  expected_loss NUMERIC,
  avg_loan_size NUMERIC
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
    COUNT(*) FILTER (WHERE status = 'Performing') AS performing_count,
    COUNT(*) FILTER (WHERE status = 'Non-Performing') AS non_performing_count,
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