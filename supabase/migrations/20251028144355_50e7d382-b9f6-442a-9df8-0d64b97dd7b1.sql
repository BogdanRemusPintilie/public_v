-- Update get_ctl_portfolio_summary to include exposure cap parameters
DROP FUNCTION IF EXISTS public.get_ctl_portfolio_summary(text, numeric, numeric, numeric, numeric, text);

CREATE OR REPLACE FUNCTION public.get_ctl_portfolio_summary(
  dataset_name_param text,
  min_loan_amount numeric DEFAULT NULL,
  max_loan_amount numeric DEFAULT NULL,
  min_leverage_ratio numeric DEFAULT NULL,
  max_leverage_ratio numeric DEFAULT NULL,
  credit_rating_filter text DEFAULT NULL,
  p_max_exposure_cap numeric DEFAULT NULL
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
SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY
  WITH normalized_data AS (
    SELECT
      ctl.current_balance,
      ctl.loan_amount,
      ctl.leverage_ratio,
      ctl.performing_status,
      CASE 
        WHEN COALESCE(ctl.pd, ctl.probability_of_default) <= 1 
        THEN COALESCE(ctl.pd, ctl.probability_of_default, 0) * 100 
        ELSE COALESCE(ctl.pd, ctl.probability_of_default, 0)
      END AS pd_pct,
      CASE 
        WHEN ctl.lgd > 1 THEN ctl.lgd / 100 
        ELSE ctl.lgd 
      END AS lgd_frac,
      CASE 
        WHEN ctl.interest_rate <= 1 THEN ctl.interest_rate * 100 
        ELSE ctl.interest_rate 
      END AS ir_pct
    FROM corporate_term_loans_data ctl
    WHERE ctl.dataset_name = dataset_name_param
      AND (
        ctl.user_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM dataset_shares ds
          WHERE ds.dataset_name = ctl.dataset_name
            AND (ds.shared_with_user_id = auth.uid() OR ds.shared_with_email = auth.email())
        )
      )
      AND (min_loan_amount IS NULL OR ctl.loan_amount >= min_loan_amount)
      AND (max_loan_amount IS NULL OR ctl.loan_amount <= max_loan_amount)
      AND (min_leverage_ratio IS NULL OR ctl.leverage_ratio >= min_leverage_ratio)
      AND (max_leverage_ratio IS NULL OR ctl.leverage_ratio <= max_leverage_ratio)
      AND (credit_rating_filter IS NULL OR ctl.credit_rating = credit_rating_filter)
      AND (p_max_exposure_cap IS NULL OR ctl.current_balance <= p_max_exposure_cap)
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
$function$;