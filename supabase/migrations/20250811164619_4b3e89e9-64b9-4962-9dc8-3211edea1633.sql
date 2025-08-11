-- First, let's update non-numeric values to NULL for loan_type (remaining_term)
UPDATE public.loan_data 
SET loan_type = NULL 
WHERE loan_type !~ '^[0-9]+\.?[0-9]*$' AND loan_type IS NOT NULL;

-- Now rename loan_type to remaining_term and change to numeric type
ALTER TABLE public.loan_data 
RENAME COLUMN loan_type TO remaining_term;

ALTER TABLE public.loan_data 
ALTER COLUMN remaining_term TYPE numeric USING CASE 
  WHEN remaining_term ~ '^[0-9]+\.?[0-9]*$' THEN remaining_term::numeric 
  ELSE NULL 
END;

-- Rename credit_score to lgd (it's already numeric, but we'll ensure it)
ALTER TABLE public.loan_data 
RENAME COLUMN credit_score TO lgd;

-- Add comments to clarify what these fields contain
COMMENT ON COLUMN public.loan_data.remaining_term IS 'Remaining term in months';
COMMENT ON COLUMN public.loan_data.lgd IS 'Loss Given Default as a decimal (e.g., 0.45 for 45%)';