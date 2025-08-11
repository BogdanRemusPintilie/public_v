-- Rename loan_type to remaining_term and change to numeric type
ALTER TABLE public.loan_data 
RENAME COLUMN loan_type TO remaining_term;

ALTER TABLE public.loan_data 
ALTER COLUMN remaining_term TYPE numeric USING remaining_term::numeric;

-- Rename credit_score to lgd (Loss Given Default)
ALTER TABLE public.loan_data 
RENAME COLUMN credit_score TO lgd;

-- Ensure lgd column is numeric (it should already be, but making sure)
ALTER TABLE public.loan_data 
ALTER COLUMN lgd TYPE numeric USING lgd::numeric;

-- Add comments to clarify what these fields contain
COMMENT ON COLUMN public.loan_data.remaining_term IS 'Remaining term in months';
COMMENT ON COLUMN public.loan_data.lgd IS 'Loss Given Default as a decimal (e.g., 0.45 for 45%)';