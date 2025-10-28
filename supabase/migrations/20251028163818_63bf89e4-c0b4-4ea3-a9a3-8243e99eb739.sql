-- Function to get borrower concentration analysis for corporate term loans
CREATE OR REPLACE FUNCTION public.get_ctl_borrower_concentration(
  dataset_name_param text,
  p_min_loan_amount numeric DEFAULT NULL,
  p_max_loan_amount numeric DEFAULT NULL,
  p_min_leverage_ratio numeric DEFAULT NULL,
  p_max_leverage_ratio numeric DEFAULT NULL,
  p_credit_rating_filter text DEFAULT NULL,
  p_max_exposure_cap numeric DEFAULT NULL
)
RETURNS TABLE(
  borrower_name text,
  total_exposure numeric,
  loan_count bigint,
  avg_credit_rating text,
  portfolio_share numeric,
  avg_interest_rate numeric,
  avg_leverage_ratio numeric
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  total_portfolio_exposure numeric;
BEGIN
  -- First get total portfolio exposure for share calculation
  SELECT COALESCE(SUM(ctl.current_balance), 0)
  INTO total_portfolio_exposure
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
    AND (p_min_loan_amount IS NULL OR ctl.loan_amount >= p_min_loan_amount)
    AND (p_max_loan_amount IS NULL OR ctl.loan_amount <= p_max_loan_amount)
    AND (p_min_leverage_ratio IS NULL OR ctl.leverage_ratio >= p_min_leverage_ratio)
    AND (p_max_leverage_ratio IS NULL OR ctl.leverage_ratio <= p_max_leverage_ratio)
    AND (p_credit_rating_filter IS NULL OR ctl.credit_rating = p_credit_rating_filter)
    AND (p_max_exposure_cap IS NULL OR ctl.current_balance <= p_max_exposure_cap);

  -- Return aggregated borrower data
  RETURN QUERY
  SELECT 
    COALESCE(ctl.borrower_name, 'Unknown') as borrower_name,
    COALESCE(SUM(ctl.current_balance), 0) as total_exposure,
    COUNT(*) as loan_count,
    MODE() WITHIN GROUP (ORDER BY ctl.credit_rating) as avg_credit_rating,
    CASE 
      WHEN total_portfolio_exposure > 0 
      THEN ROUND((COALESCE(SUM(ctl.current_balance), 0) / total_portfolio_exposure * 100)::numeric, 2)
      ELSE 0
    END as portfolio_share,
    ROUND(COALESCE(AVG(
      CASE 
        WHEN ctl.interest_rate <= 1 THEN ctl.interest_rate * 100 
        ELSE ctl.interest_rate 
      END
    ), 0)::numeric, 2) as avg_interest_rate,
    ROUND(COALESCE(AVG(ctl.leverage_ratio), 0)::numeric, 2) as avg_leverage_ratio
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
    AND (p_min_loan_amount IS NULL OR ctl.loan_amount >= p_min_loan_amount)
    AND (p_max_loan_amount IS NULL OR ctl.loan_amount <= p_max_loan_amount)
    AND (p_min_leverage_ratio IS NULL OR ctl.leverage_ratio >= p_min_leverage_ratio)
    AND (p_max_leverage_ratio IS NULL OR ctl.leverage_ratio <= p_max_leverage_ratio)
    AND (p_credit_rating_filter IS NULL OR ctl.credit_rating = p_credit_rating_filter)
    AND (p_max_exposure_cap IS NULL OR ctl.current_balance <= p_max_exposure_cap)
  GROUP BY ctl.borrower_name
  ORDER BY total_exposure DESC;
END;
$function$;