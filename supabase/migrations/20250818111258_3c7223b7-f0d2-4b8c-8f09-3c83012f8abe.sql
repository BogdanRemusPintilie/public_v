-- Rename columns to match the expected schema
ALTER TABLE public.loan_data 
RENAME COLUMN loan_type TO remaining_term;

ALTER TABLE public.loan_data 
RENAME COLUMN credit_score TO lgd;

-- Update any comments for clarity
COMMENT ON COLUMN public.loan_data.remaining_term IS 'Remaining term of the loan';
COMMENT ON COLUMN public.loan_data.lgd IS 'Loss Given Default';