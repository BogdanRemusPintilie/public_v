
-- Add the pd (Probability of Default) column to the loan_data table
ALTER TABLE public.loan_data 
ADD COLUMN IF NOT EXISTS pd NUMERIC;

-- Update the updated_at trigger to include the new column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';
