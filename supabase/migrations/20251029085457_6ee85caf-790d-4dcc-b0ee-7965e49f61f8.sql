-- Drop and recreate get_portfolio_summary to include weighted average metrics
DROP FUNCTION IF EXISTS public.get_portfolio_summary(text, numeric, numeric, numeric, numeric, numeric, numeric, numeric, numeric, numeric, numeric);

CREATE FUNCTION public.get_portfolio_summary(
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
RETURNS TABLE(
  total_value numeric,
  avg_interest_rate numeric,
  high_risk_loans bigint,
  total_records bigint,
  weighted_avg_interest_rate numeric,
  weighted_avg_ltv numeric,
  weighted_avg_pd numeric,
  weighted_avg_lgd numeric,
  expected_loss numeric
)
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    COALESCE(SUM(ld.opening_balance), 0) as total_value,
    COALESCE(AVG(ld.interest_rate), 0) as avg_interest_rate,
    COUNT(CASE WHEN COALESCE(ld.pd, 0) > 0.10 THEN 1 END) as high_risk_loans,
    COUNT(*) as total_records,
    -- Weighted average interest rate by opening balance
    COALESCE(
      SUM(ld.interest_rate * ld.opening_balance) / NULLIF(SUM(ld.opening_balance), 0),
      0
    ) as weighted_avg_interest_rate,
    -- Weighted average LTV by opening balance
    COALESCE(
      SUM(ld.ltv * ld.opening_balance) / NULLIF(SUM(ld.opening_balance), 0),
      0
    ) as weighted_avg_ltv,
    -- Weighted average PD by opening balance (return as percentage)
    COALESCE(
      SUM(COALESCE(ld.pd, 0) * ld.opening_balance) / NULLIF(SUM(ld.opening_balance), 0) * 100,
      0
    ) as weighted_avg_pd,
    -- Weighted average LGD by opening balance (return as percentage)
    COALESCE(
      SUM(ld.lgd * ld.opening_balance) / NULLIF(SUM(ld.opening_balance), 0) * 100,
      0
    ) as weighted_avg_lgd,
    -- Expected Loss = Sum(PD * LGD * Opening Balance)
    COALESCE(
      SUM(COALESCE(ld.pd, 0) * ld.lgd * ld.opening_balance),
      0
    ) as expected_loss
  FROM loan_data ld
  WHERE ld.dataset_name = dataset_name_param
    AND (
      ld.user_id = auth.uid()
      OR EXISTS (
        SELECT 1
        FROM dataset_shares ds
        WHERE ds.dataset_name = ld.dataset_name
          AND (ds.shared_with_user_id = auth.uid() OR ds.shared_with_email = auth.email())
      )
    )
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
$$;