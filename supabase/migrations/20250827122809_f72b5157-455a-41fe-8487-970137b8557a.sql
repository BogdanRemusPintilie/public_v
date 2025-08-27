-- Create a database function to copy filtered data efficiently on the server side
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
  p_max_lgd numeric DEFAULT NULL
)
RETURNS TABLE(records_copied bigint)
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  copied_count bigint;
BEGIN
  -- Perform the INSERT...SELECT operation with all filters
  INSERT INTO loan_data (
    user_id, dataset_name, loan_amount, interest_rate, term, remaining_term,
    lgd, ltv, opening_balance, pd, file_name, worksheet_name
  )
  SELECT 
    user_id, p_new_dataset as dataset_name, loan_amount, interest_rate, term, remaining_term,
    lgd, ltv, opening_balance, pd, file_name, worksheet_name
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
    AND (p_max_lgd IS NULL OR COALESCE(lgd, 0) <= p_max_lgd);

  -- Get the number of rows that were copied
  GET DIAGNOSTICS copied_count = ROW_COUNT;
  
  -- Return the count
  RETURN QUERY SELECT copied_count;
END;
$function$;