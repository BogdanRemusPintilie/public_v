-- Create new function for CTL filtered dataset copying with exposure management
CREATE OR REPLACE FUNCTION public.copy_filtered_ctl_dataset(
  p_source_dataset text,
  p_new_dataset text,
  p_user_id uuid,
  p_min_loan_amount numeric DEFAULT NULL,
  p_max_loan_amount numeric DEFAULT NULL,
  p_min_leverage_ratio numeric DEFAULT NULL,
  p_max_leverage_ratio numeric DEFAULT NULL,
  p_credit_rating_filter text DEFAULT NULL,
  p_max_exposure_cap numeric DEFAULT NULL,
  p_exposure_cap_amount numeric DEFAULT NULL
)
RETURNS TABLE(records_copied bigint)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  copied_count bigint;
BEGIN
  INSERT INTO corporate_term_loans_data (
    user_id, dataset_name, loan_amount, facility_amount, interest_rate, margin,
    origination_date, maturity_date, term, remaining_term, pd, lgd, probability_of_default,
    collateral_coverage_ratio, leverage_ratio, interest_coverage_ratio, debt_service_coverage_ratio,
    current_balance, opening_balance, base_rate, currency, country, credit_rating,
    amortization_type, borrower_name, covenant_status, performing_status, arrears_days,
    industry_sector, collateral_type, secured_unsecured, file_name, worksheet_name
  )
  SELECT 
    user_id,
    p_new_dataset as dataset_name,
    CASE 
      WHEN p_exposure_cap_amount IS NOT NULL 
      THEN LEAST(loan_amount, p_exposure_cap_amount)
      ELSE loan_amount
    END as loan_amount,
    facility_amount,
    interest_rate,
    margin,
    origination_date,
    maturity_date,
    term,
    remaining_term,
    pd,
    lgd,
    probability_of_default,
    collateral_coverage_ratio,
    leverage_ratio,
    interest_coverage_ratio,
    debt_service_coverage_ratio,
    CASE 
      WHEN p_exposure_cap_amount IS NOT NULL 
      THEN LEAST(current_balance, p_exposure_cap_amount)
      ELSE current_balance
    END as current_balance,
    CASE 
      WHEN p_exposure_cap_amount IS NOT NULL AND opening_balance IS NOT NULL
      THEN LEAST(opening_balance, p_exposure_cap_amount)
      ELSE opening_balance
    END as opening_balance,
    base_rate,
    currency,
    country,
    credit_rating,
    amortization_type,
    borrower_name,
    covenant_status,
    performing_status,
    arrears_days,
    industry_sector,
    collateral_type,
    secured_unsecured,
    file_name,
    worksheet_name
  FROM corporate_term_loans_data 
  WHERE user_id = p_user_id 
    AND dataset_name = p_source_dataset
    AND (p_min_loan_amount IS NULL OR loan_amount >= p_min_loan_amount)
    AND (p_max_loan_amount IS NULL OR loan_amount <= p_max_loan_amount)
    AND (p_min_leverage_ratio IS NULL OR leverage_ratio >= p_min_leverage_ratio)
    AND (p_max_leverage_ratio IS NULL OR leverage_ratio <= p_max_leverage_ratio)
    AND (p_credit_rating_filter IS NULL OR credit_rating = p_credit_rating_filter)
    AND (p_max_exposure_cap IS NULL OR current_balance <= p_max_exposure_cap);

  GET DIAGNOSTICS copied_count = ROW_COUNT;
  
  RETURN QUERY SELECT copied_count;
END;
$function$;

-- Update existing consumer finance function to support exposure management
CREATE OR REPLACE FUNCTION public.copy_filtered_dataset(
  p_source_dataset text,
  p_new_dataset text,
  p_user_id uuid,
  p_min_loan_amount numeric DEFAULT NULL,
  p_max_loan_amount numeric DEFAULT NULL,
  p_min_interest_rate numeric DEFAULT NULL,
  p_max_interest_rate numeric DEFAULT NULL,
  p_min_remaining_term numeric DEFAULT NULL,
  p_max_remaining_term numeric DEFAULT NULL,
  p_min_pd numeric DEFAULT NULL,
  p_max_pd numeric DEFAULT NULL,
  p_min_lgd numeric DEFAULT NULL,
  p_max_lgd numeric DEFAULT NULL,
  p_max_exposure_cap numeric DEFAULT NULL,
  p_exposure_cap_amount numeric DEFAULT NULL
)
RETURNS TABLE(records_copied bigint)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  copied_count bigint;
BEGIN
  INSERT INTO loan_data (
    user_id, dataset_name, loan_amount, interest_rate, term, remaining_term,
    lgd, ltv, opening_balance, pd, file_name, worksheet_name, loan_type
  )
  SELECT 
    user_id,
    p_new_dataset as dataset_name,
    CASE 
      WHEN p_exposure_cap_amount IS NOT NULL 
      THEN LEAST(loan_amount, p_exposure_cap_amount)
      ELSE loan_amount
    END as loan_amount,
    interest_rate,
    term,
    remaining_term,
    lgd,
    ltv,
    CASE 
      WHEN p_exposure_cap_amount IS NOT NULL 
      THEN LEAST(opening_balance, p_exposure_cap_amount)
      ELSE opening_balance
    END as opening_balance,
    pd,
    file_name,
    worksheet_name,
    loan_type
  FROM loan_data 
  WHERE user_id = p_user_id 
    AND dataset_name = p_source_dataset
    AND (p_min_loan_amount IS NULL OR loan_amount >= p_min_loan_amount)
    AND (p_max_loan_amount IS NULL OR loan_amount <= p_max_loan_amount)
    AND (p_min_interest_rate IS NULL OR interest_rate >= p_min_interest_rate)
    AND (p_max_interest_rate IS NULL OR interest_rate <= p_max_interest_rate)
    AND (p_min_remaining_term IS NULL OR remaining_term >= p_min_remaining_term)
    AND (p_max_remaining_term IS NULL OR remaining_term <= p_max_remaining_term)
    AND (p_min_pd IS NULL OR COALESCE(pd, 0) >= p_min_pd)
    AND (p_max_pd IS NULL OR COALESCE(pd, 0) <= p_max_pd)
    AND (p_min_lgd IS NULL OR COALESCE(lgd, 0) >= p_min_lgd)
    AND (p_max_lgd IS NULL OR COALESCE(lgd, 0) <= p_max_lgd)
    AND (p_max_exposure_cap IS NULL OR opening_balance <= p_max_exposure_cap);

  GET DIAGNOSTICS copied_count = ROW_COUNT;
  
  RETURN QUERY SELECT copied_count;
END;
$function$;