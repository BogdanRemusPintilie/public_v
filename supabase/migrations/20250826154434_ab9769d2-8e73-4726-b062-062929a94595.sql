-- Remove duplicate records from loan_data table for dataset 'Full Loan Tape 26/08'
-- Keep only the oldest record (by created_at) for each unique combination of loan data

DELETE FROM loan_data 
WHERE id IN (
  SELECT id 
  FROM (
    SELECT id,
           ROW_NUMBER() OVER (
             PARTITION BY loan_amount, interest_rate, term, remaining_term, opening_balance, ltv, pd, lgd, dataset_name
             ORDER BY created_at ASC
           ) as rn
    FROM loan_data 
    WHERE dataset_name = 'Full Loan Tape 26/08'
  ) t
  WHERE rn > 1
);