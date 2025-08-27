-- First, make the column nullable to allow cleanup
ALTER TABLE public.loan_data 
ALTER COLUMN remaining_term DROP NOT NULL;

-- Update non-numeric values to a default numeric value (0)
UPDATE public.loan_data 
SET remaining_term = '0' 
WHERE remaining_term !~ '^[0-9]+\.?[0-9]*$';

-- Now change the column type from text to numeric
ALTER TABLE public.loan_data 
ALTER COLUMN remaining_term TYPE numeric USING remaining_term::numeric;

-- Restore the NOT NULL constraint if desired
ALTER TABLE public.loan_data 
ALTER COLUMN remaining_term SET NOT NULL;