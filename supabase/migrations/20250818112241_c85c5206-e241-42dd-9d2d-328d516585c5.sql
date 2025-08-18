-- Change lgd column from integer to numeric to support decimal values
ALTER TABLE public.loan_data 
ALTER COLUMN lgd TYPE NUMERIC USING lgd::NUMERIC;

-- Add a comment to document the column purpose
COMMENT ON COLUMN public.loan_data.lgd IS 'Loss Given Default - supports decimal values (e.g., 0.45 for 45%)';