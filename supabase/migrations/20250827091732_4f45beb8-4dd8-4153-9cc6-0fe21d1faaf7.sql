
-- Convert remaining_term column from text to numeric
-- First, update any null or empty values to handle the conversion
UPDATE loan_data 
SET remaining_term = '0' 
WHERE remaining_term IS NULL OR remaining_term = '';

-- Convert the column to numeric type
ALTER TABLE loan_data 
ALTER COLUMN remaining_term TYPE numeric 
USING remaining_term::numeric;

-- Set a proper default value for future inserts
ALTER TABLE loan_data 
ALTER COLUMN remaining_term SET DEFAULT 0;

-- Make it not nullable since it should always have a value
ALTER TABLE loan_data 
ALTER COLUMN remaining_term SET NOT NULL;
