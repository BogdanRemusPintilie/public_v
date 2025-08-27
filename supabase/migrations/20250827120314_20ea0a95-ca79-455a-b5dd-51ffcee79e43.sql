-- Change remaining_term column from text to numeric
ALTER TABLE public.loan_data 
ALTER COLUMN remaining_term TYPE numeric USING remaining_term::numeric;