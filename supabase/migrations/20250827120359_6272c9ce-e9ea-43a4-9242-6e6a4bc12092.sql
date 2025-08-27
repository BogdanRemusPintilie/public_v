-- First, let's see what non-numeric values exist in remaining_term
-- and handle them before changing the column type

-- Update non-numeric values to NULL or a default numeric value
UPDATE public.loan_data 
SET remaining_term = NULL 
WHERE remaining_term !~ '^[0-9]+\.?[0-9]*$';

-- Now change the column type from text to numeric
ALTER TABLE public.loan_data 
ALTER COLUMN remaining_term TYPE numeric USING CASE 
  WHEN remaining_term ~ '^[0-9]+\.?[0-9]*$' THEN remaining_term::numeric 
  ELSE NULL 
END;