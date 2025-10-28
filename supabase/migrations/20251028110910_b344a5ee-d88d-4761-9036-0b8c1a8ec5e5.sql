-- Backfill pd column from probability_of_default for existing records
UPDATE corporate_term_loans_data 
SET pd = probability_of_default 
WHERE pd IS NULL 
  AND probability_of_default IS NOT NULL;