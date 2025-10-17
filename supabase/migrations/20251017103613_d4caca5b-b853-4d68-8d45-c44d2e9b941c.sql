-- Add missing columns to offers table
ALTER TABLE offers 
ADD COLUMN structure_sector TEXT,
ADD COLUMN expected_pool_size NUMERIC,
ADD COLUMN weighted_average_life NUMERIC;